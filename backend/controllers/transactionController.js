const Transaction = require('../models/Transaction');
const Medicine = require('../models/Medicine');

// @desc    Record a new transaction (sale, purchase, etc.)
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const { medicineId, type, quantity, unitPrice, note } = req.body;
    
    // Validate request data
    if (!medicineId || !type || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Please provide valid transaction details' });
    }
    
    // Find the medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Calculate total amount
    const actualUnitPrice = unitPrice || medicine.unitPrice;
    const totalAmount = quantity * actualUnitPrice;
    
    // Create transaction record
    const transaction = await Transaction.create({
      medicineId,
      type,
      quantity,
      unitPrice: actualUnitPrice,
      totalAmount,
      note,
      performedBy: req.user._id,
    });
    
    // Update medicine stock based on transaction type
    if (type === 'sale') {
      // Check if we have enough stock
      if (medicine.currentStock < quantity) {
        return res.status(400).json({ 
          message: 'Insufficient stock for this sale',
          availableStock: medicine.currentStock
        });
      }
      
      // Update current stock
      medicine.currentStock -= quantity;
      
      // Update stock history
      medicine.stockHistory.push({
        quantity,
        operation: 'sold',
        transactionId: transaction._id,
        date: new Date(),
        note
      });
      
      // Update sales data
      medicine.salesData.totalUnitsSold += quantity;
      medicine.salesData.lastSaleDate = new Date();
      
      // Update monthly sales data
      const monthKey = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      const currentMonthlySales = medicine.salesData.salesByMonth.get(monthKey) || 0;
      medicine.salesData.salesByMonth.set(monthKey, currentMonthlySales + quantity);
      
    } else if (type === 'purchase') {
      // Add to stock
      medicine.currentStock += quantity;
      
      // Update stock history
      medicine.stockHistory.push({
        quantity,
        operation: 'added',
        transactionId: transaction._id,
        date: new Date(),
        note
      });
      
    } else if (type === 'return') {
      // Return to stock
      medicine.currentStock += quantity;
      
      // Update stock history
      medicine.stockHistory.push({
        quantity,
        operation: 'returned',
        transactionId: transaction._id,
        date: new Date(),
        note
      });
      
    } else if (type === 'expired') {
      // Remove expired items from stock
      if (medicine.currentStock < quantity) {
        return res.status(400).json({ 
          message: 'Expired quantity cannot exceed current stock',
          availableStock: medicine.currentStock 
        });
      }
      
      medicine.currentStock -= quantity;
      
      // Update stock history
      medicine.stockHistory.push({
        quantity,
        operation: 'expired',
        transactionId: transaction._id,
        date: new Date(),
        note
      });
      
    } else if (type === 'adjustment') {
      // General stock adjustment
      const adjustmentOperation = quantity >= 0 ? 'added' : 'removed';
      const absQuantity = Math.abs(quantity);
      
      // Update current stock
      medicine.currentStock += quantity;
      
      // Make sure stock doesn't go negative
      if (medicine.currentStock < 0) {
        medicine.currentStock = 0;
      }
      
      // Update stock history
      medicine.stockHistory.push({
        quantity: absQuantity,
        operation: adjustmentOperation,
        transactionId: transaction._id,
        date: new Date(),
        note
      });
    }
    
    // Save medicine with updated stock
    await medicine.save();
    
    // Check if stock level is low after transaction
    if (medicine.currentStock <= medicine.minStockLevel) {
      // Import alert generator and create low stock alert
      const { generateStockAlert } = require('../utils/alertGenerator');
      await generateStockAlert(medicine);
    }
    
    res.status(201).json({
      success: true,
      transaction,
      newStockLevel: medicine.currentStock
    });
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all transactions with optional filtering
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate, medicineId } = req.query;
    
    let query = {};
    
    // Apply filters
    if (type) {
      query.type = type;
    }
    
    if (medicineId) {
      query.medicineId = medicineId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Add one day to include the end date fully
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        query.createdAt.$lte = endDateObj;
      }
    }
    
    const transactions = await Transaction.find(query)
      .populate('medicineId', 'name category')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('medicineId', 'name category unitPrice expiryDate manufacturer')
      .populate('performedBy', 'name email');
    
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get sales summary data
// @route   GET /api/transactions/sales-summary
// @access  Private
const getSalesSummary = async (req, res) => {
  try {
    const { period } = req.query;
    let startDate, endDate = new Date();
    
    // Determine date range based on period
    switch(period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        // Default to last 30 days
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get sales transactions in date range
    const salesTransactions = await Transaction.find({
      type: 'sale',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('medicineId', 'name category');
    
    // Calculate total sales amount
    const totalSalesAmount = salesTransactions.reduce(
      (sum, transaction) => sum + transaction.totalAmount, 
      0
    );
    
    // Count total units sold
    const totalUnitsSold = salesTransactions.reduce(
      (sum, transaction) => sum + transaction.quantity, 
      0
    );
    
    // Group by medicine category
    const salesByCategory = {};
    salesTransactions.forEach(transaction => {
      const category = transaction.medicineId?.category || 'Uncategorized';
      if (!salesByCategory[category]) {
        salesByCategory[category] = {
          totalAmount: 0,
          unitsSold: 0,
          count: 0
        };
      }
      
      salesByCategory[category].totalAmount += transaction.totalAmount;
      salesByCategory[category].unitsSold += transaction.quantity;
      salesByCategory[category].count += 1;
    });
    
    // Group by date for trend analysis
    const salesByDate = {};
    salesTransactions.forEach(transaction => {
      const dateKey = transaction.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = {
          totalAmount: 0,
          unitsSold: 0,
          count: 0
        };
      }
      
      salesByDate[dateKey].totalAmount += transaction.totalAmount;
      salesByDate[dateKey].unitsSold += transaction.quantity;
      salesByDate[dateKey].count += 1;
    });
    
    // Get top selling medicines
    const medicineMap = {};
    salesTransactions.forEach(transaction => {
      const medicineId = transaction.medicineId?._id.toString();
      
      if (!medicineId) return;
      
      if (!medicineMap[medicineId]) {
        medicineMap[medicineId] = {
          medicineId,
          name: transaction.medicineId.name,
          category: transaction.medicineId.category,
          totalAmount: 0,
          unitsSold: 0
        };
      }
      
      medicineMap[medicineId].totalAmount += transaction.totalAmount;
      medicineMap[medicineId].unitsSold += transaction.quantity;
    });
    
    const topSellingMedicines = Object.values(medicineMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);
    
    res.json({
      totalSalesAmount,
      totalUnitsSold,
      transactionCount: salesTransactions.length,
      salesByCategory,
      salesByDate,
      topSellingMedicines,
      dateRange: {
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error generating sales summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getSalesSummary
};
