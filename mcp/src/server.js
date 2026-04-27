#!/usr/bin/env node
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { createHosterClient } from './hosterClient.js';

const HOSTER_URL = process.env.HOSTER_URL || 'http://backend:3000';
const HOSTER_API_KEY = process.env.HOSTER_API_KEY || (process.env.API_KEY || '').split(',')[0]?.trim();
const HOSTER_API_PATH = process.env.HOSTER_API_PATH || '/api';
const TRANSPORT = (process.env.MCP_TRANSPORT || 'http').toLowerCase();
const HTTP_HOST = process.env.MCP_HOST || '0.0.0.0';
const HTTP_PORT = parseInt(process.env.MCP_PORT || '3333', 10);
const HTTP_AUTH_KEY = process.env.MCP_AUTH_KEY || HOSTER_API_KEY;

const client = createHosterClient({
  baseUrl: HOSTER_URL,
  apiKey: HOSTER_API_KEY,
  apiPath: HOSTER_API_PATH,
});

function asJson(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function asError(err) {
  const payload = {
    error: err.message || String(err),
    status: err.status,
    body: err.body,
  };
  return { isError: true, content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function buildServer() {
  const server = new McpServer({
    name: 'hoster-mcp',
    version: '1.0.0',
  });

  // ───── Routes ─────
  server.tool(
    'list_routes',
    'List Hoster routes. Optional filters: category (classic|temporary), tag, full-text search.',
    {
      category: z.enum(['classic', 'temporary']).optional(),
      tag: z.string().optional(),
      search: z.string().optional(),
    },
    async (args) => {
      try {
        const data = await client.listRoutes(args);
        return asJson(data);
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'get_route',
    'Get a single route by its MongoDB id.',
    { id: z.string().describe('Route id (Mongo _id)') },
    async ({ id }) => {
      try {
        return asJson(await client.getRoute(id));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'create_route',
    'Create a new HTTP route served by Hoster. Leave `path` empty for an auto-generated temporary slug.',
    {
      path: z.string().optional().describe('URL path, e.g. "/payload.js". Empty → random temporary slug'),
      name: z.string().optional(),
      contentType: z.string().describe('MIME type, e.g. text/html, application/json, application/x-php'),
      content: z.string().describe('Body content (text, or base64/hex string when contentEncoding is set)'),
      contentEncoding: z.enum(['text', 'base64', 'hex', 'file']).optional(),
      category: z.enum(['classic', 'temporary']).optional(),
      tags: z.array(z.string()).optional(),
      fileName: z.string().optional(),
      contentDisposition: z.string().optional().describe('e.g. attachment; filename="foo.bin"'),
      corsConfig: z
        .object({
          enabled: z.boolean().optional(),
          allowOrigin: z.string().optional(),
          allowMethods: z.string().optional(),
          allowHeaders: z.string().optional(),
        })
        .optional(),
      customHeaders: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
      rateLimit: z
        .object({
          enabled: z.boolean().optional(),
          maxRequests: z.number().int().positive().optional(),
          windowMs: z.number().int().positive().optional(),
        })
        .optional(),
    },
    async (args) => {
      try {
        return asJson(await client.createRoute(args));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'update_route',
    'Update an existing route. Only provided fields are changed.',
    {
      id: z.string(),
      path: z.string().optional(),
      name: z.string().optional(),
      contentType: z.string().optional(),
      content: z.string().optional(),
      contentEncoding: z.enum(['text', 'base64', 'hex', 'file']).optional(),
      category: z.enum(['classic', 'temporary']).optional(),
      tags: z.array(z.string()).optional(),
      fileName: z.string().optional(),
      contentDisposition: z.string().optional(),
      corsConfig: z
        .object({
          enabled: z.boolean().optional(),
          allowOrigin: z.string().optional(),
          allowMethods: z.string().optional(),
          allowHeaders: z.string().optional(),
        })
        .optional(),
      customHeaders: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
      rateLimit: z
        .object({
          enabled: z.boolean().optional(),
          maxRequests: z.number().int().positive().optional(),
          windowMs: z.number().int().positive().optional(),
        })
        .optional(),
    },
    async ({ id, ...patch }) => {
      try {
        return asJson(await client.updateRoute(id, patch));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'delete_route',
    'Delete a route by id. Also removes its access logs.',
    { id: z.string() },
    async ({ id }) => {
      try {
        return asJson(await client.deleteRoute(id));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'delete_routes',
    'Bulk-delete routes by ids.',
    { ids: z.array(z.string()).min(1) },
    async ({ ids }) => {
      try {
        return asJson(await client.deleteRoutes(ids));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'clone_route',
    'Clone an existing route. If targetPath is omitted a random slug is used.',
    {
      id: z.string(),
      targetPath: z.string().optional(),
    },
    async ({ id, targetPath }) => {
      try {
        return asJson(await client.cloneRoute(id, targetPath));
      } catch (err) {
        return asError(err);
      }
    }
  );

  // ───── Logs & stats ─────
  server.tool(
    'get_route_logs',
    'Get the last 100 access log entries for a given route.',
    { id: z.string() },
    async ({ id }) => {
      try {
        return asJson(await client.getRouteLogs(id));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'get_logs',
    'Paginated access logs across all routes.',
    {
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(500).optional(),
    },
    async (args) => {
      try {
        return asJson(await client.getLogs(args));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'get_stats',
    'Dashboard stats: totals, today, top routes, 7-day activity, recent logs.',
    {},
    async () => {
      try {
        return asJson(await client.getStats());
      } catch (err) {
        return asError(err);
      }
    }
  );

  // ───── Global config ─────
  server.tool('get_cors_config', 'Get global CORS configuration.', {}, async () => {
    try {
      return asJson(await client.getCorsConfig());
    } catch (err) {
      return asError(err);
    }
  });

  server.tool(
    'update_cors_config',
    'Update global CORS configuration (applies when a route has no per-route override).',
    {
      allowOrigin: z.string().optional(),
      allowMethods: z.string().optional(),
      allowHeaders: z.string().optional(),
    },
    async (args) => {
      try {
        return asJson(await client.updateCorsConfig(args));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool('get_custom_headers', 'Get the global custom response headers.', {}, async () => {
    try {
      return asJson(await client.getCustomHeadersConfig());
    } catch (err) {
      return asError(err);
    }
  });

  server.tool(
    'update_custom_headers',
    'Replace the global custom response headers.',
    {
      headers: z.array(z.object({ key: z.string(), value: z.string() })),
    },
    async (args) => {
      try {
        return asJson(await client.updateCustomHeadersConfig(args));
      } catch (err) {
        return asError(err);
      }
    }
  );

  // ───── Import / export ─────
  server.tool(
    'export_routes',
    'Export all routes as JSON. Optional password triggers AES-256-CBC encryption.',
    { password: z.string().optional() },
    async ({ password }) => {
      try {
        return asJson(await client.exportRoutes(password));
      } catch (err) {
        return asError(err);
      }
    }
  );

  server.tool(
    'import_routes',
    'Import routes from a previous export. Set overwrite=true to replace existing paths.',
    {
      data: z.any().describe('Export payload (object). Either a clear export or {encrypted, iv, data}.'),
      password: z.string().optional(),
      overwrite: z.boolean().optional(),
    },
    async ({ data, password, overwrite }) => {
      try {
        return asJson(await client.importRoutes({ data, password, overwrite }));
      } catch (err) {
        return asError(err);
      }
    }
  );

  // ───── Resources ─────
  server.resource(
    'routes-list',
    'hoster://routes',
    { mimeType: 'application/json', description: 'All routes (snapshot)' },
    async (uri) => {
      const data = await client.listRoutes();
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.resource(
    'route',
    new ResourceTemplate('hoster://routes/{id}', { list: undefined }),
    { mimeType: 'application/json', description: 'A single route by id' },
    async (uri, { id }) => {
      const data = await client.getRoute(id);
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.resource(
    'stats',
    'hoster://stats',
    { mimeType: 'application/json', description: 'Dashboard stats snapshot' },
    async (uri) => {
      const data = await client.getStats();
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.resource(
    'logs',
    'hoster://logs',
    { mimeType: 'application/json', description: 'Recent access logs (page 1, 50)' },
    async (uri) => {
      const data = await client.getLogs({ page: 1, limit: 50 });
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.resource(
    'route-logs',
    new ResourceTemplate('hoster://routes/{id}/logs', { list: undefined }),
    { mimeType: 'application/json', description: 'Last 100 logs for a route' },
    async (uri, { id }) => {
      const data = await client.getRouteLogs(id);
      return {
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  return server;
}

async function runStdio() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`hoster-mcp ready on stdio (Hoster=${HOSTER_URL})\n`);
}

async function runHttp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', hoster: HOSTER_URL }));

  // Per-session transport store (Streamable HTTP supports stateful sessions)
  const sessions = new Map();

  function checkAuth(req, res) {
    if (!HTTP_AUTH_KEY) return true;
    const provided =
      req.headers['x-api-key'] ||
      (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (provided !== HTTP_AUTH_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return false;
    }
    return true;
  }

  app.post('/mcp', async (req, res) => {
    if (!checkAuth(req, res)) return;
    const sessionId = req.headers['mcp-session-id'];
    let transport = sessionId ? sessions.get(sessionId) : null;

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => sessions.set(sid, transport),
      });
      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };
      const server = buildServer();
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  const handleSession = async (req, res) => {
    if (!checkAuth(req, res)) return;
    const sessionId = req.headers['mcp-session-id'];
    const transport = sessionId ? sessions.get(sessionId) : null;
    if (!transport) {
      res.status(400).send('No active session');
      return;
    }
    await transport.handleRequest(req, res);
  };
  app.get('/mcp', handleSession);
  app.delete('/mcp', handleSession);

  app.listen(HTTP_PORT, HTTP_HOST, () => {
    process.stderr.write(
      `hoster-mcp listening on http://${HTTP_HOST}:${HTTP_PORT}/mcp (Hoster=${HOSTER_URL})\n`
    );
  });
}

if (TRANSPORT === 'stdio') {
  runStdio().catch((err) => {
    process.stderr.write(`hoster-mcp stdio error: ${err.stack || err}\n`);
    process.exit(1);
  });
} else {
  runHttp().catch((err) => {
    process.stderr.write(`hoster-mcp http error: ${err.stack || err}\n`);
    process.exit(1);
  });
}
