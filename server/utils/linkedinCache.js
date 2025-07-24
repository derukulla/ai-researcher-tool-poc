/**
 * LinkedIn Profile Cache System
 * Comprehensive caching for LinkedIn profiles to avoid API rate limits
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cache configuration
const CACHE_CONFIG = {
  cacheDir: path.join(__dirname, '../cache/linkedin'),
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  cleanupInterval: 24 * 60 * 60 * 1000, // Run cleanup every 24 hours
  compressionEnabled: true,
  maxCacheSize: 1000 // Maximum number of cached profiles
};

// In-memory cache for frequently accessed profiles
const memoryCache = new Map();
const cacheMetadata = new Map();

/**
 * Initialize cache system
 */
function initializeCache() {
  // Create cache directory if it doesn't exist
  if (!fs.existsSync(CACHE_CONFIG.cacheDir)) {
    fs.mkdirSync(CACHE_CONFIG.cacheDir, { recursive: true });
    console.log(`📁 Created LinkedIn cache directory: ${CACHE_CONFIG.cacheDir}`);
  }

  // Load existing cache metadata
  loadCacheMetadata();

  // Start periodic cleanup
  setInterval(cleanupExpiredCache, CACHE_CONFIG.cleanupInterval);

  console.log('🔄 LinkedIn cache system initialized');
}

/**
 * Generate cache key for a LinkedIn profile
 * @param {string} linkedinId - LinkedIn ID
 * @returns {string} Cache key
 */
function generateCacheKey(linkedinId) {
  const normalizedId = linkedinId.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return crypto.createHash('md5').update(`linkedin_${normalizedId}`).digest('hex');
}

/**
 * Generate file path for cache entry
 * @param {string} cacheKey - Cache key
 * @returns {string} File path
 */
function getCacheFilePath(cacheKey) {
  return path.join(CACHE_CONFIG.cacheDir, `${cacheKey}.json`);
}

/**
 * Load cache metadata from disk
 */
function loadCacheMetadata() {
  const metadataPath = path.join(CACHE_CONFIG.cacheDir, 'metadata.json');
  
  try {
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Convert to Map and restore dates
      Object.entries(metadata).forEach(([key, data]) => {
        cacheMetadata.set(key, {
          ...data,
          createdAt: new Date(data.createdAt),
          accessedAt: new Date(data.accessedAt)
        });
      });
      
      console.log(`📊 Loaded metadata for ${cacheMetadata.size} cached LinkedIn profiles`);
    }
  } catch (error) {
    console.error('⚠️ Error loading cache metadata:', error.message);
    cacheMetadata.clear();
  }
}

/**
 * Save cache metadata to disk
 */
function saveCacheMetadata() {
  const metadataPath = path.join(CACHE_CONFIG.cacheDir, 'metadata.json');
  
  try {
    // Convert Map to object and serialize dates
    const metadata = {};
    cacheMetadata.forEach((data, key) => {
      metadata[key] = {
        ...data,
        createdAt: data.createdAt.toISOString(),
        accessedAt: data.accessedAt.toISOString()
      };
    });
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('⚠️ Error saving cache metadata:', error.message);
  }
}

/**
 * Check if cache entry is valid (not expired)
 * @param {string} cacheKey - Cache key
 * @returns {boolean} True if valid
 */
function isCacheValid(cacheKey) {
  const metadata = cacheMetadata.get(cacheKey);
  if (!metadata) return false;
  
  const now = Date.now();
  const age = now - metadata.createdAt.getTime();
  
  return age < CACHE_CONFIG.maxAge;
}

/**
 * Get LinkedIn profile from cache
 * @param {string} linkedinId - LinkedIn ID
 * @returns {object|null} Cached profile data or null
 */
function getCachedProfile(linkedinId) {
  const cacheKey = generateCacheKey(linkedinId);
  
  // Check memory cache first
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey);
    if (isCacheValid(cacheKey)) {
      // Update access time
      const metadata = cacheMetadata.get(cacheKey);
      if (metadata) {
        metadata.accessedAt = new Date();
        cacheMetadata.set(cacheKey, metadata);
      }
      
      console.log(`💾 Retrieved LinkedIn profile from memory cache: ${linkedinId}`);
      return cached;
    } else {
      // Remove expired entry from memory
      memoryCache.delete(cacheKey);
    }
  }
  
  // Check file cache
  const filePath = getCacheFilePath(cacheKey);
  
  try {
    if (fs.existsSync(filePath) && isCacheValid(cacheKey)) {
      const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Add to memory cache for faster future access
      memoryCache.set(cacheKey, cached);
      
      // Update access time
      const metadata = cacheMetadata.get(cacheKey);
      if (metadata) {
        metadata.accessedAt = new Date();
        cacheMetadata.set(cacheKey, metadata);
        saveCacheMetadata();
      }
      
      console.log(`💽 Retrieved LinkedIn profile from file cache: ${linkedinId}`);
      return cached;
    }
  } catch (error) {
    console.error(`❌ Error reading cache for ${linkedinId}:`, error.message);
    // Clean up corrupted cache file
    try {
      fs.unlinkSync(filePath);
      cacheMetadata.delete(cacheKey);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
  
  return null;
}

/**
 * Store LinkedIn profile in cache
 * @param {string} linkedinId - LinkedIn ID
 * @param {object} profileData - Profile data to cache
 */
function setCachedProfile(linkedinId, profileData) {
  const cacheKey = generateCacheKey(linkedinId);
  const filePath = getCacheFilePath(cacheKey);
  const now = new Date();
  
  try {
    // Store in memory cache
    memoryCache.set(cacheKey, profileData);
    
    // Store in file cache
    fs.writeFileSync(filePath, JSON.stringify(profileData, null, 2));
    
    // Update metadata
    cacheMetadata.set(cacheKey, {
      linkedinId,
      cacheKey,
      createdAt: now,
      accessedAt: now,
      size: Buffer.byteLength(JSON.stringify(profileData), 'utf8')
    });
    
    saveCacheMetadata();
    
    console.log(`💾 Cached LinkedIn profile: ${linkedinId}`);
    
    // Cleanup if cache is getting too large
    if (cacheMetadata.size > CACHE_CONFIG.maxCacheSize) {
      cleanupOldestEntries(Math.floor(CACHE_CONFIG.maxCacheSize * 0.1)); // Remove 10%
    }
    
  } catch (error) {
    console.error(`❌ Error caching profile for ${linkedinId}:`, error.message);
  }
}

/**
 * Remove oldest cache entries to make space
 * @param {number} entriesToRemove - Number of entries to remove
 */
function cleanupOldestEntries(entriesToRemove) {
  console.log(`🧹 Cleaning up ${entriesToRemove} oldest cache entries...`);
  
  // Sort by access time (oldest first)
  const sortedEntries = Array.from(cacheMetadata.entries())
    .sort(([, a], [, b]) => a.accessedAt.getTime() - b.accessedAt.getTime());
  
  let removed = 0;
  for (const [cacheKey, metadata] of sortedEntries) {
    if (removed >= entriesToRemove) break;
    
    try {
      // Remove from file system
      const filePath = getCacheFilePath(cacheKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Remove from memory and metadata
      memoryCache.delete(cacheKey);
      cacheMetadata.delete(cacheKey);
      
      removed++;
      console.log(`🗑️ Removed cached profile: ${metadata.linkedinId}`);
      
    } catch (error) {
      console.error(`❌ Error removing cache entry ${cacheKey}:`, error.message);
    }
  }
  
  if (removed > 0) {
    saveCacheMetadata();
    console.log(`✅ Cleaned up ${removed} cache entries`);
  }
}

/**
 * Clean up expired cache entries
 */
function cleanupExpiredCache() {
  console.log('🧹 Starting cleanup of expired LinkedIn cache entries...');
  
  const now = Date.now();
  let removed = 0;
  
  for (const [cacheKey, metadata] of cacheMetadata.entries()) {
    const age = now - metadata.createdAt.getTime();
    
    if (age > CACHE_CONFIG.maxAge) {
      try {
        // Remove from file system
        const filePath = getCacheFilePath(cacheKey);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Remove from memory and metadata
        memoryCache.delete(cacheKey);
        cacheMetadata.delete(cacheKey);
        
        removed++;
        console.log(`🗑️ Removed expired profile: ${metadata.linkedinId}`);
        
      } catch (error) {
        console.error(`❌ Error removing expired cache entry ${cacheKey}:`, error.message);
      }
    }
  }
  
  if (removed > 0) {
    saveCacheMetadata();
    console.log(`✅ Cleaned up ${removed} expired cache entries`);
  } else {
    console.log('✅ No expired cache entries found');
  }
}

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
function getCacheStats() {
  const totalEntries = cacheMetadata.size;
  const memoryEntries = memoryCache.size;
  const now = Date.now();
  
  let totalSize = 0;
  let expiredEntries = 0;
  
  for (const [, metadata] of cacheMetadata.entries()) {
    totalSize += metadata.size;
    
    const age = now - metadata.createdAt.getTime();
    if (age > CACHE_CONFIG.maxAge) {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries,
    memoryEntries,
    expiredEntries,
    validEntries: totalEntries - expiredEntries,
    totalSizeBytes: totalSize,
    totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
    cacheDirectory: CACHE_CONFIG.cacheDir,
    maxAge: CACHE_CONFIG.maxAge,
    maxCacheSize: CACHE_CONFIG.maxCacheSize
  };
}

/**
 * Clear all cache (both memory and file)
 */
function clearAllCache() {
  console.log('🧹 Clearing all LinkedIn cache...');
  
  try {
    // Clear memory cache
    memoryCache.clear();
    cacheMetadata.clear();
    
    // Remove all cache files
    if (fs.existsSync(CACHE_CONFIG.cacheDir)) {
      const files = fs.readdirSync(CACHE_CONFIG.cacheDir);
      
      for (const file of files) {
        const filePath = path.join(CACHE_CONFIG.cacheDir, file);
        fs.unlinkSync(filePath);
      }
    }
    
    console.log('✅ All LinkedIn cache cleared');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }
}

/**
 * Bulk cache multiple profiles
 * @param {Array} profiles - Array of {linkedinId, profileData} objects
 */
function bulkCacheProfiles(profiles) {
  console.log(`💾 Bulk caching ${profiles.length} LinkedIn profiles...`);
  
  let cached = 0;
  let errors = 0;
  
  for (const { linkedinId, profileData } of profiles) {
    try {
      setCachedProfile(linkedinId, profileData);
      cached++;
    } catch (error) {
      console.error(`❌ Error bulk caching ${linkedinId}:`, error.message);
      errors++;
    }
  }
  
  console.log(`✅ Bulk caching complete: ${cached} cached, ${errors} errors`);
  
  return { cached, errors };
}

// Initialize cache system when module is loaded
initializeCache();

module.exports = {
  getCachedProfile,
  setCachedProfile,
  isCacheValid,
  getCacheStats,
  clearAllCache,
  cleanupExpiredCache,
  cleanupOldestEntries,
  bulkCacheProfiles,
  generateCacheKey,
  CACHE_CONFIG
}; 