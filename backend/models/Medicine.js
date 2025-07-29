const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: true,
      default: 10,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    manufacturer: {
      type: String,
    },
    stockHistory: [
      {
        quantity: {
          type: Number,
          required: true,
        },
        operation: {
          type: String,
          enum: ['added', 'removed', 'sold', 'expired', 'returned'],
          required: true,
        },
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transaction',
        },
        date: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    salesData: {
      totalUnitsSold: {
        type: Number, 
        default: 0
      },
      lastSaleDate: Date,
      salesByMonth: {
        type: Map,
        of: Number,
        default: {}
      },
    },
    demandFactors: {
      seasonal: {
        type: Boolean,
        default: false,
      },
      seasonalTrend: {
        winter: { type: Number, default: 1 },
        spring: { type: Number, default: 1 },
        summer: { type: Number, default: 1 },
        fall: { type: Number, default: 1 },
      },
      climateDependent: {
        type: Boolean,
        default: false,
      },
      climateFactors: {
        rainy: { type: Number, default: 1 },
        dry: { type: Number, default: 1 },
        cold: { type: Number, default: 1 },
        hot: { type: Number, default: 1 },
      },
      diseasePatterns: {
        type: [{
          condition: String,     // e.g., "Fever", "Flu", "Allergies"
          seasonality: String,   // e.g., "All year", "Winter", "Monsoon"
          climateFactors: [String], // e.g., ["rainy", "cold"]
          demandIncrease: Number // Multiplier for demand
        }],
        default: []
      }
    },
  },
  {
    timestamps: true,
  }
);

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
