FROM node:18

RUN apt-get update && apt-get install -y \
    php-cli \
    php-fpm \
    php-common \
    php-mbstring \
    php-curl \
    php-json \
    php-xml \
    cron \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package*.json ./

RUN npm install

COPY backend/ ./

RUN chmod +x /app/backend/docker-entrypoint.sh /app/backend/src/scripts/*.sh

EXPOSE 3000

CMD ["/app/backend/docker-entrypoint.sh"]