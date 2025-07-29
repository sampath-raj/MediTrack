const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');

// Define seasons by month (Northern Hemisphere)
const getSeasonByMonth = (month) => {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

// Alias for compatibility with other functions
const getCurrentSeason = getSeasonByMonth;

// Get current climate condition (simplified example)
// In a real app, this could use weather API data
const getCurrentClimate = () => {
  const month = new Date().getMonth();
  
  // Simplified climate determination by season
  if (month >= 2 && month <= 4) return 'rainy'; // Spring
  if (month >= 5 && month <= 7) return 'hot';   // Summer
  if (month >= 8 && month <= 10) return 'dry';  // Fall
  return 'cold';                                // Winter
};

// Map conditions to common ailments/medicine categories
const diseasePatternsByClimate = {
  rainy: ['Analgesics', 'Antibiotics', 'Antipyretics', 'Cough & Cold'],
  hot: ['Rehydration', 'Antipyretics', 'Antihistamines'],
  dry: ['Moisturizers', 'Vitamins'],
  cold: ['Cough & Cold', 'Antibiotics', 'Vitamins', 'Analgesics']
};

const diseasePatternsBySeason = {
  spring: ['Antihistamines', 'Allergy', 'Vitamins'],
  summer: ['Rehydration', 'Antidiarrheals', 'Antipyretics'],
  fall: ['Vitamins', 'Immunostimulants'],
  winter: ['Cough & Cold', 'Antibiotics', 'Vitamins', 'Analgesics']
};

// Predict demand for each medicine based on season and climate
const predictDemand = async () => {
  try {
    const medicines = await Medicine.find({});
    const currentMonth = new Date().getMonth();
    const currentSeason = getSeasonByMonth(currentMonth);
    const currentClimate = getCurrentClimate();
    
    console.log(`Current season: ${currentSeason}, climate: ${currentClimate}`);
    
    // Get high-risk categories for this season and climate
    const highRiskCategories = [...new Set([
      ...diseasePatternsBySeason[currentSeason],
      ...diseasePatternsByClimate[currentClimate]
    ])];
    
    console.log(`High risk categories: ${highRiskCategories.join(', ')}`);
    
    const predictions = [];
    const alerts = [];
    
    for (const medicine of medicines) {
      let demandMultiplier = 1;
      let reasonsForPrediction = [];
      
      // Apply seasonal factors if medicine is affected by seasons
      if (medicine.demandFactors.seasonal) {
        demandMultiplier *= medicine.demandFactors.seasonalTrend[currentSeason];
        
        if (medicine.demandFactors.seasonalTrend[currentSeason] > 1.2) {
          reasonsForPrediction.push(`${currentSeason} season trend (${medicine.demandFactors.seasonalTrend[currentSeason].toFixed(1)}x)`);
        }
      }
      
      // Apply climate factors if medicine is affected by climate
      if (medicine.demandFactors.climateDependent) {
        demandMultiplier *= medicine.demandFactors.climateFactors[currentClimate];
        
        if (medicine.demandFactors.climateFactors[currentClimate] > 1.2) {
          reasonsForPrediction.push(`${currentClimate} climate trend (${medicine.demandFactors.climateFactors[currentClimate].toFixed(1)}x)`);
        }
      }
      
      // Apply category risk boost
      if (highRiskCategories.includes(medicine.category)) {
        demandMultiplier *= 1.5;
        reasonsForPrediction.push(`${medicine.category} is high-risk during ${currentSeason}/${currentClimate} conditions (1.5x)`);
      }
      
      // Calculate predicted usage
      const predictedMonthlyUsage = medicine.currentStock * (demandMultiplier / 3); // Estimated usage per month
      const stockDurationMonths = medicine.currentStock / predictedMonthlyUsage;
      const needsRestock = stockDurationMonths < 1 || medicine.currentStock < medicine.minStockLevel * demandMultiplier;
      
      // Generate alerts for high demand medicine with low stock
      if (demandMultiplier > 1.3 && needsRestock) {
        const existingAlert = await Alert.findOne({
          medicineId: medicine._id,
          type: 'high_demand_predicted',
          status: { $in: ['new', 'read'] }
        });
        
        if (!existingAlert) {
          const alert = new Alert({
            medicineId: medicine._id,
            type: 'high_demand_predicted',
            message: `High demand predicted for ${medicine.name} due to current ${currentSeason}/${currentClimate} conditions. Current stock (${medicine.currentStock}) may be insufficient.`,
            severity: medicine.currentStock < medicine.minStockLevel ? 'high' : 'medium',
            status: 'new',
            createdAt: new Date()
          });
          
          alerts.push(alert);
        }
      }
      
      // Generate alerts for medicines in high-risk categories with low stock
      if (highRiskCategories.includes(medicine.category) && medicine.currentStock < medicine.minStockLevel * 2) {
        const existingAlert = await Alert.findOne({
          medicineId: medicine._id,
          type: 'disease_pattern_risk',
          status: { $in: ['new', 'read'] }
        });
        
        if (!existingAlert) {
          const alert = new Alert({
            medicineId: medicine._id,
            type: 'disease_pattern_risk',
            message: `${medicine.name} belongs to ${medicine.category} category which has higher demand during ${currentClimate} conditions. Consider increasing stock.`,
            severity: medicine.currentStock < medicine.minStockLevel ? 'high' : 'medium',
            status: 'new',
            createdAt: new Date()
          });
          
          alerts.push(alert);
        }
      }
      
      predictions.push({
        medicine: medicine.name,
        category: medicine.category,
        currentStock: medicine.currentStock,
        predictedDemandMultiplier: demandMultiplier,
        needsRestock,
        stockDurationMonths,
        reasonsForPrediction,
        isHighRiskCategory: highRiskCategories.includes(medicine.category)
      });
    }
    
    // Save all alerts
    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
      console.log(`Generated ${alerts.length} demand prediction alerts`);
    }
    
    return predictions;
  } catch (error) {
    console.error('Error in demand prediction:', error);
    return [];
  }
};

module.exports = { 
  predictDemand,
  getSeasonByMonth,
  getCurrentSeason, // Add this alias for backwards compatibility
  getCurrentClimate,
  diseasePatternsByClimate,
  diseasePatternsBySeason
};
