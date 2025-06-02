const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const net = require('net');
const axios = require('axios');

// Fonction pour trouver un port disponible
async function findAvailablePort(startPort = 8000) {
  let port = startPort;
  const maxPort = startPort + 1000; // Limiter la recherche à 1000 ports

  while (port < maxPort) {
    try {
      const server = net.createServer();
      await new Promise((resolve, reject) => {
        server.once('error', (err) => {
          server.close();
          if (err.code === 'EADDRINUSE') {
            resolve(false);
          } else {
            reject(err);
          }
        });
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        server.listen(port);
      });
      return port;
    } catch (err) {
      console.error(`Erreur lors de la vérification du port ${port}:`, err);
    }
    port++;
  }
  throw new Error(`Impossible de trouver un port disponible après ${maxPort - startPort} tentatives`);
}

// Variable pour stocker le serveur PHP en cours d'exécution
let phpServer = null;
let phpServerPort = null;
let phpServerRoot = null;

// Fonction pour démarrer le serveur PHP s'il n'est pas déjà en cours d'exécution
async function ensurePhpServerRunning() {
  if (phpServer && phpServerPort && phpServerRoot) {
    // Vérifier si le serveur est toujours accessible
    try {
      const testServer = net.createServer();
      await new Promise((resolve, reject) => {
        testServer.once('error', (err) => {
          testServer.close();
          if (err.code === 'EADDRINUSE') {
            // Le port est utilisé, donc le serveur est probablement en cours d'exécution
            resolve(true);
          } else {
            reject(err);
          }
        });
        testServer.once('listening', () => {
          // Le port est libre, donc le serveur n'est plus en cours d'exécution
          testServer.close();
          resolve(false);
        });
        testServer.listen(phpServerPort);
      });
      
      // Si nous arrivons ici, le serveur est toujours en cours d'exécution
      return { port: phpServerPort, root: phpServerRoot };
    } catch (err) {
      console.error('Erreur lors de la vérification du serveur PHP:', err);
      // Continuer pour redémarrer le serveur
    }
  }
  
  // Arrêter l'ancien serveur s'il existe
  if (phpServer) {
    try {
      phpServer.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error('Erreur lors de l\'arrêt du serveur PHP:', err);
    }
  }
  
  // Créer un répertoire temporaire pour le serveur PHP
  phpServerRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'php-server-'));
  phpServerPort = await findAvailablePort();
  
  // Démarrer le serveur PHP
  console.log(`Démarrage du serveur PHP sur le port ${phpServerPort} avec racine ${phpServerRoot}`);
  phpServer = spawn('php', ['-S', `0.0.0.0:${phpServerPort}`, '-t', phpServerRoot]);
  
  // Gérer les logs du serveur PHP
  phpServer.stdout.on('data', (data) => {
    console.log(`[PHP Server] ${data}`);
  });
  
  phpServer.stderr.on('data', (data) => {
    console.error(`[PHP Server Error] ${data}`);
  });
  
  phpServer.on('close', (code) => {
    console.log(`Serveur PHP arrêté avec le code ${code}`);
    phpServer = null;
    phpServerPort = null;
  });
  
  phpServer.on('error', (err) => {
    console.error(`Erreur du serveur PHP: ${err.message}`);
    phpServer = null;
    phpServerPort = null;
  });
  
  // Attendre que le serveur soit prêt
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Vérifier que le serveur est bien démarré
  try {
    const testServer = net.createServer();
    const isRunning = await new Promise((resolve) => {
      testServer.once('error', (err) => {
        testServer.close();
        if (err.code === 'EADDRINUSE') {
          // Le port est utilisé, donc le serveur est en cours d'exécution
          resolve(true);
        } else {
          resolve(false);
        }
      });
      testServer.once('listening', () => {
        // Le port est libre, donc le serveur n'est pas en cours d'exécution
        testServer.close();
        resolve(false);
      });
      testServer.listen(phpServerPort);
    });
    
    if (!isRunning) {
      throw new Error(`Le serveur PHP n'a pas pu démarrer sur le port ${phpServerPort}`);
    }
  } catch (err) {
    console.error('Erreur lors de la vérification du serveur PHP:', err);
    throw new Error(`Impossible de démarrer le serveur PHP: ${err.message}`);
  }
  
  return { port: phpServerPort, root: phpServerRoot };
}

/**
 * Évalue du code PHP en utilisant un serveur PHP réel
 * @param {string} phpCode - Le code PHP à évaluer
 * @param {object} req - L'objet requête Express
 * @param {object} res - L'objet réponse Express
 * @returns {Promise<void>}
 */
async function evaluatePhp(phpCode, req, res) {
  try {
    // S'assurer que le serveur PHP est en cours d'exécution
    const { port, root } = await ensurePhpServerRunning();
    
    // Générer un nom de fichier unique pour cette requête
    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    const phpFilePath = path.join(root, `${uniqueId}.php`);
    
    // Préparer le code PHP final
    let finalPhpCode = phpCode.trim();
    
    // Ajouter la balise PHP ouvrante si elle n'est pas présente
    if (!finalPhpCode.startsWith('<?php')) {
      finalPhpCode = `<?php\n${finalPhpCode}`;
    }
    
    // Écrire le code dans le fichier temporaire
    await fs.writeFile(phpFilePath, finalPhpCode);
    
    console.log(`Fichier PHP créé: ${phpFilePath}`);
    
    // Préparer les en-têtes pour la requête au serveur PHP
    const headers = { ...req.headers };
    delete headers.host; // Supprimer l'en-tête host pour éviter les conflits
    
    // Faire une requête au serveur PHP avec axios
    // Utiliser 127.0.0.1 au lieu de localhost pour éviter les problèmes de résolution DNS
    console.log(`Envoi de la requête au serveur PHP: http://127.0.0.1:${port}/${uniqueId}.php`);
    
    // Construire l'URL avec les paramètres GET
    let url = `http://127.0.0.1:${port}/${uniqueId}.php`;
    const queryParams = new URLSearchParams(req.query).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }
    
    console.log(`URL complète avec paramètres: ${url}`);
    
    const response = await axios({
      method: req.method,
      url: url,
      headers: headers,
      data: req.body,
      // Ne pas utiliser params car nous avons déjà ajouté les paramètres à l'URL
      maxRedirects: 0, // Ne pas suivre les redirections automatiquement
      validateStatus: () => true, // Accepter tous les codes de statut
      timeout: 60000, // Timeout de 60 secondes
    });
    
    console.log(`Réponse du serveur PHP: ${response.status}`);
    console.log(`En-têtes de réponse:`, response.headers);
    
    // Nettoyer le fichier temporaire
    try {
      await fs.unlink(phpFilePath);
      console.log(`Fichier PHP supprimé: ${phpFilePath}`);
    } catch (cleanupError) {
      console.error(`Erreur lors de la suppression du fichier PHP: ${cleanupError.message}`);
    }
    
    // Transférer les en-têtes de la réponse PHP à la réponse Express
    Object.entries(response.headers).forEach(([key, value]) => {
      // Ne pas transférer certains en-têtes qui sont gérés par Express
      if (!['content-length', 'connection', 'keep-alive', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    
    // Ajouter les en-têtes CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE,PUT');
    
    // Définir le code de statut
    res.status(response.status);
    
    // Renvoyer le corps de la réponse
    return res.send(response.data);
  } catch (error) {
    console.error('Erreur lors de l\'évaluation du code PHP:', error);
    return res.status(500).send('Erreur lors de l\'évaluation du code PHP');
  }
}

// Fonction pour arrêter le serveur PHP lors de l'arrêt de l'application
process.on('exit', () => {
  if (phpServer) {
    console.log('Arrêt du serveur PHP...');
    phpServer.kill();
  }
});

// Capturer également SIGINT et SIGTERM
process.on('SIGINT', () => {
  if (phpServer) {
    console.log('Arrêt du serveur PHP suite à SIGINT...');
    phpServer.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (phpServer) {
    console.log('Arrêt du serveur PHP suite à SIGTERM...');
    phpServer.kill();
  }
  process.exit(0);
});

module.exports = evaluatePhp;
