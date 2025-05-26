const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./src/models/User');

// Load environment variables
dotenv.config();

// Function to create the default admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ username: process.env.ADMIN_USERNAME });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      
      // Create a new admin user
      const admin = new User({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        isAdmin: true
      });
      
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Main initialization function
const init = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
    
    // Create admin user
    await createAdminUser();
    
    console.log('Initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
};

// Run the initialization
init();
