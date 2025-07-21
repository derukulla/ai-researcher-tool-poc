/**
 * Profile Search API Routes
 */

const express = require('express');
const { profileSearch } = require('../utils/profileSearch');

const router = express.Router();

/**
 * POST /api/profile-search
 * Search for LinkedIn profiles based on filters
 */
router.post('/search', async (req, res) => {
  try {
    const { filters, options = {} } = req.body;
    
    // Validate required fields
    if (!filters) {
      return res.status(400).json({
        success: false,
        error: 'Filters are required'
      });
    }
    
    // Set default options
    const searchOptions = {
      maxProfiles: options.maxProfiles || 10,
      maxSearchResults: options.maxSearchResults || 30,
      skipCachedProfiles: options.skipCachedProfiles || false
    };
    
    console.log('📋 Profile search request received');
    console.log('Filters:', filters);
    console.log('Options:', searchOptions);
    
    // Perform the search
    const result = await profileSearch(filters, searchOptions);
    
    // Return results
    res.json(result);
    
  } catch (error) {
    console.error('❌ Profile search API error:', error);
    
    // Enhanced error handling for different error types
    let statusCode = 500;
    let errorMessage = error.message;
    
    if (error.message?.includes('rate limit') || error.message?.includes('quota exceeded')) {
      statusCode = 429;
      errorMessage = 'API rate limit exceeded. Please wait before making more requests.';
    } else if (error.message?.includes('invalid api key')) {
      statusCode = 401;
      errorMessage = 'Invalid API credentials. Please check your configuration.';
    } else if (error.message?.includes('network') || error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'External service unavailable. Please try again later.';
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorType: statusCode === 429 ? 'rate_limit' : statusCode === 503 ? 'network' : 'server',
      retryAfter: statusCode === 429 ? 3600 : statusCode === 503 ? 300 : undefined,
      profiles: [],
      summary: {
        searchResults: 0,
        profilesProcessed: 0,
        profilesPassed: 0,
        processingTime: 0
      }
    });
  }
});

/**
 * GET /api/profile-search/test
 * Test endpoint to verify the service is working
 */
router.get('/test', async (req, res) => {
  try {
    const testFilters = {
      degree: 'PhD',
      fieldOfStudy: 'AI',
      instituteTier: '',
      hasTopAIConferences: false,
      hasOtherAIConferences: false,
      hasReputableJournals: false,
      hasOtherJournals: false,
      minPublications: '',
      minCitations: '',
      grantedFirstInventor: false,
      grantedCoInventor: false,
      filedPatent: false,
      significantContribution: false,
      experienceBracket: '',
      minHIndex: ''
    };
    
    const result = await profileSearch(testFilters, {
      maxProfiles: 2,
      maxSearchResults: 10
    });
    
    res.json({
      success: true,
      message: 'Profile search test completed',
      testFilters,
      result
    });
    
  } catch (error) {
    console.error('❌ Profile search test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/profile-search/query-preview
 * Preview the search query that would be generated
 */
router.post('/query-preview', (req, res) => {
  try {
    const { filters } = req.body;
    
    if (!filters) {
      return res.status(400).json({
        success: false,
        error: 'Filters are required'
      });
    }
    
    const { buildLinkedInSearchQuery } = require('../utils/profileSearch');
    const query = buildLinkedInSearchQuery(filters);
    
    res.json({
      success: true,
      query,
      filters,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`
    });
    
  } catch (error) {
    console.error('❌ Query preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 