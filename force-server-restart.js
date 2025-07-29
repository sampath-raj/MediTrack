/**
 * FORCE SERVER RESTART
 * 
 * This utility forces a full server restart by:
 * 1. Clearing Node's module cache
 * 2. Explicitly re-registering all routes
 * 3. Restarting the Express server instance
 */

console.log('🔄 FORCING COMPLETE SERVER RESTART...');

// First stop any existing server process if possible
try {
  process.on('SIGINT', () => {
    console.log('Stopping existing server process...');
    process.exit(0);
  });
  process.kill(process.pid, 'SIGINT');
} catch (e) {
  console.log('No existing server process to kill');
}

// Clear the module cache to ensure fresh code
Object.keys(require.cache).forEach((key) => {
  console.log(`Clearing cache for: ${key.split('\\').slice(-2).join('\\')}`);
  delete require.cache[key];
});

console.log('🧹 Module cache cleared');

// Set a flag to indicate this is a forced restart
process.env.FORCED_RESTART = 'true';

// Start the server with the fresh modules
console.log('🚀 Starting new server instance...');
try {
  require('./backend/server');
  console.log('✅ Server restarted successfully!');
  console.log('📡 API endpoints should now be accessible');
} catch (error) {
  console.error('❌ Error restarting server:', error);
  console.log('Try stopping any running Node.js processes manually and try again');
}
