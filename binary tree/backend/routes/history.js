/**
 * History Routes
 * Handles user history operations
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/history
// @desc    Add history entry
// @access  Private
router.post('/', [
  auth,
  body('type').isIn(['sort', 'search', 'tree', 'graph', 'challenge', 'playground']).withMessage('Invalid history type'),
  body('data').notEmpty().withMessage('History data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, data } = req.body;

    await req.user.addHistoryEntry(type, data);

    res.json({
      success: true,
      message: 'History entry added successfully'
    });
  } catch (error) {
    console.error('Add history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding history'
    });
  }
});

// @route   GET /api/history
// @desc    Get user history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const user = await User.findById(req.user._id).select('history');
    
    const history = user.history.slice(0, limit);

    res.json({
      success: true,
      history,
      total: user.history.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving history'
    });
  }
});

// @route   DELETE /api/history/:id
// @desc    Delete specific history entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.history = user.history.filter(
      entry => entry._id.toString() !== req.params.id
    );
    
    await user.save();

    res.json({
      success: true,
      message: 'History entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting history'
    });
  }
});

// @route   DELETE /api/history
// @desc    Clear all history
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.history = [];
    await user.save();

    res.json({
      success: true,
      message: 'History cleared successfully'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing history'
    });
  }
});

// @route   GET /api/history/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('history createdAt');
    
    const history = user.history || [];
    const typeCounts = {};
    
    history.forEach(entry => {
      typeCounts[entry.type] = (typeCounts[entry.type] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOperations = history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    }).length;

    res.json({
      success: true,
      stats: {
        totalOperations: history.length,
        uniqueAlgorithms: Object.keys(typeCounts).length,
        todayOperations,
        typeCounts
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving statistics'
    });
  }
});

module.exports = router;

