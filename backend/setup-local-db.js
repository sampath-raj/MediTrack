const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupLocalDB() {
  console.log('🔧 Setting up local MongoDB for MediTrack development...');
  
  try {
    // Try to connect to local MongoDB
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('✅ Successfully connected to local MongoDB');

    // Create the database and collections
    const db = client.db('medicine-management');
    await db.createCollection('medicines');
    await db.createCollection('users');
    await db.createCollection('alerts');
    console.log('✅ Created required collections');
    
    // Update .env file to use local MongoDB
    const envPath = path.resolve(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Comment out the Atlas URI and uncomment the local URI
    envContent = envContent.replace(
      /MONGO_URI=mongodb\+srv:\/\/.+/,
      '# MONGO_URI=mongodb+srv://Medicine:Admin%40123@medicine-management.oli78gp.mongodb.net/?retryWrites=true&w=majority'
    );
    
    // Make sure local MongoDB URI is uncommented
    if (envContent.includes('# MONGO_URI=mongodb://localhost:27017')) {
      envContent = envContent.replace(
        '# MONGO_URI=mongodb://localhost:27017/medicine-management',
        'MONGO_URI=mongodb://localhost:27017/medicine-management'
      );
    } else if (!envContent.includes('MONGO_URI=mongodb://localhost:27017')) {
      // Add local URI if not present
      envContent += '\nMONGO_URI=mongodb://localhost:27017/medicine-management\n';
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file to use local MongoDB');
    
    // Create an admin user
    rl.question('Do you want to create an admin user? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await db.collection('users').insertOne({
          name: 'Admin',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          notificationPreferences: {
            email: true,
            inApp: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log('✅ Created admin user:');
        console.log('   Email: admin@example.com');
        console.log('   Password: admin123');
      }
      
      console.log('\n🚀 Local MongoDB setup complete! You can now start the server.');
      console.log('   Run: npm run dev');
      
      await client.close();
      rl.close();
    });
  } catch (error) {
    console.error('❌ Error setting up local MongoDB:', error.message);
    console.log('\n📋 Make sure MongoDB is installed and running on your machine.');
    console.log('1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.log('2. Start MongoDB service');
    console.log('   - Windows: Run "net start MongoDB" in cmd as administrator');
    console.log('   - macOS/Linux: Run "sudo systemctl start mongod" or "brew services start mongodb-community"');
    rl.close();
  }
}

setupLocalDB();
