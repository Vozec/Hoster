const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const net = require('net');
const axios = require('axios');

async function findAvailablePort(startPort = 8000) {
  let port = startPort;
  const maxPort = startPort + 1000;

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
  throw new Error(
    `Impossible de trouver un port disponible après ${maxPort - startPort} tentatives`
  );
}

let phpServer = null;
let phpServerPort = null;
let phpServerRoot = null;

async function ensurePhpServerRunning() {
  if (phpServer && phpServerPort && phpServerRoot) {
    try {
      const testServer = net.createServer();
      await new Promise((resolve, reject) => {
        testServer.once('error', (err) => {
          testServer.close();
          if (err.code === 'EADDRINUSE') {
            resolve(true);
          } else {
            reject(err);
          }
        });
        testServer.once('listening', () => {
          testServer.close();
          resolve(false);
        });
        testServer.listen(phpServerPort);
      });

      return { port: phpServerPort, root: phpServerRoot };
    } catch (err) {
      console.error('Erreur lors de la vérification du serveur PHP:', err);
    }
  }

  if (phpServer) {
    try {
      phpServer.kill();
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Erreur lors de l'arrêt du serveur PHP:", err);
    }
  }

  phpServerRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'php-server-'));
  phpServerPort = await findAvailablePort();

  console.log(`Démarrage du serveur PHP sur le port ${phpServerPort} avec racine ${phpServerRoot}`);
  phpServer = spawn('php', ['-S', `0.0.0.0:${phpServerPort}`, '-t', phpServerRoot]);

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

  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const testServer = net.createServer();
    const isRunning = await new Promise((resolve) => {
      testServer.once('error', (err) => {
        testServer.close();
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      testServer.once('listening', () => {
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

async function evaluatePhp(phpCode, req, res) {
  try {
    const { port, root } = await ensurePhpServerRunning();

    const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    const phpFilePath = path.join(root, `${uniqueId}.php`);

    let finalPhpCode = phpCode.trim();

    if (!finalPhpCode.startsWith('<?php')) {
      finalPhpCode = `<?php\n${finalPhpCode}`;
    }

    await fs.writeFile(phpFilePath, finalPhpCode);

    console.log(`Fichier PHP créé: ${phpFilePath}`);

    const headers = { ...req.headers };
    delete headers.host;

    console.log(`Envoi de la requête au serveur PHP: http://127.0.0.1:${port}/${uniqueId}.php`);

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

      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 60000,
    });

    console.log(`Réponse du serveur PHP: ${response.status}`);
    console.log(`En-têtes de réponse:`, response.headers);

    try {
      await fs.unlink(phpFilePath);
      console.log(`Fichier PHP supprimé: ${phpFilePath}`);
    } catch (cleanupError) {
      console.error(`Erreur lors de la suppression du fichier PHP: ${cleanupError.message}`);
    }

    const skipHeaders = new Set([
      'content-length',
      'connection',
      'keep-alive',
      'transfer-encoding',
      'access-control-allow-origin',
      'access-control-allow-headers',
      'access-control-allow-methods',
      'access-control-allow-credentials',
    ]);
    Object.entries(response.headers).forEach(([key, value]) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status);

    return res.send(response.data);
  } catch (error) {
    console.error("Erreur lors de l'évaluation du code PHP:", error);
    return res.status(500).send("Erreur lors de l'évaluation du code PHP");
  }
}

process.on('exit', () => {
  if (phpServer) {
    console.log('Arrêt du serveur PHP...');
    phpServer.kill();
  }
});

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
