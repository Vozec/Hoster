const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Route = require('../models/Route');

dotenv.config();

async function initDefaultRoute() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Vérifier si la route par défaut existe déjà
    const existingRoute = await Route.findOne({ path: '/' });
    
    if (!existingRoute) {
      // Créer la route par défaut
      const defaultRoute = new Route({
        path: '/',
        name: 'Default Route',
        contentType: 'application/javascript',
        content: 'alert(window.origin);',
        category: 'classic'
      });

      await defaultRoute.save();
      console.log('Default route created successfully');
    } else {
      console.log('Default route already exists');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error initializing default route:', error);
    process.exit(1);
  }
}

initDefaultRoute(); 