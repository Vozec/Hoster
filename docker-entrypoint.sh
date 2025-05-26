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

echo "Waiting for frontend build to complete..."
until [ -f /app/admin-frontend/build/.build_complete ]; do
  echo "Frontend build not ready yet, waiting..."
  sleep 5
done

echo "Frontend build detected, initializing database..."
node init.js

echo "Starting backend server..."
npm start
