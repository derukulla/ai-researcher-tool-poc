/**
 * Temporary Patent Cache System
 * Caches SerpAPI responses to avoid hitting API limits
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cache directory
const CACHE_DIR = path.join(__dirname, '../cache');

// Cache expiry options:
// - 24 * 60 * 60 * 1000 (24 hours): Very fresh data, high API usage
// - 168 * 60 * 60 * 1000 (1 week): Good balance for active patents
// - 720 * 60 * 60 * 1000 (1 month): Good for established patent portfolios
// - 8760 * 60 * 60 * 1000 (1 year): For very stable patent records
let CACHE_EXPIRY = 720 * 60 * 60 * 1000; // 30 days in milliseconds (was 24 hours)

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    console.log('📁 Created cache directory:', CACHE_DIR);
  }
}

/**
 * Generate cache key from search parameters
 */
function getCacheKey(inventorName, status) {
  const searchParams = `${inventorName.toLowerCase()}_${status.toLowerCase()}`;
  return crypto.createHash('md5').update(searchParams).digest('hex');
}

/**
 * Get cache file path
 */
function getCacheFilePath(cacheKey) {
  return path.join(CACHE_DIR, `patent_${cacheKey}.json`);
}

/**
 * Check if cache entry is valid (not expired)
 */
function isCacheValid(cacheFilePath) {
  try {
    const stats = fs.statSync(cacheFilePath);
    const age = Date.now() - stats.mtime.getTime();
    
    // Use override expiry if set, otherwise use default
    const effectiveExpiry = global.OVERRIDE_PATENT_CACHE_EXPIRY !== undefined ? 
      global.OVERRIDE_PATENT_CACHE_EXPIRY : CACHE_EXPIRY;
    
    // If expiry is 0, cache never expires
    if (effectiveExpiry === 0) {
      return true;
    }
    
    return age < effectiveExpiry;
  } catch (error) {
    return false;
  }
}

/**
 * Load cached result
 */
function loadFromCache(inventorName, status) {
  ensureCacheDir();
  
  const cacheKey = getCacheKey(inventorName, status);
  const cacheFilePath = getCacheFilePath(cacheKey);
  
  if (fs.existsSync(cacheFilePath) && isCacheValid(cacheFilePath)) {
    try {
      const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
      console.log(`💾 Cache HIT for ${inventorName} (${status})`);
      return cachedData;
    } catch (error) {
      console.error('❌ Cache read error:', error.message);
      // Delete corrupted cache file
      fs.unlinkSync(cacheFilePath);
    }
  }
  
  console.log(`🔍 Cache MISS for ${inventorName} (${status})`);
  return null;
}

/**
 * Save result to cache
 */
function saveToCache(inventorName, status, data) {
  ensureCacheDir();
  
  const cacheKey = getCacheKey(inventorName, status);
  const cacheFilePath = getCacheFilePath(cacheKey);
  
  try {
    const cacheData = {
      searchParams: { inventorName, status },
      timestamp: Date.now(),
      data: data
    };
    
    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData, null, 2));
    console.log(`💾 Cached result for ${inventorName} (${status})`);
  } catch (error) {
    console.error('❌ Cache write error:', error.message);
  }
}

/**
 * Clear all cache files
 */
function clearCache() {
  ensureCacheDir();
  
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const patentFiles = files.filter(file => file.startsWith('patent_') && file.endsWith('.json'));
    
    patentFiles.forEach(file => {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    });
    
    console.log(`🗑️ Cleared ${patentFiles.length} cache files`);
  } catch (error) {
    console.error('❌ Cache clear error:', error.message);
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  ensureCacheDir();
  
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const patentFiles = files.filter(file => file.startsWith('patent_') && file.endsWith('.json'));
    
    let validCount = 0;
    let expiredCount = 0;
    let totalSize = 0;
    
    patentFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (isCacheValid(filePath)) {
        validCount++;
      } else {
        expiredCount++;
      }
    });
    
    return {
      totalFiles: patentFiles.length,
      validFiles: validCount,
      expiredFiles: expiredCount,
      totalSizeKB: Math.round(totalSize / 1024),
      cacheDir: CACHE_DIR
    };
  } catch (error) {
    console.error('❌ Cache stats error:', error.message);
    return null;
  }
}

/**
 * Clean expired cache files
 */
function cleanExpiredCache() {
  ensureCacheDir();
  
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const patentFiles = files.filter(file => file.startsWith('patent_') && file.endsWith('.json'));
    
    let cleanedCount = 0;
    
    patentFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      if (!isCacheValid(filePath)) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });
    
    console.log(`🧹 Cleaned ${cleanedCount} expired cache files`);
  } catch (error) {
    console.error('❌ Cache cleanup error:', error.message);
  }
}

/**
 * Set patent cache expiry time (runtime override)
 * @param {number} milliseconds - New expiry time in milliseconds (0 = never expire)
 */
function setPatentCacheExpiry(milliseconds) {
  global.OVERRIDE_PATENT_CACHE_EXPIRY = milliseconds;
  const hours = milliseconds / (1000 * 60 * 60);
  console.log(`📅 Patent cache expiry temporarily set to ${hours} hours (${hours/24} days)`);
  if (milliseconds === 0) {
    console.log('⚠️ Warning: Patent cache will never expire automatically');
  }
}

/**
 * Get current patent cache expiry setting
 */
function getPatentCacheExpiry() {
  const effectiveExpiry = global.OVERRIDE_PATENT_CACHE_EXPIRY !== undefined ? 
    global.OVERRIDE_PATENT_CACHE_EXPIRY : CACHE_EXPIRY;
  
  const hours = effectiveExpiry / (1000 * 60 * 60);
  
  return {
    milliseconds: effectiveExpiry,
    hours: hours,
    days: hours / 24,
    description: effectiveExpiry === 0 ? 'Never expires' : `${hours} hours`,
    isOverridden: global.OVERRIDE_PATENT_CACHE_EXPIRY !== undefined,
    defaultMilliseconds: CACHE_EXPIRY
  };
}

/**
 * Clear expired patent cache files only
 */
function clearExpiredPatentCache() {
  ensureCacheDir();
  
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const patentFiles = files.filter(file => file.startsWith('patent_') && file.endsWith('.json'));
    
    let clearedCount = 0;
    
    patentFiles.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      if (!isCacheValid(filePath)) {
        fs.unlinkSync(filePath);
        clearedCount++;
      }
    });
    
    if (clearedCount > 0) {
      console.log(`🗑️ Cleared ${clearedCount} expired patent cache files`);
    }
    return clearedCount;
  } catch (error) {
    console.error('❌ Patent cache cleanup error:', error.message);
    return 0;
  }
}

module.exports = {
  loadFromCache,
  saveToCache,
  clearCache,
  getCacheStats,
  cleanExpiredCache,
  CACHE_DIR,
  
  // New cache management functions
  setPatentCacheExpiry,
  getPatentCacheExpiry,
  clearExpiredPatentCache
}; 