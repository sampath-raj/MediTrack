const Alert = require('../models/Alert');
const Medicine = require('../models/Medicine');
const { getCurrentSeason, getCurrentClimate, diseasePatternsBySeason, diseasePatternsByClimate } = require('../utils/demandPredictor');

// @desc    Get all alerts with optional filtering
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const { status, type, severity } = req.query;
    
    let query = {};
    
    // Apply filters
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (severity) {
      query.severity = severity;
    }

    const alerts = await Alert.find(query)
      .populate('medicineId', 'name category currentStock')
      .sort({ createdAt: -1 });
    
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get alert by ID
// @route   GET /api/alerts/:id
// @access  Private
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('medicineId', 'name category currentStock expiryDate manufacturer')
      .populate('resolvedBy', 'name email');
    
    if (alert) {
      res.json(alert);
    } else {
      res.status(404).json({ message: 'Alert not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update alert status
// @route   PUT /api/alerts/:id
// @access  Private
const updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status || alert.status;
    
    // If resolving the alert, add resolver info
    if (status === 'resolved' && alert.status !== 'resolved') {
      alert.resolvedBy = req.user._id;
      alert.resolvedAt = new Date();
    }

    const updatedAlert = await alert.save();
    
    res.json(updatedAlert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recent alerts
// @route   GET /api/alerts/recent
// @access  Private
const getRecentAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: { $in: ['new', 'read'] } })
      .populate('medicineId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get alert summary
// @route   GET /api/alerts/summary
// @access  Private
const getAlertSummary = async (req, res) => {
  try {
    const totalNew = await Alert.countDocuments({ status: 'new' });
    const totalRead = await Alert.countDocuments({ status: 'read' });
    const totalResolved = await Alert.countDocuments({ status: 'resolved' });
    
    const highSeverity = await Alert.countDocuments({ severity: 'high', status: { $in: ['new', 'read'] } });
    const mediumSeverity = await Alert.countDocuments({ severity: 'medium', status: { $in: ['new', 'read'] } });
    const lowSeverity = await Alert.countDocuments({ severity: 'low', status: { $in: ['new', 'read'] } });
    
    const byType = {
      low_stock: await Alert.countDocuments({ type: 'low_stock', status: { $in: ['new', 'read'] } }),
      expiry: await Alert.countDocuments({ type: 'expiry', status: { $in: ['new', 'read'] } }),
      high_demand_predicted: await Alert.countDocuments({ type: 'high_demand_predicted', status: { $in: ['new', 'read'] } }),
    };
    
    res.json({
      total: totalNew + totalRead + totalResolved,
      byStatus: {
        new: totalNew,
        read: totalRead,
        resolved: totalResolved,
      },
      bySeverity: {
        high: highSeverity,
        medium: mediumSeverity,
        low: lowSeverity,
      },
      byType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate alerts for all medicines
// @route   POST /api/alerts/generate
// @access  Private/Admin
const generateAlerts = async (req, res) => {
  try {
    // Get all medicines
    const medicines = await Medicine.find({});
    const today = new Date();
    const alerts = [];
    
    console.log('Starting alert generation process...');
    
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
    
    // Generate alerts for high demand medicines
    medicines.forEach(medicine => {
      // Initialize demand multiplier
      let demandMultiplier = 1;
      const reasons = [];
      
      // Apply seasonal factors
      if (medicine.demandFactors.seasonal) {
        demandMultiplier *= medicine.demandFactors.seasonalTrend[currentSeason];
        if (medicine.demandFactors.seasonalTrend[currentSeason] > 1.2) {
          reasons.push(`Seasonal factor (${currentSeason}): ${medicine.demandFactors.seasonalTrend[currentSeason].toFixed(1)}x`);
        }
      }
      
      // Apply climate factors
      if (medicine.demandFactors.climateDependent) {
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
        }
        
        // Also create disease pattern alert for medicines in high-risk categories
        if (highRiskCategories.includes(medicine.category)) {
          alerts.push({
            medicineId: medicine._id,
            type: 'disease_pattern_risk',
            message: `${medicine.name} is in the ${medicine.category} category, which typically sees higher demand during ${currentSeason}/${currentClimate} conditions.`,
            severity: 'medium',
          });
        }
      }
    });
    
    // 4. Generate recommended stock alerts for medicines with low stock in high-risk categories
    highRiskCategories.forEach(category => {
      // Find alternative medicines in the same category that are well-stocked
      const lowStockInCategory = medicines.filter(m => 
        m.category === category && 
        m.currentStock <= m.minStockLevel
      );
      
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
          }
        });
      }
    });
    
    // 5. Save the alerts to the database
    console.log(`Generated ${alerts.length} alerts`);
    
    // Delete existing unresolved alerts to avoid duplication
    await Alert.deleteMany({ status: { $in: ['new', 'read'] } });
    
    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
      res.status(200).json({ 
        success: true, 
        count: alerts.length,
        message: `Successfully generated ${alerts.length} alerts` 
      });
    } else {
      res.status(200).json({ 
        success: true, 
        count: 0,
        message: 'No alerts needed to be generated at this time' 
      });
    }
  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating alerts: ' + error.message 
    });
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  updateAlertStatus,
  getRecentAlerts,
  getAlertSummary,
  generateAlerts,
};
