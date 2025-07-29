const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

// Generate alerts based on medicine data
const generateAlerts = async () => {
  try {
    await connectDB();
    
    console.log('Generating alerts based on medicine data...');
    
    // Clear existing alerts
    await Alert.deleteMany({});
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Get medicines with low stock
    const lowStockMedicines = await Medicine.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    });
    
    // Get medicines expiring soon
    const expiringMedicines = await Medicine.find({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: today }
    });
    
    // Create alerts for low stock medicines
    const lowStockAlerts = lowStockMedicines.map(medicine => ({
      medicineId: medicine._id,
      type: 'low_stock',
      message: `Low stock alert for ${medicine.name}. Current stock: ${medicine.currentStock}, Minimum required: ${medicine.minStockLevel}`,
      severity: medicine.currentStock <= medicine.minStockLevel / 2 ? 'high' : 'medium',
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Create alerts for expiring medicines
    const expiryAlerts = expiringMedicines.map(medicine => {
      const daysToExpiry = Math.ceil((medicine.expiryDate - today) / (1000 * 60 * 60 * 24));
      return {
        medicineId: medicine._id,
        type: 'expiry',
        message: `${medicine.name} will expire in ${daysToExpiry} days. Quantity: ${medicine.currentStock}`,
        severity: daysToExpiry < 15 ? 'high' : 'medium',
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    // Create high demand prediction alerts
    const highDemandMedicines = await Medicine.find({
      'demandFactors.seasonal': true
    });
    
    const currentMonth = today.getMonth();
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const currentSeason = seasons[Math.floor(currentMonth / 3) % 4];
    
    const highDemandAlerts = highDemandMedicines
      .filter(medicine => medicine.demandFactors.seasonalTrend[currentSeason] > 1.5)
      .map(medicine => ({
        medicineId: medicine._id,
        type: 'high_demand_predicted',
        message: `High demand predicted for ${medicine.name} this ${currentSeason}. Current stock: ${medicine.currentStock}.`,
        severity: medicine.currentStock < medicine.minStockLevel * 2 ? 'high' : 'medium',
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    
    // Combine all alerts
    const allAlerts = [...lowStockAlerts, ...expiryAlerts, ...highDemandAlerts];
    
    // Insert alerts
    if (allAlerts.length > 0) {
      await Alert.insertMany(allAlerts);
      console.log(`Generated ${allAlerts.length} alerts`);
    } else {
      console.log('No alerts to generate');
    }
    
    console.log('Alert generation complete!');
    process.exit();
  } catch (error) {
    console.error(`Error generating alerts: ${error.message}`);
    process.exit(1);
  }
};

// Run the alert generator
generateAlerts();
