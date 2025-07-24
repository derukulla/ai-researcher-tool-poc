/**
 * Cache Management Routes
 * Provides endpoints for managing LinkedIn profile cache
 */

const express = require('express');
const router = express.Router();
const { getCacheStats, clearAllCache, cleanupExpiredCache } = require('../utils/linkedinCache');

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/cache/clear
 * Clear all cached profiles
 */
router.delete('/clear', (req, res) => {
  try {
    clearAllCache();
    res.json({
      success: true,
      message: 'All cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cache/cleanup
 * Clean up expired cache entries
 */
router.post('/cleanup', (req, res) => {
  try {
    cleanupExpiredCache();
    const stats = getCacheStats();
    res.json({
      success: true,
      message: 'Expired cache entries cleaned up',
      stats
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 