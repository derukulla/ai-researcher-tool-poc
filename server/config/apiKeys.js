/**
 * API Keys Configuration
 * Centralized management of all API keys and configuration
 */

require('dotenv').config();

// =============================================================================
// API KEYS CONFIGURATION
// =============================================================================

const API_KEYS = {
  // SerpAPI - For Google Scholar and Patent searches
  SERPAPI: {
    key: 'your_serpapi_api_key_here',
    required: true,
    description: 'SerpAPI key for Google Scholar and Patent searches',
    signupUrl: 'https://serpapi.com'
  },

  // People Data Labs - For LinkedIn profile data
  PDL: {
    key: 'your_pdl_api_key_here',
    required: true,
    description: 'People Data Labs API key for LinkedIn profiles',
    signupUrl: 'https://www.peopledatalabs.com'
  },

  // GitHub - For repository and profile analysis
  GITHUB: {
    key: 'your_github_token_here',
    required: true,
    description: 'GitHub Personal Access Token',
    signupUrl: 'https://github.com/settings/tokens'
  },

  // Google Gemini - For enhanced AI processing (optional)
  GEMINI: {
    key: null,
    required: false,
    description: 'Google Gemini API key for enhanced AI processing',
    signupUrl: 'https://ai.google.dev'
  }
};

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

const SERVER_CONFIG = {
  PORT: 5000,
  NODE_ENV: 'development',
  
  // Cache configuration
  CACHE_EXPIRY_HOURS: 720, // 30 days
  
  // Rate limiting
  API_DELAY_MS: 2000,
  
  // Request timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // File upload limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// =============================================================================
// SCORING WEIGHTS CONFIGURATION
// =============================================================================

const SCORING_WEIGHTS = {
  education: 0.25,      // 25%
  patents: 0.13,          // 13%
  publications: 0.30, // 30%
  workExperience: 0.30, // 30%
  github: 0.02             // 2%
};

// =============================================================================
// VALIDATION AND HELPER FUNCTIONS
// =============================================================================

/**
 * Validate that all required API keys are present
 * @returns {Object} Validation result with status and missing keys
 */
function validateAPIKeys() {
  const missing = [];
  const warnings = [];
  
  Object.entries(API_KEYS).forEach(([name, config]) => {
    if (config.required && (!config.key || config.key.includes('your_'))) {
      missing.push({
        name,
        description: config.description,
        signupUrl: config.signupUrl
      });
    } else if (!config.required && (!config.key || config.key.includes('your_'))) {
      warnings.push({
        name,
        description: config.description,
        signupUrl: config.signupUrl
      });
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Get a specific API key
 * @param {string} keyName - Name of the API key (SERPAPI, PDL, GITHUB, GEMINI)
 * @returns {string|null} API key value
 */
function getAPIKey(keyName) {
  const config = API_KEYS[keyName.toUpperCase()];
  if (!config) {
    throw new Error(`Unknown API key: ${keyName}`);
  }
  
  if (config.required && (!config.key || config.key.includes('your_'))) {
    throw new Error(`Required API key ${keyName} is not configured. Please add ${keyName}_API_KEY to your .env file. Get it from: ${config.signupUrl}`);
  }
  
  return config.key;
}

/**
 * Check if an API key is configured
 * @param {string} keyName - Name of the API key
 * @returns {boolean} True if key is configured
 */
function hasAPIKey(keyName) {
  const config = API_KEYS[keyName.toUpperCase()];
  return config && config.key && !config.key.includes('your_');
}

/**
 * Log configuration status
 */
function logConfigStatus() {
  console.log('🔑 API Keys Configuration Status:');
  console.log('=' .repeat(50));
  
  Object.entries(API_KEYS).forEach(([name, config]) => {
    const isConfigured = config.key && !config.key.includes('your_');
    const status = isConfigured ? '✅' : (config.required ? '❌' : '⚠️');
    const requiredText = config.required ? '(Required)' : '(Optional)';
    
    console.log(`${status} ${name}: ${isConfigured ? 'Configured' : 'Not configured'} ${requiredText}`);
  });
  
  console.log('=' .repeat(50));
  
  const validation = validateAPIKeys();
  if (!validation.isValid) {
    console.log('❌ Missing required API keys:');
    validation.missing.forEach(key => {
      console.log(`   - ${key.name}: ${key.description}`);
      console.log(`     Get it from: ${key.signupUrl}`);
    });
    console.log('');
  }
  
  if (validation.warnings.length > 0) {
    console.log('⚠️  Optional API keys not configured:');
    validation.warnings.forEach(key => {
      console.log(`   - ${key.name}: ${key.description}`);
      console.log(`     Get it from: ${key.signupUrl}`);
    });
    console.log('');
  }
  
  if (validation.isValid) {
    console.log('✅ All required API keys are configured!');
  }
  
  console.log('');
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // API Keys
  SERPAPI_API_KEY: getAPIKey('SERPAPI'),
  PDL_API_KEY: getAPIKey('PDL'),
  GITHUB_TOKEN: getAPIKey('GITHUB'),
  GEMINI_API_KEY: API_KEYS.GEMINI.key,
  
  // Server configuration
  ...SERVER_CONFIG,
  
  // Scoring weights
  SCORING_WEIGHTS,
  
  // Helper functions
  getAPIKey,
  hasAPIKey,
  validateAPIKeys,
  logConfigStatus,
  
  // Raw configuration objects
  API_KEYS,
  SERVER_CONFIG
};

// Log configuration status when module is loaded in development
if (SERVER_CONFIG.NODE_ENV === 'development') {
  logConfigStatus();
} 