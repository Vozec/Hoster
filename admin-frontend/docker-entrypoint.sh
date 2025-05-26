#!/bin/bash
set -e

echo "Checking for required files..."

# Vérifier si le dossier public existe
if [ ! -d "/app/public" ]; then
  echo "Creating public directory..."
  mkdir -p /app/public
fi

# Vérifier si index.html existe
if [ ! -f "/app/public/index.html" ]; then
  echo "WARNING: index.html not found, creating a default one..."
  cat > /app/public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#1976d2" />
    <meta name="description" content="Payload Hoster - Admin panel" />
    <title>Hoster Admin</title>
  </head>
  <body>
    <noscript>Vous devez activer JavaScript pour exécuter cette application.</noscript>
    <div id="root"></div>
  </body>
</html>
EOL
fi

# Vérifier si manifest.json existe
if [ ! -f "/app/public/manifest.json" ]; then
  echo "Creating default manifest.json..."
  echo '{"short_name":"Hoster","name":"Hoster Admin","icons":[],"start_url":".","display":"standalone","theme_color":"#1976d2","background_color":"#ffffff"}' > /app/public/manifest.json
fi

# Vérifier si robots.txt existe
if [ ! -f "/app/public/robots.txt" ]; then
  echo "Creating default robots.txt..."
  echo "# https://www.robotstxt.org/robotstxt.html\nUser-agent: *\nDisallow:" > /app/public/robots.txt
fi

echo "Installing frontend dependencies..."
npm install

echo "Building React application..."

# S'assurer que le chemin d'administration se termine par un slash
if [[ "${ADMIN_PATH}" != */ ]]; then
  ADMIN_PATH="${ADMIN_PATH}/"
fi

# Configuration simplifiée pour le build
echo "Setting up environment variables..."

# Définir les variables d'environnement pour le build
export PUBLIC_URL="${ADMIN_PATH}"
export REACT_APP_ADMIN_PATH="${ADMIN_PATH}"
export REACT_APP_API_PATH="${API_PATH}"
export REACT_APP_API_URL="http://localhost:3000"
export GENERATE_SOURCEMAP="true"
export DISABLE_ESLINT_PLUGIN="true"
export CI="false"

# S'assurer que le dossier build existe sans essayer de le supprimer
mkdir -p /app/build
# Vider le contenu du dossier sans supprimer le dossier lui-même
find /app/build -mindepth 1 -delete || echo "Impossible de vider le dossier build, on continue quand même"

# Construire l'application avec react-scripts standard
echo "Running npm run build..."
NODE_ENV=production npm run build

echo "Frontend build completed"

# Vérifier le contenu du dossier build
echo "Contenu du dossier build:"
ls -la /app/build

# Créer le fichier de marqueur
touch /app/build/.build_complete

echo "Build process finished, keeping container alive..."
tail -f /dev/null
