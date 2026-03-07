#!/bin/bash
set -e

echo "Installing frontend dependencies..."
npm ci

echo "Building React application..."

if [[ "${ADMIN_PATH}" != */ ]]; then
  ADMIN_PATH="${ADMIN_PATH}/"
fi

echo "Setting up environment variables..."

export PUBLIC_URL="${ADMIN_PATH}"
export REACT_APP_ADMIN_PATH="${ADMIN_PATH}"
export REACT_APP_API_PATH="${API_PATH}"
export REACT_APP_API_URL="${HOSTER_URL}"
export GENERATE_SOURCEMAP="true"
export DISABLE_ESLINT_PLUGIN="true"
export CI="false"

mkdir -p /app/frontend/build
find /app/frontend/build -mindepth 1 -delete || true

echo "Running npm run build..."
NODE_ENV=production npm run build

echo "Frontend build completed"
echo "Contenu du dossier build:"
ls -la /app/frontend/build

touch /app/frontend/build/.build_complete

echo "Build process finished"