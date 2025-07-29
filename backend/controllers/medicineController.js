const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');

// @desc    Get all medicines with optional filtering
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const { filter, category, search } = req.query;
    
    let query = {};
    
    // Apply filters
    if (filter === 'low-stock') {
      query = { $expr: { $lte: ['$currentStock', '$minStockLevel'] } };
    } else if (filter === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query.expiryDate = { $lte: thirtyDaysFromNow, $gte: new Date() };
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const medicines = await Medicine.find(query).sort({ name: 1 });
    
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (medicine) {
      res.json(medicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private/Admin
const createMedicine = async (req, res) => {
  try {
    const {
      name,
      category,
      currentStock,
      minStockLevel,
      unitPrice,
      expiryDate,
      manufacturer,
      demandFactors,
    } = req.body;

    const medicineExists = await Medicine.findOne({ name });

    if (medicineExists) {
      return res.status(400).json({ message: 'Medicine with this name already exists' });
    }

    const medicine = await Medicine.create({
      name,
      category,
      currentStock,
      minStockLevel,
      unitPrice,
      expiryDate,
      manufacturer,
      demandFactors,
      stockHistory: currentStock > 0 ? [{
        quantity: currentStock,
        operation: 'added',
        date: new Date()
      }] : [],
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a medicine
// @route   PUT /api/medicines/:id
// @access  Private/Admin
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    const {
      name,
      category,
      currentStock,
      minStockLevel,
      unitPrice,
      expiryDate,
      manufacturer,
      demandFactors,
    } = req.body;

    // Check if stock has changed to update stock history
    if (currentStock !== medicine.currentStock) {
      const difference = currentStock - medicine.currentStock;
      medicine.stockHistory.push({
        quantity: Math.abs(difference),
        operation: difference > 0 ? 'added' : 'removed',
        date: new Date()
      });
    }

    medicine.name = name || medicine.name;
    medicine.category = category || medicine.category;
    medicine.currentStock = currentStock !== undefined ? currentStock : medicine.currentStock;
    medicine.minStockLevel = minStockLevel || medicine.minStockLevel;
    medicine.unitPrice = unitPrice || medicine.unitPrice;
    medicine.expiryDate = expiryDate || medicine.expiryDate;
    medicine.manufacturer = manufacturer || medicine.manufacturer;
    
    if (demandFactors) {
      medicine.demandFactors = {
        ...medicine.demandFactors,
        ...demandFactors
      };
    }

    const updatedMedicine = await medicine.save();
    res.json(updatedMedicine);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Delete related alerts
    await Alert.deleteMany({ medicineId: medicine._id });
    
    // Delete the medicine - using deleteOne() instead of deprecated remove()
    await medicine.deleteOne();
    
    res.json({ message: 'Medicine removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stock summary
// @route   GET /api/medicines/summary
// @access  Private
const getSummary = async (req, res) => {
  try {
    // Get total count
    const total = await Medicine.countDocuments();
    
    // Get low stock count
    const lowStock = await Medicine.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] }
    });
    
    // Get expiring soon count
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringSoon = await Medicine.countDocuments({
      expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    });
    
    res.json({ total, lowStock, expiringSoon });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get stock chart data
// @route   GET /api/medicines/stock-chart
// @access  Private
const getStockChart = async (req, res) => {
  try {
    // Get top medicines by stock level
    const medicines = await Medicine.find()
      .sort({ currentStock: -1 })
      .limit(10);
    
    if (medicines.length === 0) {
      // Return empty chart data
      return res.json({
        labels: ['No medicines added yet'],
        datasets: [
          {
            label: 'Current Stock',
            data: [0],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Minimum Required',
            data: [0],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      });
    }
    
    const data = {
      labels: medicines.map(med => med.name),
      datasets: [
        {
          label: 'Current Stock',
          data: medicines.map(med => med.currentStock),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Minimum Required',
          data: medicines.map(med => med.minStockLevel),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get demand prediction chart data
// @route   GET /api/medicines/demand-chart
// @access  Private
const getDemandChart = async (req, res) => {
  try {
    const { predictDemand } = require('../utils/demandPredictor');
    const predictions = await predictDemand();
    
    if (predictions.length === 0) {
      // Return empty chart data
      return res.json({
        labels: ['No data available yet'],
        datasets: [
          {
            label: 'Predicted Demand Multiplier',
            data: [0],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            tension: 0.4,
          },
        ],
      });
    }
    
    // Sort by demand multiplier
    predictions.sort((a, b) => b.predictedDemandMultiplier - a.predictedDemandMultiplier);
    
    // Take top 10
    const topPredictions = predictions.slice(0, 10);
    
    const data = {
      labels: topPredictions.map(pred => pred.medicine),
      datasets: [
        {
          label: 'Predicted Demand Multiplier',
          data: topPredictions.map(pred => pred.predictedDemandMultiplier),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          tension: 0.4,
        },
      ],
    };
    
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get climate-based demand prediction
// @route   GET /api/medicines/climate-demand
// @access  Private
const getClimateDemand = async (req, res) => {
  try {
    const { 
      predictDemand, 
      getSeasonByMonth, 
      getCurrentClimate,
      diseasePatternsByClimate,
      diseasePatternsBySeason
    } = require('../utils/demandPredictor');
    
    const predictions = await predictDemand();
    const currentMonth = new Date().getMonth();
    const currentSeason = getSeasonByMonth(currentMonth);
    const currentClimate = getCurrentClimate();
    
    // Get high-risk categories for this season and climate
    const highRiskCategories = [...new Set([
      ...diseasePatternsBySeason[currentSeason],
      ...diseasePatternsByClimate[currentClimate]
    ])];
    
    res.json({
      predictions,
      currentSeason,
      currentClimate,
      highRiskCategories
    });
  } catch (error) {
    console.error('Error generating climate demand data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Seed sample medicine data
// @route   GET /api/medicines/seed-sample-data
// @access  Private
const seedSampleData = async (req, res) => {
  try {
    console.log('Attempting to seed enhanced sample data...');
    
    // Get current date for relative expiry dates
    const today = new Date();
    
    // Sample medicine data with diverse scenarios
    const sampleMedicines = [
      // Regular medicines with good stock
      {
        name: 'Paracetamol',
        category: 'Analgesics',
        currentStock: 100,
        minStockLevel: 20,
        unitPrice: 2.50,
        expiryDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        manufacturer: 'Cipla',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 1.5,
            spring: 1.2,
            summer: 1.0,
            fall: 1.3,
          },
          climateDependent: true,
          climateFactors: {
            rainy: 1.3,
            dry: 0.9,
            cold: 1.8,
            hot: 1.1,
          },
        },
        stockHistory: [
          {
            quantity: 100,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      
      // Low stock items to trigger alerts
      {
        name: 'Amoxicillin',
        category: 'Antibiotics',
        currentStock: 12, // Below min stock
        minStockLevel: 15,
        unitPrice: 5.75,
        expiryDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        manufacturer: 'Sun Pharma',
        demandFactors: {
          seasonal: false,
          seasonalTrend: {
            winter: 1,
            spring: 1,
            summer: 1,
            fall: 1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 12,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      {
        name: 'Ibuprofen',
        category: 'Analgesics',
        currentStock: 5, // Very low stock
        minStockLevel: 20,
        unitPrice: 3.25,
        expiryDate: new Date(today.getTime() + 240 * 24 * 60 * 60 * 1000),
        manufacturer: 'GSK',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 1.3,
            spring: 1.0,
            summer: 0.8,
            fall: 1.1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1.0,
            dry: 1.0,
            cold: 1.0,
            hot: 1.0,
          },
        },
        stockHistory: [
          {
            quantity: 5,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      
      // Expiring soon medicines
      {
        name: 'Diazepam',
        category: 'Anxiolytics',
        currentStock: 40,
        minStockLevel: 10,
        unitPrice: 7.80,
        expiryDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        manufacturer: 'Ranbaxy',
        demandFactors: {
          seasonal: false,
          seasonalTrend: {
            winter: 1,
            spring: 1,
            summer: 1,
            fall: 1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 40,
            operation: 'added',
            date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000), // Added 60 days ago
          },
        ],
      },
      {
        name: 'Aspirin',
        category: 'Analgesics',
        currentStock: 65,
        minStockLevel: 15,
        unitPrice: 1.99,
        expiryDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        manufacturer: 'Bayer',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 1.2,
            spring: 1.0,
            summer: 0.9,
            fall: 1.1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 65,
            operation: 'added',
            date: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000), // Added 75 days ago
          },
        ],
      },
      
      // High demand prediction items
      {
        name: 'Vitamin C',
        category: 'Vitamins',
        currentStock: 120,
        minStockLevel: 25,
        unitPrice: 4.95,
        expiryDate: new Date(today.getTime() + 450 * 24 * 60 * 60 * 1000),
        manufacturer: 'Himalaya',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 2.5, // High winter demand
            spring: 1.5,
            summer: 0.9,
            fall: 1.3,
          },
          climateDependent: true,
          climateFactors: {
            rainy: 1.2,
            dry: 0.9,
            cold: 2.0, // High demand in cold weather
            hot: 0.8,
          }
        },
        stockHistory: [
          {
            quantity: 120,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      
      // Both low stock and expiring soon
      {
        name: 'Cetirizine',
        category: 'Antihistamines',
        currentStock: 7, // Low stock
        minStockLevel: 15,
        unitPrice: 3.50,
        expiryDate: new Date(today.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        manufacturer: 'Cipla',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 0.8,
            spring: 2.2, // High demand in spring (allergy season)
            summer: 1.3,
            fall: 1.1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 7,
            operation: 'added',
            date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), // Added 90 days ago
          },
        ],
      },
      
      // More variety of regular medicines
      {
        name: 'Metformin',
        category: 'Antidiabetics',
        currentStock: 85,
        minStockLevel: 20,
        unitPrice: 6.75,
        expiryDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000),
        manufacturer: 'USV',
        demandFactors: {
          seasonal: false,
          seasonalTrend: {
            winter: 1,
            spring: 1,
            summer: 1,
            fall: 1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 85,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      {
        name: 'Atorvastatin',
        category: 'Statins',
        currentStock: 70,
        minStockLevel: 15,
        unitPrice: 8.99,
        expiryDate: new Date(today.getTime() + 300 * 24 * 60 * 60 * 1000),
        manufacturer: 'Lupin',
        demandFactors: {
          seasonal: false,
          seasonalTrend: {
            winter: 1,
            spring: 1,
            summer: 1,
            fall: 1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 70,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      {
        name: 'Loratadine',
        category: 'Antihistamines',
        currentStock: 50,
        minStockLevel: 20,
        unitPrice: 4.25,
        expiryDate: new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000),
        manufacturer: 'Cipla',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 0.7,
            spring: 2.5, // Very high spring demand
            summer: 1.6,
            fall: 1.2,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 50,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      {
        name: 'Omeprazole',
        category: 'Proton Pump Inhibitors',
        currentStock: 30,
        minStockLevel: 25,
        unitPrice: 5.50,
        expiryDate: new Date(today.getTime() + 240 * 24 * 60 * 60 * 1000),
        manufacturer: 'AstraZeneca',
        demandFactors: {
          seasonal: false,
          seasonalTrend: {
            winter: 1,
            spring: 1,
            summer: 1,
            fall: 1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 30,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      {
        name: 'Cough Syrup',
        category: 'Cough & Cold',
        currentStock: 45,
        minStockLevel: 20,
        unitPrice: 4.75,
        expiryDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000),
        manufacturer: 'Patanjali',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 2.2, // High winter demand
            spring: 1.0,
            summer: 0.6,
            fall: 1.4,
          },
          climateDependent: true,
          climateFactors: {
            rainy: 1.5,
            dry: 0.7,
            cold: 2.0, // High demand in cold
            hot: 0.6,
          },
        },
        stockHistory: [
          {
            quantity: 45,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      {
        name: 'Multivitamin',
        category: 'Vitamins',
        currentStock: 90,
        minStockLevel: 30,
        unitPrice: 7.95,
        expiryDate: new Date(today.getTime() + 545 * 24 * 60 * 60 * 1000), // Long shelf life
        manufacturer: 'Himalaya',
        demandFactors: {
          seasonal: true,
          seasonalTrend: {
            winter: 1.4,
            spring: 1.1,
            summer: 0.9,
            fall: 1.2,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 90,
            operation: 'added',
            date: new Date(),
          },
        ],
      },
      // Critical items - both expiring very soon and very low stock
      {
        name: 'Insulin',
        category: 'Antidiabetics',
        currentStock: 3, // Critically low stock
        minStockLevel: 10,
        unitPrice: 25.99,
        expiryDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // Only 10 days left
        manufacturer: 'Novo Nordisk',
        demandFactors: {
          seasonal: false,
          seasonalTrend: {
            winter: 1,
            spring: 1,
            summer: 1,
            fall: 1,
          },
          climateDependent: false,
          climateFactors: {
            rainy: 1,
            dry: 1,
            cold: 1,
            hot: 1,
          },
        },
        stockHistory: [
          {
            quantity: 3,
            operation: 'added',
            date: new Date(today.getTime() - 80 * 24 * 60 * 60 * 1000),
          },
        ],
      }
    ];

    // Clear existing data
    const deleteResult = await Medicine.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing medicines`);
    
    // Insert sample data
    const insertResult = await Medicine.insertMany(sampleMedicines);
    console.log(`Inserted ${insertResult.length} sample medicines`);
    
    // Generate alerts after seeding data
    const { generateAlerts } = require('../utils/alertGenerator');
    await generateAlerts();

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Extended sample data loaded and alerts generated successfully!',
      count: insertResult.length
    });
  } catch (error) {
    console.error('Error seeding sample data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error seeding data: ' + error.message,
      error: error.toString()
    });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getSummary,
  getStockChart,
  getDemandChart,
  getClimateDemand,
  seedSampleData,
};
