const mongoose = require('mongoose');

console.log("🔍 MONGO_URI from .env:", process.env.MONGO_URI); // Debugging

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI is undefined! Check your .env file.");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Provide helpful guidance based on the error
    if (error.message.includes('whitelist')) {
      console.error('\n📌 IP Whitelist Issue: Your current IP address needs to be added to MongoDB Atlas whitelist.');
      console.error('📋 Steps to fix:');
      console.error('1. Log in to MongoDB Atlas: https://cloud.mongodb.com');
      console.error('2. Go to Network Access in the Security section');
      console.error('3. Click "Add IP Address" and either:');
      console.error('   - Add your current IP address');
      console.error('   - Temporarily allow access from anywhere (Add: 0.0.0.0/0)');
      console.error('4. Click "Confirm" and wait a few minutes for changes to take effect\n');
      console.error('🔄 Alternative: Use a local MongoDB database by updating your .env file');
    }
    
    if (error.message.includes('ECONNREFUSED') && process.env.MONGO_URI.includes('localhost')) {
      console.error('\n📌 Local MongoDB Connection Error: Make sure MongoDB is installed and running on your machine.');
      console.error('📋 Steps to fix:');
      console.error('1. Install MongoDB if not already installed: https://www.mongodb.com/try/download/community');
      console.error('2. Start MongoDB service');
      console.error('   - Windows: Run "net start MongoDB" in cmd as administrator');
      console.error('   - macOS/Linux: Run "sudo systemctl start mongod" or "brew services start mongodb-community"');
      console.error('3. Verify MongoDB is running with "mongo" or "mongosh" command\n');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
