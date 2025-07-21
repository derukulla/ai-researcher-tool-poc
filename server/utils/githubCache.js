/**
 * GitHub API Cache System
 * Caches GitHub user profiles and search results to avoid rate limits
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours
const CACHE_PREFIX = 'github_';

// =============================================================================
// CACHE UTILITY FUNCTIONS
// =============================================================================

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`📁 Created cache directory: ${CACHE_DIR}`);
  }
}

/**
 * Generate cache key from query parameters
 * @param {string} type - Type of cache (user, search)
 * @param {string} query - Query parameter (username, search term)
 * @returns {string} Cache key
 */
function generateCacheKey(type, query) {
  const normalizedQuery = query.toLowerCase().trim();
  const hash = crypto.createHash('md5').update(`${type}_${normalizedQuery}`).digest('hex');
  return `${CACHE_PREFIX}${type}_${hash}`;
}

/**
 * Get cache file path
 * @param {string} cacheKey - Cache key
 * @returns {string} Full path to cache file
 */
function getCacheFilePath(cacheKey) {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

/**
 * Check if cache entry is expired
 * @param {number} timestamp - Cache timestamp
 * @returns {boolean} True if expired
 */
function isCacheExpired(timestamp) {
  const now = Date.now();
  const expiryTime = timestamp + (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);
  return now > expiryTime;
}

// =============================================================================
// CACHE OPERATIONS
// =============================================================================

/**
 * Get cached data
 * @param {string} type - Type of cache (user, search)
 * @param {string} query - Query parameter
 * @returns {object|null} Cached data or null if not found/expired
 */
function getCachedData(type, query) {
  try {
    ensureCacheDir();
    
    const cacheKey = generateCacheKey(type, query);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    if (!fs.existsSync(cacheFilePath)) {
      return null;
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    
    if (isCacheExpired(cacheData.timestamp)) {
      console.log(`🗑️ Cache expired for ${type}:${query}, removing...`);
      fs.unlinkSync(cacheFilePath);
      return null;
    }
    
    console.log(`💾 Cache hit for ${type}:${query}`);
    return cacheData.data;
    
  } catch (error) {
    console.error(`❌ Error reading cache for ${type}:${query}:`, error.message);
    return null;
  }
}

/**
 * Save data to cache
 * @param {string} type - Type of cache (user, search)
 * @param {string} query - Query parameter
 * @param {object} data - Data to cache
 */
function setCachedData(type, query, data) {
  try {
    ensureCacheDir();
    
    const cacheKey = generateCacheKey(type, query);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    const cacheData = {
      timestamp: Date.now(),
      type: type,
      query: query,
      data: data
    };
    
    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2));
    console.log(`💾 Cached ${type}:${query} data`);
    
  } catch (error) {
    console.error(`❌ Error saving cache for ${type}:${query}:`, error.message);
  }
}

/**
 * Clear all GitHub cache files
 */
function clearGitHubCache() {
  try {
    ensureCacheDir();
    
    const files = fs.readdirSync(CACHE_DIR);
    const githubFiles = files.filter(file => file.startsWith(CACHE_PREFIX));
    
    let deletedCount = 0;
    githubFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      fs.unlinkSync(filePath);
      deletedCount++;
    });
    
    console.log(`🗑️ Cleared ${deletedCount} GitHub cache files`);
    return deletedCount;
    
  } catch (error) {
    console.error('❌ Error clearing GitHub cache:', error.message);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
function getCacheStats() {
  try {
    ensureCacheDir();
    
    const files = fs.readdirSync(CACHE_DIR);
    const githubFiles = files.filter(file => file.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    let validCount = 0;
    let expiredCount = 0;
    
    githubFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      try {
        const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (isCacheExpired(cacheData.timestamp)) {
          expiredCount++;
        } else {
          validCount++;
        }
      } catch (error) {
        expiredCount++;
      }
    });
    
    return {
      totalFiles: githubFiles.length,
      validFiles: validCount,
      expiredFiles: expiredCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
    
  } catch (error) {
    console.error('❌ Error getting cache stats:', error.message);
    return {
      totalFiles: 0,
      validFiles: 0,
      expiredFiles: 0,
      totalSizeBytes: 0,
      totalSizeMB: '0.00'
    };
  }
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  try {
    ensureCacheDir();
    
    const files = fs.readdirSync(CACHE_DIR);
    const githubFiles = files.filter(file => file.startsWith(CACHE_PREFIX));
    
    let deletedCount = 0;
    githubFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      
      try {
        const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (isCacheExpired(cacheData.timestamp)) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (error) {
        // If we can't read the file, it's probably corrupted, so delete it
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    console.log(`🗑️ Cleaned ${deletedCount} expired GitHub cache files`);
    return deletedCount;
    
  } catch (error) {
    console.error('❌ Error cleaning expired cache:', error.message);
    return 0;
  }
}

// =============================================================================
// SPECIFIC CACHE FUNCTIONS
// =============================================================================

/**
 * Get cached GitHub user profile
 * @param {string} username - GitHub username
 * @returns {object|null} Cached user profile or null
 */
function getCachedUserProfile(username) {
  return getCachedData('user', username);
}

/**
 * Cache GitHub user profile
 * @param {string} username - GitHub username
 * @param {object} profileData - User profile data
 */
function setCachedUserProfile(username, profileData) {
  setCachedData('user', username, profileData);
}

/**
 * Get cached GitHub search results
 * @param {string} searchTerm - Search term
 * @returns {object|null} Cached search results or null
 */
function getCachedSearchResults(searchTerm) {
  return getCachedData('search', searchTerm);
}

/**
 * Cache GitHub search results
 * @param {string} searchTerm - Search term
 * @param {object} searchResults - Search results data
 */
function setCachedSearchResults(searchTerm, searchResults) {
  setCachedData('search', searchTerm, searchResults);
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getCachedUserProfile,
  setCachedUserProfile,
  getCachedSearchResults,
  setCachedSearchResults,
  clearGitHubCache,
  getCacheStats,
  cleanExpiredCache,
  generateCacheKey,
  isCacheExpired
}; 