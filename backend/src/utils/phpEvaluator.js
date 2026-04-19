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
const recentStderr = [];
const MAX_STDERR_LINES = 100;

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
  phpServer = spawn('php', [
    '-d', 'display_errors=On',
    '-d', 'display_startup_errors=On',
    '-d', 'error_reporting=E_ALL',
    '-S', `0.0.0.0:${phpServerPort}`,
    '-t', phpServerRoot,
  ]);

  phpServer.stdout.on('data', (data) => {
    console.log(`[PHP Server] ${data}`);
  });

  phpServer.stderr.on('data', (data) => {
    const str = data.toString();
    console.error(`[PHP Server Error] ${str}`);
    for (const line of str.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      recentStderr.push({ ts: Date.now(), line: trimmed });
      if (recentStderr.length > MAX_STDERR_LINES) recentStderr.shift();
    }
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

    const headers = { ...req.headers };
    delete headers.host;

    let url = `http://127.0.0.1:${port}/${uniqueId}.php`;
    const queryParams = new URLSearchParams(req.query).toString();
    if (queryParams) {
      url += `?${queryParams}`;
    }

    const response = await axios({
      method: req.method,
      url: url,
      headers: headers,
      data: req.body,

      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 60000,
    });

    try {
      await fs.unlink(phpFilePath);
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

    const body = response.data;
    const bodyIsEmpty =
      body == null ||
      (typeof body === 'string' && body.length === 0) ||
      (Buffer.isBuffer(body) && body.length === 0);

    if (response.status >= 500 && bodyIsEmpty) {
      await new Promise((r) => setTimeout(r, 50));
      const since = Date.now() - 3000;
      const errLines = recentStderr.filter((e) => e.ts >= since).map((e) => e.line);
      const escape = (s) =>
        String(s ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Erreur PHP ${response.status}</title>
<style>
  body{font-family:system-ui,sans-serif;background:#1e1e1e;color:#e6e6e6;margin:0;padding:2rem}
  .card{max-width:900px;margin:0 auto;background:#2a2a2a;border-left:4px solid #e06c75;padding:1.5rem 2rem;border-radius:4px}
  h1{margin:0 0 .5rem;color:#e06c75;font-size:1.3rem}
  .meta{color:#888;font-size:.85rem;margin-bottom:1rem}
  pre{background:#111;padding:1rem;border-radius:4px;overflow-x:auto;font-size:.85rem;line-height:1.5;color:#c0c0c0;white-space:pre-wrap;word-break:break-word}
</style>
</head>
<body>
<div class="card">
  <h1>Erreur PHP (${response.status})</h1>
  <div class="meta">Le serveur PHP n'a renvoyé aucun corps. Sortie stderr récente :</div>
  <pre>${errLines.length ? escape(errLines.join('\n')) : '(aucune sortie stderr capturée)'}</pre>
</div>
</body>
</html>`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(response.status);
      return res.send(html);
    }

    res.status(response.status);

    return res.send(body);
  } catch (error) {
    console.error("Erreur lors de l'évaluation du code PHP:", error);
    const escape = (s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Erreur lors de l'évaluation PHP</title>
<style>
  body{font-family:system-ui,sans-serif;background:#1e1e1e;color:#e6e6e6;margin:0;padding:2rem}
  .card{max-width:900px;margin:0 auto;background:#2a2a2a;border-left:4px solid #e06c75;padding:1.5rem 2rem;border-radius:4px}
  h1{margin:0 0 .5rem;color:#e06c75;font-size:1.3rem}
  .msg{color:#f0f0f0;margin:1rem 0;font-size:1rem;white-space:pre-wrap}
  pre{background:#111;padding:1rem;border-radius:4px;overflow-x:auto;font-size:.85rem;line-height:1.4;color:#c0c0c0}
  .label{color:#888;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;margin-top:1rem}
</style>
</head>
<body>
<div class="card">
  <h1>Erreur lors de l'évaluation PHP</h1>
  <div class="label">Message</div>
  <div class="msg">${escape(error.message || 'Unknown error')}</div>
  ${error.code ? `<div class="label">Code</div><div class="msg">${escape(error.code)}</div>` : ''}
  ${error.stack ? `<div class="label">Stack</div><pre>${escape(error.stack)}</pre>` : ''}
</div>
</body>
</html>`;
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
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
