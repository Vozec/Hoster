FROM node:18-slim AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:18-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    php-cli \
    php-mbstring \
    php-curl \
    php-xml \
    cron \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json backend/package-lock.json ./
COPY backend ./backend
RUN chmod +x /app/backend/docker-entrypoint.sh /app/backend/src/scripts/*.sh

EXPOSE 3000
CMD ["/app/backend/docker-entrypoint.sh"]
