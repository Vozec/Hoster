// Script de purge des routes temporaires expirées
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('../models/Route');

// Charger les variables d'environnement
dotenv.config({ path: '../../.env' });

const TEMPORARY_DELAY = parseInt(process.env.TEMPORARY_DELAY, 10) || 7; // fallback 7 jours
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Erreur: MONGODB_URI manquant dans .env');
  process.exit(1);
}

const now = new Date();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function purgeRoutes() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connecté à MongoDB');

  // 1. Purge des routes créées en temporaire (jamais permanentes)
  // 2. Purge des routes passées de permanente à temporaire (temporarySince défini)
  const tempDelayMs = TEMPORARY_DELAY * MS_PER_DAY;
  const swapDelayMs = 7 * MS_PER_DAY;

  // Chercher toutes les routes temporaires
  const routes = await Route.find({ category: 'temporary' });
  let toDelete = [];
  for (const route of routes) {
    // Si temporarySince existe, on regarde la bonne règle
    if (route.temporarySince) {
      const diff = now - route.temporarySince;
      if (route.createdAt.getTime() === route.temporarySince.getTime()) {
        // Créée directement en temporaire
        if (diff > tempDelayMs) toDelete.push(route._id);
      } else {
        // Passée de permanente à temporaire
        if (diff > swapDelayMs) toDelete.push(route._id);
      }
    } else {
      // Sécurité: fallback sur createdAt si pas de temporarySince
      const diff = now - route.createdAt;
      if (diff > tempDelayMs) toDelete.push(route._id);
    }
  }

  if (toDelete.length > 0) {
    const res = await Route.deleteMany({ _id: { $in: toDelete } });
    console.log(`Routes supprimées: ${res.deletedCount}`);
  } else {
    console.log('Aucune route temporaire à supprimer.');
  }

  await mongoose.disconnect();
  process.exit(0);
}

purgeRoutes().catch(err => {
  console.error('Erreur lors de la purge:', err);
  process.exit(1);
});
