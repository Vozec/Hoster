FROM node:18-slim AS deps
WORKDIR /app
COPY mcp/package.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM node:18-slim AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY mcp/package.json ./
COPY mcp/src ./src

ENV MCP_TRANSPORT=http \
    MCP_HOST=0.0.0.0 \
    MCP_PORT=3333

EXPOSE 3333
CMD ["node", "src/server.js"]
