const schedule = require('node-schedule');
const Medicine = require('../models/Medicine');
const { generateAlerts } = require('./alertGenerator');

// Schedule jobs to run at specific times
const setupScheduledTasks = () => {
  console.log('Setting up scheduled tasks...');

  // Generate alerts automatically every 6 hours
  schedule.scheduleJob('0 */6 * * *', async function() {
    console.log('Running scheduled alert generation task...');
    try {
      const result = await generateAlerts();
      if (result.success) {
        console.log(`Automated alert generation completed: ${result.count} alerts generated`);
      } else {
        console.error('Automated alert generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error in scheduled alert generation:', error);
    }
  });

  // Check for expiring medicines daily at midnight
  schedule.scheduleJob('0 0 * * *', async function() {
    console.log('Running expiry check job...');
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringMedicines = await Medicine.find({
        expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      });

      for (const medicine of expiringMedicines) {
        const existingAlert = await Alert.findOne({
          medicineId: medicine._id,
          type: 'expiry',
          status: { $in: ['new', 'read'] },
        });

        if (!existingAlert) {
          const daysToExpiry = Math.ceil((medicine.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          
          const newAlert = new Alert({
            medicineId: medicine._id,
            type: 'expiry',
            message: `${medicine.name} will expire in ${daysToExpiry} days. Quantity: ${medicine.currentStock}`,
            severity: daysToExpiry < 7 ? 'high' : 'medium',
          });

          await newAlert.save();
        }
      }
    } catch (error) {
      console.error('Error checking for expiring medicines:', error);
    }
  });

  console.log('Scheduled tasks have been set up');
};

module.exports = { setupScheduledTasks };
