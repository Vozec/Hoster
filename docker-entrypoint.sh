#!/bin/bash
set -e

echo "Installing backend dependencies..."
npm install

# Vérifier que PHP est bien installé
if command -v php > /dev/null; then
  echo "PHP est installé: $(php -v | head -n 1)"
else
  echo "ATTENTION: PHP n'est pas installé. L'évaluation du code PHP ne fonctionnera pas."
fi

# Configurer la tâche cron pour la purge automatique
echo "Configuring automatic cleanup job..."
CRON_JOB="0 3 * * * root /app/src/scripts/purgeTemporaryRoutes.js"
# Écraser le crontab avec notre tâche
echo "$CRON_JOB" > /etc/crontab
# Démarrer cron en arrière-plan
service cron start

# Vérifier que cron est bien démarré
if ! pgrep cron > /dev/null; then
  echo "WARNING: Failed to start cron service"
else
  echo "Cron service started successfully"
fi

echo "Waiting for frontend build to complete..."
until [ -f /app/admin-frontend/build/.build_complete ]; do
  echo "Frontend build not ready yet, waiting..."
  sleep 5
done

echo "Frontend build detected, initializing database..."
node init.js

echo "Starting backend server..."
npm start
