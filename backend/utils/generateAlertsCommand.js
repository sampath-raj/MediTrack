const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');
const connectDB = require('../config/db');
const { getCurrentSeason, getCurrentClimate, diseasePatternsBySeason, diseasePatternsByClimate } = require('./demandPredictor');

// Load environment variables
dotenv.config();

// Generate alerts based on medicine data
const generateAlerts = async () => {
  try {
    await connectDB();
    
    console.log('Starting alert generation process...');
    
    // Get all medicines
    const medicines = await Medicine.find({});
    const today = new Date();
    const alerts = [];
    
    // 1. Check for low stock alerts
    const lowStockMedicines = medicines.filter(medicine => 
      medicine.currentStock <= medicine.minStockLevel
    );
    
    lowStockMedicines.forEach(medicine => {
      alerts.push({
        medicineId: medicine._id,
        type: 'low_stock',
        message: `Low stock alert for ${medicine.name}. Current stock: ${medicine.currentStock}, Minimum required: ${medicine.minStockLevel}`,
        severity: medicine.currentStock <= medicine.minStockLevel / 2 ? 'high' : 'medium',
      });
    });
    
    console.log(`Generated ${lowStockMedicines.length} low stock alerts`);
    
    // 2. Check for expiring medicines
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringMedicines = medicines.filter(medicine => 
      medicine.expiryDate && medicine.expiryDate <= thirtyDaysFromNow && medicine.expiryDate >= today
    );
    
    expiringMedicines.forEach(medicine => {
      const daysToExpiry = Math.ceil((medicine.expiryDate - today) / (1000 * 60 * 60 * 1000 * 24));
      alerts.push({
        medicineId: medicine._id,
        type: 'expiry',
        message: `${medicine.name} will expire in ${daysToExpiry} days. Quantity: ${medicine.currentStock}`,
        severity: daysToExpiry < 15 ? 'high' : 'medium',
      });
    });
    
    console.log(`Generated ${expiringMedicines.length} expiry alerts`);
    
    // 3. Generate demand prediction alerts
    const currentSeason = getCurrentSeason(today.getMonth());
    const currentClimate = getCurrentClimate();
    
    // Get high-risk categories for current climate and season
    const highRiskCategories = [...new Set([
      ...diseasePatternsBySeason[currentSeason],
      ...diseasePatternsByClimate[currentClimate]
    ])];
    
    console.log(`Current season: ${currentSeason}, climate: ${currentClimate}`);
    console.log(`High risk categories: ${highRiskCategories.join(', ')}`);
    
    let demandAlerts = 0;
    let patternAlerts = 0;
    
    // Generate alerts for high demand medicines
    medicines.forEach(medicine => {
      // Initialize demand multiplier
      let demandMultiplier = 1;
      const reasons = [];
      
      // Apply seasonal factors
      if (medicine.demandFactors && medicine.demandFactors.seasonal) {
        demandMultiplier *= medicine.demandFactors.seasonalTrend[currentSeason];
        if (medicine.demandFactors.seasonalTrend[currentSeason] > 1.2) {
          reasons.push(`Seasonal factor (${currentSeason}): ${medicine.demandFactors.seasonalTrend[currentSeason].toFixed(1)}x`);
        }
      }
      
      // Apply climate factors
      if (medicine.demandFactors && medicine.demandFactors.climateDependent) {
        demandMultiplier *= medicine.demandFactors.climateFactors[currentClimate];
        if (medicine.demandFactors.climateFactors[currentClimate] > 1.2) {
          reasons.push(`Climate factor (${currentClimate}): ${medicine.demandFactors.climateFactors[currentClimate].toFixed(1)}x`);
        }
      }
      
      // Apply category risk boost
      if (highRiskCategories.includes(medicine.category)) {
        demandMultiplier *= 1.5;
        reasons.push(`High-risk category (${medicine.category}) during ${currentSeason}/${currentClimate}`);
      }
      
      // Create alert if demand is high and stock might be insufficient
      if (demandMultiplier > 1.3) {
        if (medicine.currentStock < medicine.minStockLevel * demandMultiplier) {
          alerts.push({
            medicineId: medicine._id,
            type: 'high_demand_predicted',
            message: `High demand predicted for ${medicine.name}. Reasons: ${reasons.join('; ')}. Consider increasing stock.`,
            severity: medicine.currentStock < medicine.minStockLevel ? 'high' : 'medium',
          });
          demandAlerts++;
        }
        
        // Also create disease pattern alert for medicines in high-risk categories
        if (highRiskCategories.includes(medicine.category)) {
          alerts.push({
            medicineId: medicine._id,
            type: 'disease_pattern_risk',
            message: `${medicine.name} is in the ${medicine.category} category, which typically sees higher demand during ${currentSeason}/${currentClimate} conditions.`,
            severity: 'medium',
          });
          patternAlerts++;
        }
      }
    });
    
    console.log(`Generated ${demandAlerts} high demand alerts and ${patternAlerts} disease pattern alerts`);
    
    // 4. Generate recommended stock alerts for medicines with low stock in high-risk categories
    let recommendationAlerts = 0;
    
    highRiskCategories.forEach(category => {
      // Find low stock medicines in this category
      const lowStockInCategory = medicines.filter(m => 
        m.category === category && 
        m.currentStock <= m.minStockLevel
      );
      
      // Find well-stocked alternatives in the same category
      const wellStockedInCategory = medicines.filter(m => 
        m.category === category && 
        m.currentStock > m.minStockLevel * 2
      );
      
      if (lowStockInCategory.length > 0 && wellStockedInCategory.length > 0) {
        lowStockInCategory.forEach(lowStockMed => {
          const alternatives = wellStockedInCategory
            .filter(m => m._id.toString() !== lowStockMed._id.toString())
            .map(m => m.name)
            .slice(0, 3);
          
          if (alternatives.length > 0) {
            alerts.push({
              medicineId: lowStockMed._id,
              type: 'recommended_stock',
              message: `${lowStockMed.name} is low in stock. Consider offering these alternatives: ${alternatives.join(', ')}.`,
              severity: 'medium',
            });
            recommendationAlerts++;
          }
        });
      }
    });
    
    console.log(`Generated ${recommendationAlerts} stock recommendation alerts`);
    
    // 5. Save the alerts to the database
    console.log(`Generated ${alerts.length} total alerts`);
    
    // Delete existing unresolved alerts to avoid duplication
    const deleteResult = await Alert.deleteMany({ status: { $in: ['new', 'read'] } });
    console.log(`Deleted ${deleteResult.deletedCount} existing unresolved alerts`);
    
    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
      console.log(`Successfully inserted ${alerts.length} alerts into the database`);
    } else {
      console.log('No alerts needed to be generated at this time');
    }
    
    console.log('Alert generation complete!');
    process.exit(0);
  } catch (error) {
    console.error(`Error generating alerts: ${error.message}`);
    process.exit(1);
  }
};

// Run the alert generator
generateAlerts();
