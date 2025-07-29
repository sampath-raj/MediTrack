const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('../models/Medicine');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

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

// Function to import data
const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Medicine.deleteMany();
    
    // Insert sample data
    await Medicine.insertMany(sampleMedicines);
    
    console.log('Data imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

// Run the import
importData();
