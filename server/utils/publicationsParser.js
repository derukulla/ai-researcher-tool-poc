// =============================================================================
// AI-POWERED PUBLICATIONS PARSER USING SERPAPI GOOGLE SCHOLAR + LLM
// =============================================================================
// This module uses SerpAPI Google Scholar to search for authors, matches profiles
// with LLM, extracts citations/h-index, and categorizes venues with LLM.

const axios = require('axios');
const fs = require('fs');
const path = require('path');


// =============================================================================
// SERPAPI CONFIGURATION
// =============================================================================

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';
const { SERPAPI_API_KEY, REQUEST_TIMEOUT, API_DELAY_MS } = require('../config/apiKeys');

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_DIR = path.join(__dirname, '../cache');

// Cache expiry options:
// - 24 hours (1 day): Very fresh data, high API usage
// - 168 hours (1 week): Good balance for active researchers
// - 720 hours (1 month): Good for established researchers
// - 8760 hours (1 year): For very stable profiles
let CACHE_EXPIRY_HOURS = 720; // Cache expires after 30 days (1 month)

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate cache key for author search
 * @param {string} authorName - Author name to search
 * @returns {string} Cache key
 */
function generateSearchCacheKey(authorName) {
  return `search_${authorName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
}

/**
 * Generate cache key for author details
 * @param {string} authorId - Author ID
 * @returns {string} Cache key
 */
function generateAuthorCacheKey(authorId) {
  return `author_${authorId}`;
}

/**
 * Get cache file path
 * @param {string} key - Cache key
 * @returns {string} Cache file path
 */
function getCacheFilePath(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

/**
 * Check if cache is valid (not expired)
 * @param {string} cacheFile - Cache file path
 * @returns {boolean} True if cache is valid
 */
function isCacheValid(cacheFile) {
  try {
    if (!fs.existsSync(cacheFile)) {
      return false;
    }
    
    const stats = fs.statSync(cacheFile);
    const now = new Date();
    const cacheAge = (now - stats.mtime) / (1000 * 60 * 60); // Age in hours
    
    // Use override expiry if set, otherwise use default
    const expiryHours = global.OVERRIDE_CACHE_EXPIRY !== undefined ? 
      global.OVERRIDE_CACHE_EXPIRY : CACHE_EXPIRY_HOURS;
    
    // If expiry is 0, cache never expires
    if (expiryHours === 0) {
      return true;
    }
    
    return cacheAge < expiryHours;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Read data from cache
 * @param {string} key - Cache key
 * @returns {object|null} Cached data or null if not found/invalid
 */
function readFromCache(key) {
  try {
    const cacheFile = getCacheFilePath(key);
    
    if (!isCacheValid(cacheFile)) {
      return null;
    }
    
    const data = fs.readFileSync(cacheFile, 'utf8');
    const parsed = JSON.parse(data);
    
    console.log(`📋 Cache HIT for key: ${key}`);
    return parsed;
  } catch (error) {
    console.error(`Error reading from cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Write data to cache
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
function writeToCache(key, data) {
  try {
    const cacheFile = getCacheFilePath(key);
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    console.log(`💾 Cache WRITE for key: ${key}`);
  } catch (error) {
    console.error(`Error writing to cache for key ${key}:`, error);
  }
}

/**
 * Clear expired cache files
 */
function clearExpiredCache() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let cleared = 0;
    
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      if (!isCacheValid(filePath)) {
        fs.unlinkSync(filePath);
        cleared++;
      }
    });
    
    if (cleared > 0) {
      console.log(`🗑️ Cleared ${cleared} expired cache files`);
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}


/**
 * Clear all cache files manually
 */
function clearAllCache() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let cleared = 0;
    
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      fs.unlinkSync(filePath);
      cleared++;
    });
    
    console.log(`🗑️ Cleared ${cleared} cache files`);
    return cleared;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;
    let validFiles = 0;
    let expiredFiles = 0;
    
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (isCacheValid(filePath)) {
        validFiles++;
      } else {
        expiredFiles++;
      }
    });
    
    return {
      totalFiles: files.length,
      validFiles,
      expiredFiles,
      totalSizeKB: Math.round(totalSize / 1024),
      cacheDir: CACHE_DIR
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Get detailed cache analysis for debugging
 */
function getDetailedCacheAnalysis() {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const analysis = {
      searches: [],
      authors: {},
      fullyCached: [],
      partiallyCached: [],
      stats: getCacheStats()
    };
    
    files.forEach(file => {
      if (file.startsWith('search_')) {
        const name = file.replace('search_', '').replace('.json', '').replace(/_/g, ' ');
        analysis.searches.push(name);
      } else if (file.startsWith('author_')) {
        const authorId = file.replace('author_', '').replace('.json', '').replace('_detailed', '');
        
        if (!analysis.authors[authorId]) {
          analysis.authors[authorId] = { basic: false, detailed: false };
        }
        
        if (file.includes('_detailed')) {
          analysis.authors[authorId].detailed = true;
        } else {
          analysis.authors[authorId].basic = true;
        }
      }
    });
    
    // Categorize authors by cache completeness
    Object.keys(analysis.authors).forEach(authorId => {
      const author = analysis.authors[authorId];
      if (author.basic && author.detailed) {
        analysis.fullyCached.push(authorId);
      } else {
        analysis.partiallyCached.push(authorId);
      }
    });
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing cache:', error);
    return null;
  }
}

/**
 * Check if a profile name is fully cached (both search and detailed data)
 */
function isProfileFullyCached(profileName) {
  try {
    // Check search cache
    const searchKey = generateSearchCacheKey(profileName);
    const searchCache = readFromCache(searchKey);
    
    if (!searchCache || !searchCache.profiles?.authors) {
      return { cached: false, reason: 'No search cache found' };
    }
    
    // For each profile in search results, check if detailed cache exists
    const profiles = searchCache.profiles.authors;
    const cacheStatus = profiles.map(profile => {
      const detailedKey = `${generateAuthorCacheKey(profile.author_id)}_detailed`;
      const detailedCache = readFromCache(detailedKey);
      
      return {
        name: profile.name,
        authorId: profile.author_id,
        hasDetailed: !!detailedCache
      };
    });
    
    const allCached = cacheStatus.every(status => status.hasDetailed);
    
    return {
      cached: allCached,
      profiles: cacheStatus,
      reason: allCached ? 'Fully cached' : 'Missing detailed cache for some profiles'
    };
    
  } catch (error) {
    return { cached: false, reason: `Error: ${error.message}` };
  }
}

/**
 * Update cache expiry hours (useful for testing or different use cases)
 * Note: To change this permanently, edit CACHE_EXPIRY_HOURS at the top of the file
 * @param {number} hours - New expiry time in hours (0 = never expire)
 */
function setCacheExpiry(hours) {
  // Note: This is a runtime change only. Restart server to reset.
  global.OVERRIDE_CACHE_EXPIRY = hours;
  console.log(`📅 Cache expiry temporarily set to ${hours} hours (${hours/24} days)`);
  if (hours === 0) {
    console.log('⚠️ Warning: Cache will never expire automatically');
  }
}

/**
 * Get current cache expiry setting
 */
function getCacheExpiry() {
  const effectiveExpiry = global.OVERRIDE_CACHE_EXPIRY !== undefined ? 
    global.OVERRIDE_CACHE_EXPIRY : CACHE_EXPIRY_HOURS;
  
  return {
    hours: effectiveExpiry,
    days: effectiveExpiry / 24,
    description: effectiveExpiry === 0 ? 'Never expires' : `${effectiveExpiry} hours`,
    isOverridden: global.OVERRIDE_CACHE_EXPIRY !== undefined,
    defaultHours: CACHE_EXPIRY_HOURS
  };
}

// =============================================================================
// OLLAMA CONFIGURATION
// =============================================================================

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3:latest'; // Use the available model

/**
 * Generate response using Ollama with improved JSON compliance
 * @param {string} prompt - The prompt to send to Ollama
 * @returns {Promise<string>} Response from Ollama
 */
async function generateWithOllama(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'gemma3:4b',
      prompt: prompt,
      stream: false,
      system: "You are a JSON generator. You must respond with ONLY valid JSON. Do not include any explanations, markdown formatting, or other text. Return only the JSON object as specified in the prompt.",
      options: {
        temperature: 0.1,
        top_p: 0.8,
        top_k: 40,
        num_predict: 500 // Increase token limit for better responses
      }
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    return response.data.response;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama server not running. Please start Ollama: `ollama serve`');
    }
    throw error;
  }
}

// =============================================================================
// SERPAPI GOOGLE SCHOLAR FUNCTIONS
// =============================================================================

/**
 * Add delay to avoid rate limiting
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for author profiles on Google Scholar via SerpAPI (with caching)
 * @param {string} authorName - Name to search for
 * @returns {Promise<Array>} Array of author profile results
 */
async function searchAuthorProfiles(authorName) {
  try {
    console.log(`🔍 Searching Google Scholar for: ${authorName}`);
    
    // Check cache first
    const cacheKey = generateSearchCacheKey(authorName);
    const cachedData = readFromCache(cacheKey);
    
    if (cachedData) {
      const profiles = cachedData.profiles? (cachedData.profiles.authors || []) : [];
      console.log(`📊 Found ${profiles.length} potential profiles (from cache)`);
      return cachedData;
    }
    
    // If not in cache, make API call
    console.log(`🌐 Making API call for: ${authorName}`);
    const response = await axios.get(SERPAPI_BASE_URL, {
      params: {
        engine: 'google_scholar',
        q: authorName,
        hl: 'en',
        api_key: SERPAPI_API_KEY
      },
      timeout: 15000
    });
    
    const profiles = response.data.profiles? (response.data.profiles.authors || []) : [];
    console.log(`📊 Found ${profiles.length} potential profiles`);
    
    // Cache the complete response data
    writeToCache(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error searching author profiles:', error.message);
    console.error('🔍 Full error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Check for rate limit errors and throw specific messages
    if (error.response?.status === 429) {
      console.error('🚨 DETECTED RATE LIMIT ERROR - Status 429');
      throw new Error('SERPAPI_RATE_LIMIT: Google Scholar search rate limit exceeded. Please wait before trying again.');
    } else if (error.response?.status === 403) {
      console.error('🚨 DETECTED QUOTA EXCEEDED ERROR - Status 403');
      throw new Error('SERPAPI_QUOTA_EXCEEDED: Google Scholar search quota exceeded. Please upgrade your plan or wait for quota reset.');
    } else if (error.response?.status >= 500) {
      console.error('🚨 DETECTED SERVER ERROR - Status >= 500');
      throw new Error('SERPAPI_SERVER_ERROR: Google Scholar search service temporarily unavailable. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('🚨 DETECTED NETWORK ERROR');
      throw new Error('SERPAPI_NETWORK_ERROR: Unable to connect to Google Scholar search service. Please check your connection.');
    }
    
    console.error('⚠️ Unhandled error type, re-throwing original error');
    throw error;
  }
}

/**
 * Get detailed author information including publications
 * @param {string} authorId - Google Scholar author ID
 * @returns {Promise<object>} Detailed author information
 */
async function getAuthorDetails(authorId) {
  try {
    console.log(`📖 Getting author details for ID: ${authorId}`);
    
    // Add delay to avoid rate limiting
    await delay(2000);
    
    const response = await axios.get(SERPAPI_BASE_URL, {
      params: {
        author_id: authorId,
        engine: 'google_scholar_author',
        num: 100,
        hl: 'en',
        api_key: SERPAPI_API_KEY
      },
      timeout: 15000
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting author details for ${authorId}:`, error.message);
    
    // Check for rate limit errors and throw specific messages
    if (error.response?.status === 429) {
      throw new Error('SERPAPI_RATE_LIMIT: Google Scholar author details rate limit exceeded. Please wait before trying again.');
    } else if (error.response?.status === 403) {
      throw new Error('SERPAPI_QUOTA_EXCEEDED: Google Scholar author details quota exceeded. Please upgrade your plan or wait for quota reset.');
    } else if (error.response?.status >= 500) {
      throw new Error('SERPAPI_SERVER_ERROR: Google Scholar author details service temporarily unavailable. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('SERPAPI_NETWORK_ERROR: Unable to connect to Google Scholar author details service. Please check your connection.');
    }
    
    throw error;
  }
}

/**
 * Get enhanced author profile with citations and h-index
 * @param {string} authorId - Google Scholar author ID
 * @returns {Promise<object>} Enhanced author profile
 */
async function getEnhancedAuthorProfile(authorId) {
  try {
    console.log(`🔬 Getting enhanced profile for ID: ${authorId}`);
    
    // Add delay to avoid rate limiting
    await delay(2000);
    
    const response = await axios.get(SERPAPI_BASE_URL, {
      params: {
        author_id: authorId,
        engine: 'google_scholar_author',
        hl: 'en',
        api_key: SERPAPI_API_KEY
      },
      timeout: 15000
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ Error getting enhanced profile for ${authorId}:`, error.message);
    
    // Check for rate limit errors and throw specific messages
    if (error.response?.status === 429) {
      throw new Error('SERPAPI_RATE_LIMIT: Google Scholar enhanced profile rate limit exceeded. Please wait before trying again.');
    } else if (error.response?.status === 403) {
      throw new Error('SERPAPI_QUOTA_EXCEEDED: Google Scholar enhanced profile quota exceeded. Please upgrade your plan or wait for quota reset.');
    } else if (error.response?.status >= 500) {
      throw new Error('SERPAPI_SERVER_ERROR: Google Scholar enhanced profile service temporarily unavailable. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('SERPAPI_NETWORK_ERROR: Unable to connect to Google Scholar enhanced profile service. Please check your connection.');
    }
    
    throw error;
  }
}

/**
 * Enhance a single profile with detailed information
 * @param {object} profile - Basic profile from search results
 * @returns {Promise<object>} Enhanced profile with detailed information
 */
async function enhanceSingleProfile(profile) {
  try {
    console.log(`🔍 Enhancing profile: ${profile.name} (ID: ${profile.author_id})`);
    
    // Check cache first (use a different cache key for detailed data)
    const cacheKey = `${generateAuthorCacheKey(profile.author_id)}_detailed`;
    const cachedData = readFromCache(cacheKey);
    
    let detailedData;
    if (cachedData) {
      detailedData = cachedData;
    } else {
      // Add delay to avoid rate limiting
      await delay(1000);
      
      console.log(`🌐 Making detailed API call for: ${profile.name}`);
      const response = await axios.get(SERPAPI_BASE_URL, {
        params: {
          author_id: profile.author_id,
          engine: 'google_scholar_author',
          num: 100,
          hl: 'en',
          api_key: SERPAPI_API_KEY
        },
        timeout: 15000
      });
      
      detailedData = response.data;
      
      // Cache the detailed data
      writeToCache(cacheKey, detailedData);
    }
    const author = detailedData.author || {};
    
    // Extract key information
    const citedBy = detailedData.cited_by || {};
    const citationsTable = citedBy.table || [];
    const citationsGraph = citedBy.graph || [];
    const articles = detailedData.articles || [];
    
    let totalCitations = 0;
    let hIndex = 0;
    let initialYear = null;
    
    // Extract citations and h-index from table
    if (citationsTable.length > 0) {
      const citationsData = citationsTable[0]?.citations;
      const hIndexData = citationsTable[1]?.h_index;
      
      totalCitations = citationsData?.all || 0;
      hIndex = hIndexData?.all || 0;
    }
    
    // Extract initial year from graph
    if (citationsGraph.length > 0) {
      initialYear = citationsGraph[0]?.year || null;
    }
    
    // Collect all venues from articles
    const venues = articles
      .map(article => article.publication)
      .filter(venue => venue && venue.trim() !== '');
    
    // Enhanced profile with all available information
    const enhancedProfile = {
      // Basic info
      name: author.name || profile.name,
      author_id: profile.author_id,
      affiliation: author.affiliation || profile.affiliation,
      email: author.email || profile.email,
      interests: author.interests || profile.interests || [],
      articles: articles,
      // Detailed metrics
      totalCitations: totalCitations,
      hIndex: hIndex,
      numberOfPublications: articles.length,
      initialYear: initialYear,
      
      // Recent publications (first 5)
      recentPublications: articles.slice(0, 5).map(article => ({
        title: article.title,
        publication: article.publication,
        year: article.year,
        citedBy: article.cited_by?.value || 0
      })),
      
      // All venues from publications
      venues: venues,
      
      // Research areas from publications (for backward compatibility)
      researchAreas: venues.slice(0, 10), // Top 10 venues
      
      // Original profile data
      originalProfile: profile
    };
    
    console.log(`✅ Enhanced profile for ${profile.name}: ${totalCitations} citations, ${hIndex} h-index, ${articles.length} papers`);
    
    return enhancedProfile;
    
  } catch (error) {
    console.error(`❌ Error enhancing profile ${profile.name}:`, error.message);
    
    // Check if it's a critical error that should be re-thrown
    const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                           error.message.includes('SERPAPI_SERVER_ERROR') ||
                           error.message.includes('SERPAPI_NETWORK_ERROR');
    
    if (isCriticalError) {
      console.error('🚨 CRITICAL ERROR in profile enhancement - Re-throwing to evaluation route');
      throw error; // Re-throw critical errors to be handled by evaluation route
    }
    
    console.error('📝 Non-critical profile enhancement error - returning fallback values');
    // Return basic profile if enhancement fails
    return {
      name: profile.name,
      author_id: profile.author_id,
      affiliation: profile.affiliation,
      email: profile.email,
      interests: profile.interests || [],
      totalCitations: 0,
      hIndex: 0,
      numberOfPublications: 0,
      initialYear: null,
      recentPublications: [],
      venues: [],
      researchAreas: [],
      originalProfile: profile,
      enhancementError: error.message
    };
  }
}

/**
 * Get basic author information for each profile (just author field)
 * @param {Array} profiles - Array of basic profiles
 * @returns {Promise<Array>} Array of profiles with author field
 */
async function getBasicAuthorInfo(profiles) {
  console.log(`🔄 Getting basic author info for ${profiles.length} profiles...`);
  
  const profilesWithAuthor = [];
  
  for (const profile of profiles) {
    try {
      console.log(`📖 Getting author info for: ${profile.name} (ID: ${profile.author_id})`);
      
      // Check cache first
      const cacheKey = generateAuthorCacheKey(profile.author_id);
      const cachedAuthor = readFromCache(cacheKey);
      
      let author;
      if (cachedAuthor) {
        author = cachedAuthor;
      } else {
        // Add delay to avoid rate limiting
        await delay(1000);
        
        console.log(`🌐 Making API call for author: ${profile.name}`);
        const response = await axios.get(SERPAPI_BASE_URL, {
          params: {
            author_id: profile.author_id,
            engine: 'google_scholar_author',
            hl: 'en',
            api_key: SERPAPI_API_KEY
          },
          timeout: 15000
        });
        
        author = response.data.author || {};
        
        // Cache the author info
        writeToCache(cacheKey, author);
      }
      
      // Add author field to the profile
      const profileWithAuthor = {
        ...profile,
        author: author
      };
      
      profilesWithAuthor.push(profileWithAuthor);
      console.log(`✅ Got author info for ${profile.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to get author info for ${profile.name}:`, error.message);
      
      // Check for critical errors (rate limit) that should stop the entire process
      if (error.response?.status === 429) {
        throw new Error('SERPAPI_RATE_LIMIT: Google Scholar author info rate limit exceeded. Please wait before trying again.');
      } else if (error.response?.status === 403) {
        throw new Error('SERPAPI_QUOTA_EXCEEDED: Google Scholar author info quota exceeded. Please upgrade your plan or wait for quota reset.');
      }
      
      // For other errors, add basic profile and continue
      profilesWithAuthor.push({
        ...profile,
        author: {},
        authorInfoError: error.message
      });
    }
  }
  
  console.log(`✅ Got author info for ${profilesWithAuthor.length} profiles successfully`);
  return profilesWithAuthor;
}

/**
 * Create prompt for LLM to match the best author profile (using profiles with author field)
 * @param {object} inputProfile - Original profile data
 * @param {Array} profilesWithAuthor - Array of profiles with author field
 * @returns {string} Formatted prompt
 */
function createEnhancedProfileMatchingPrompt(inputProfile, profilesWithAuthor) {
  const profileText = typeof inputProfile === 'object' ? 
    JSON.stringify(inputProfile, null, 2) : inputProfile.toString();
  
  return `You are an expert at matching researcher profiles. You must respond with ONLY valid JSON.

INPUT PROFILE TO MATCH:
${profileText}

GOOGLE SCHOLAR PROFILES WITH AUTHOR INFO:
${JSON.stringify(profilesWithAuthor, null, 2)}

TASK: Find the best matching profile based on:
1. Name similarity (exact match preferred, but consider variations)
2. Affiliation/institution match
3. Research interests/field alignment
4. Publication venues and research areas
5. Career stage (based on citation count, h-index, number of publications)
6. Any other identifying information

MATCHING CRITERIA:
- Prioritize exact name matches over partial matches
- Consider institutional affiliations as strong indicators
- Look for research area overlap in publication venues
- Consider career stage consistency (junior vs senior researcher)
- Use citation metrics as additional validation

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any explanations, markdown, or other text.

RESPONSE FORMAT (choose one):
For a good match:
{
  "authorId": "best_matching_author_id_from_the_list",
  "confidence": "high",
  "reason": "detailed explanation of why this profile was chosen"
}

For no good match:
{
  "authorId": null,
  "confidence": "low",
  "reason": "detailed explanation of why no suitable match was found"
}

IMPORTANT:
- Use only "high", "medium", or "low" for confidence
- Use true/false for boolean values (not True/False)
- Ensure all strings are properly quoted
- Do not include trailing commas
- Return ONLY the JSON object, no other text`;
}

/**
 * Match the best author profile using profiles with author info and LLM
 * @param {object} inputProfile - Original profile data
 * @param {Array} profilesWithAuthor - Array of profiles with author field
 * @returns {Promise<object>} Matching result
 */
async function matchBestEnhancedProfile(inputProfile, profilesWithAuthor) {
  try {
    if (!profilesWithAuthor || profilesWithAuthor.length === 0) {
      return { authorId: null, confidence: 'low', reason: 'no profiles with author info available' };
    }
    
    console.log(`🤖 Using LLM to match best profile from ${profilesWithAuthor.length} candidates with author info`);
    
    const prompt = createEnhancedProfileMatchingPrompt(inputProfile, profilesWithAuthor);
    const response = await generateWithOllama(prompt);
    
    console.log('🔍 DEBUG: Raw LLM response:', response.substring(0, 300) + '...');
    
    // Parse LLM response with improved error handling
    let matchResult;
    try {
      // Method 1: Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Clean up common JSON issues
        jsonString = jsonString.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        jsonString = jsonString.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
        
        // Try to parse the cleaned JSON
        matchResult = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, trying fallback extraction...');
      console.log('🔍 Parse error:', parseError.message);
      
      // Method 2: Try to extract information from text response
      const responseText = response.toLowerCase();
      
      // Look for author ID patterns
      let authorId = null;
      const authorIdMatch = response.match(/(?:author[_\s]*id|id)["\s]*:["\s]*([^",\s}]+)/i);
      if (authorIdMatch) {
        authorId = authorIdMatch[1];
      }
      
      // Look for confidence level
      let confidence = 'low';
      if (responseText.includes('high confidence') || responseText.includes('confidence": "high')) {
        confidence = 'high';
      } else if (responseText.includes('medium confidence') || responseText.includes('confidence": "medium')) {
        confidence = 'medium';
      }
      
      // Look for reasoning
      let reason = 'LLM response parsing failed';
      const reasonMatch = response.match(/(?:reason|explanation)["\s]*:["\s]*([^"]+)/i);
      if (reasonMatch) {
        reason = reasonMatch[1];
      } else if (responseText.includes('no match') || responseText.includes('not found')) {
        reason = 'No suitable match found based on available criteria';
      }
      
      matchResult = {
        authorId: authorId,
        confidence: confidence,
        reason: reason
      };
      
      console.log('✅ Fallback extraction result:', matchResult);
    }
    
    // Validate the result structure
    if (!matchResult || typeof matchResult !== 'object') {
      console.log('⚠️ Invalid result structure, using default');
      return { authorId: null, confidence: 'low', reason: 'Invalid LLM response structure' };
    }
    
    // Ensure required fields exist
    if (!matchResult.hasOwnProperty('authorId')) {
      matchResult.authorId = null;
    }
    if (!matchResult.hasOwnProperty('confidence')) {
      matchResult.confidence = 'low';
    }
    if (!matchResult.hasOwnProperty('reason')) {
      matchResult.reason = 'No reason provided';
    }
    
    console.log(`✅ Profile matching result:`, matchResult);
    return matchResult;
    
  } catch (error) {
    console.error('❌ Error in profile matching:', error);
    return { authorId: null, confidence: 'low', reason: `Error: ${error.message}` };
  }
}

// =============================================================================
// VENUE CATEGORIZATION WITH LLM
// =============================================================================

/**
 * Create prompt for LLM to categorize publication venues
 * @param {Array} venues - Array of venue names
 * @returns {string} Formatted prompt
 */
function createVenueCategorizationPrompt(venues) {
  const venuesText = venues.map((venue, index) => `${index + 1}. ${venue}`).join('\n');
  
  return `You are an expert in AI/ML research venues. You must respond with ONLY valid JSON.

VENUES TO CATEGORIZE:
${venuesText}

CATEGORIES:
1. "top_ai_conferences" - Top-tier AI conferences (NeurIPS, ICML, ICLR, AAAI, IJCAI, etc.)
2. "other_ai_conferences" - Other AI/ML conferences (ECML, AISTATS, UAI, etc.)
3. "reputable_journals" - Reputable AI/ML journals (JMLR, TPAMI, AIJ, etc.)
4. "other_peer_reviewed" - Other peer-reviewed conferences/journals

TASK: Analyze the list and determine if it contains:
- At least one top AI conference
- At least one other AI conference  
- At least one reputable AI journal
- At least one other peer-reviewed venue

CRITICAL: You must respond with ONLY valid JSON. Do not include any explanations, markdown, or other text.

RESPONSE FORMAT:
{
  "hasTopAIConference": true,
  "hasOtherAIConference": false,
  "hasReputableJournal": true,
  "hasOtherPeerReviewed": false,
  "summary": "brief summary of the venue quality"
}

IMPORTANT:
- Use only true/false for boolean values (not True/False)
- Ensure all strings are properly quoted
- Do not include trailing commas
- Return ONLY the JSON object, no other text`;
}

/**
 * Categorize venues using LLM
 * @param {Array} venues - List of venue names
 * @returns {Promise<object>} Categorization result
 */
async function categorizeVenuesWithLLM(venues) {
  try {
    if (!venues || venues.length === 0) {
      return {
        hasTopAIConference: false,
        hasOtherAIConference: false,
        hasReputableJournal: false,
        hasOtherPeerReviewed: false,
        summary: 'No venues to categorize'
      };
    }
    
    console.log(`🏷️ Categorizing ${venues.length} venues with LLM`);
    
    const prompt = createVenueCategorizationPrompt(venues);
    const response = await generateWithOllama(prompt);
    
    console.log('🔍 DEBUG: Raw venue categorization response:', response.substring(0, 300) + '...');
    
    // Parse LLM response with improved error handling
    let categorizationResult;
    try {
      // Method 1: Try to find JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Clean up common JSON issues
        jsonString = jsonString.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        jsonString = jsonString.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
        
        // Try to parse the cleaned JSON
        categorizationResult = JSON.parse(jsonString);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, trying fallback extraction...');
      console.log('🔍 Parse error:', parseError.message);
      
      // Method 2: Try to extract boolean values from text response
      const responseText = response.toLowerCase();
      
      // Look for boolean indicators in the text
      const hasTopAI = responseText.includes('hastopaiconference": true') || 
                      responseText.includes('top ai conference') ||
                      responseText.includes('neurips') || responseText.includes('icml') || 
                      responseText.includes('iclr') || responseText.includes('aaai');
      
      const hasOtherAI = responseText.includes('hasotherai') || 
                        responseText.includes('other ai conference') ||
                        responseText.includes('ai conference');
      
      const hasReputable = responseText.includes('hasreputablejournal') || 
                          responseText.includes('reputable journal') ||
                          responseText.includes('journal');
      
      const hasOtherPeer = responseText.includes('hasotherpeerreviewed') || 
                          responseText.includes('peer reviewed') ||
                          responseText.includes('conference') || responseText.includes('workshop');
      
      categorizationResult = {
        hasTopAIConference: hasTopAI,
        hasOtherAIConference: hasOtherAI,
        hasReputableJournal: hasReputable,
        hasOtherPeerReviewed: hasOtherPeer || venues.length > 0,
        summary: 'Categorized using fallback text extraction'
      };
      
      console.log('✅ Fallback categorization result:', categorizationResult);
    }
    
    // Validate the result structure
    if (!categorizationResult || typeof categorizationResult !== 'object') {
      console.log('⚠️ Invalid categorization result structure, using default');
      return {
        hasTopAIConference: false,
        hasOtherAIConference: false,
        hasReputableJournal: false,
        hasOtherPeerReviewed: venues.length > 0,
        summary: 'Invalid LLM response structure'
      };
    }
    
    // Ensure required fields exist with proper defaults
    const result = {
      hasTopAIConference: categorizationResult.hasTopAIConference || false,
      hasOtherAIConference: categorizationResult.hasOtherAIConference || false,
      hasReputableJournal: categorizationResult.hasReputableJournal || false,
      hasOtherPeerReviewed: categorizationResult.hasOtherPeerReviewed || venues.length > 0,
      summary: categorizationResult.summary || 'Venue categorization completed'
    };
    
    console.log(`✅ Venue categorization result:`, result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in venue categorization:', error);
    return {
      hasTopAIConference: false,
      hasOtherAIConference: false,
      hasReputableJournal: false,
      hasOtherPeerReviewed: venues.length > 0,
      summary: `Error: ${error.message}`
    };
  }
}

// =============================================================================
// MAIN EXTRACTION FUNCTIONS
// =============================================================================

/**
 * Extract author name from profile data
 * @param {object|string} profileData - Profile data
 * @returns {string} Extracted author name
 */
function extractAuthorName(profileData) {
  if (typeof profileData === 'string') {
    // Extract name from text profile
    const nameMatch = profileData.match(/(?:Dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return nameMatch ? nameMatch[1] : null;
  }
  
  if (profileData.name) {
    return profileData.name;
  }
  
  return 'Unknown Author';
}

/**
 * Calculate experience bracket based on first publication year
 * @param {number} initialYear - Year of first publication
 * @returns {string} Experience bracket
 */
function calculateExperienceBracket(initialYear) {
  if (!initialYear) return '0-3';
  
  const currentYear = new Date().getFullYear();
  const experience = currentYear - initialYear;
  
  if (experience <= 3) return '0-3';
  if (experience <= 7) return '4-7';
  if (experience <= 10) return '8-10';
  return '10+';
}

/**
 * Create empty publications data structure
 * @param {string} reason - Reason for empty data
 * @returns {object} Empty publications data
 */
function createEmptyPublicationsData(reason) {
  return {
    // Core metrics
    citations: 0,
    hIndex: 0,
    experienceBracket: '0-3',
    
    // Venue categorization (for backward compatibility)
    topAIConferences: [],
    otherAIConferences: [],
    reputableJournals: [],
    otherPublications: [],
    
    // New LLM-based categorization
    venueQuality: {
      hasTopAIConference: false,
      hasOtherAIConference: false,
      hasReputableJournal: false,
      hasOtherPeerReviewed: false,
      summary: reason
    },
    
    // Metadata
    extractionMethod: 'serpapi-google-scholar',
    matchConfidence: 'low',
    extractionDate: new Date().toISOString(),
    error: reason
  };
}

/**
 * Main function to extract publications data using SerpAPI Google Scholar
 * @param {object} profileData - Input profile data
 * @returns {Promise<object>} Publications and citations data
 */
async function extractPublicationsWithSerpAPI(profileData) {
  try {
    // Step 1: Extract author name
    const authorName = extractAuthorName(profileData);
    if (!authorName || authorName === 'Unknown Author') {
      return createEmptyPublicationsData('No author name found');
    }
    
    console.log(`📚 Starting publications extraction for: ${authorName}`);
    
    // Step 2: Search for author profiles
    const searchResponse = await searchAuthorProfiles(authorName);
    const profiles = searchResponse.profiles? (searchResponse.profiles.authors || []) : [];
    if (!profiles || profiles.length === 0) {
      return createEmptyPublicationsData('No profiles found on Google Scholar');
    }
    
    // Step 3: Get basic author info for each profile
    const profilesWithAuthor = await getBasicAuthorInfo(profiles);
    
    // Step 4: Match best profile using LLM
    const matchResult = await matchBestEnhancedProfile(profileData, profilesWithAuthor);
    if (!matchResult.authorId) {
      return createEmptyPublicationsData(matchResult.reason || 'No suitable match found');
    }
    
    // Step 5: Enhance the matched profile with full details
    const matchedBasicProfile = profilesWithAuthor.find(profile => profile.author_id === matchResult.authorId);
    if (!matchedBasicProfile) {
      return createEmptyPublicationsData('Matched profile not found in profiles with author info');
    }
    
    console.log(`🔍 Enhancing matched profile: ${matchedBasicProfile.name}`);
    const enhancedMatchedProfile = await enhanceSingleProfile(matchedBasicProfile);
    
    // Step 6: Extract data from the enhanced matched profile
    const totalCitations = enhancedMatchedProfile.totalCitations;
    const hIndex = enhancedMatchedProfile.hIndex;
    const numberOfPublications = enhancedMatchedProfile.numberOfPublications;
    const initialYear = enhancedMatchedProfile.initialYear;
    
    // Calculate experience bracket from the initial year
    const experienceBracket = calculateExperienceBracket(initialYear);
    
    // Step 7: Extract venues from the enhanced matched profile
    const venues = enhancedMatchedProfile.venues;
    
    console.log(`📄 Found ${numberOfPublications} publications with ${venues.length} venues`);
    
    // Step 8: Categorize venues using LLM
    const venueQuality = await categorizeVenuesWithLLM(venues);
    
    // Step 9: Create backward-compatible venue lists (for existing scoring system)
    const topAIConferences = venueQuality.hasTopAIConference ;
    const otherAIConferences = venueQuality.hasOtherAIConference ;
    const reputableJournals = venueQuality.hasReputableJournal ;
    const otherPublications = venueQuality.hasOtherPeerReviewed ;
    
    // Step 10: Format final result
    const publicationsData = {
      articles: enhancedMatchedProfile.articles,
      // Core metrics
      numberOfPublications: numberOfPublications,
      citations: totalCitations,
      hIndex: hIndex,
      experienceBracket: experienceBracket,
      
      // Venue categorization (for backward compatibility)
      topAIConferences: topAIConferences,
      otherAIConferences: otherAIConferences,
      reputableJournals: reputableJournals,
      otherPublications: otherPublications,
      
      // New LLM-based categorization
      venueQuality: venueQuality,
      
      // Detailed data
      detailedPublications: {
        recentPublications: enhancedMatchedProfile.recentPublications,
        researchAreas: enhancedMatchedProfile.researchAreas,
        enhancedProfile: enhancedMatchedProfile
      },
      
      // Metadata
      extractionMethod: 'serpapi-google-scholar-enhanced',
      matchConfidence: matchResult.confidence,
      matchReason: matchResult.reason,
      googleScholarId: matchResult.authorId,
      extractionDate: new Date().toISOString(),
      initialYear: initialYear,
      profilesCompared: profilesWithAuthor.length
    };
    
    console.log('✅ Publications extraction completed successfully');
    console.log('📊 Publications summary:', {
      totalPapers: publicationsData.numberOfPublications,
      totalCitations: publicationsData.citations,
      hIndex: publicationsData.hIndex,
      experienceBracket: publicationsData.experienceBracket,
      venueQuality: publicationsData.venueQuality.summary,
      confidence: publicationsData.matchConfidence,
      profilesCompared: publicationsData.profilesCompared
    });
    
    return publicationsData;
    
  } catch (error) {
    console.error('❌ Error in SerpAPI publications extraction:', error);
    const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
    error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
    error.message.includes('SERPAPI_SERVER_ERROR') ||
    error.message.includes('SERPAPI_NETWORK_ERROR');

    if (isCriticalError) {
      console.error('🚨 CRITICAL PUBLICATIONS ERROR - Re-throwing to evaluation route');
      throw error; // Re-throw critical errors to be handled by evaluation route
    }

    console.error('📝 Non-critical publications error - returning fallback values');
    return createEmptyPublicationsData(`Critical error: ${error.message}`);
  }
}

/**
 * Main function to extract publications data from profile
 * @param {object} profileData - Input profile data
 * @returns {Promise<object>} Publications and citations data
 */
async function parsePublications(profileData) {
  console.log('🚀 Starting SerpAPI Google Scholar publications extraction...');
  
  try {
    const result = await extractPublicationsWithSerpAPI(profileData);
    return result;
  } catch (error) {
    console.error('❌ Critical error in parsePublications:', error);
    
    // Check if it's a critical error that should be re-thrown to evaluation route
    const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                           error.message.includes('SERPAPI_SERVER_ERROR') ||
                           error.message.includes('SERPAPI_NETWORK_ERROR');
    
    if (isCriticalError) {
      console.error('🚨 CRITICAL PUBLICATIONS ERROR - Re-throwing to evaluation route');
      throw error; // Re-throw critical errors to be handled by evaluation route
    }
    
    console.error('📝 Non-critical publications error - returning fallback values');
    return createEmptyPublicationsData(`Critical error: ${error.message}`);
  }
}

// =============================================================================
// TESTING FUNCTIONS
// =============================================================================

/**
 * Test the publications extraction with sample profiles
 */
async function testPublicationsExtraction() {
  console.log('🧪 Testing SerpAPI Google Scholar publications extraction...');
  
  const testProfiles = [
    {
      name: 'Geoffrey Hinton',
      affiliation: 'University of Toronto'
    },
    {
      name: 'Yoshua Bengio',
      affiliation: 'University of Montreal'
    }
  ];
  
  for (let i = 0; i < testProfiles.length; i++) {
    console.log(`\n--- Testing Profile ${i + 1}: ${testProfiles[i].name} ---`);
    
    try {
      const result = await parsePublications(testProfiles[i]);
      
      console.log('✅ Test Results:');
      console.log('  Name:', testProfiles[i].name);
      console.log('  Papers:', result.numberOfPublications);
      console.log('  Citations:', result.citations);
      console.log('  H-Index:', result.hIndex);
      console.log('  Experience:', result.experienceBracket);
      console.log('  Venue Quality:', result.venueQuality.summary);
      console.log('  Confidence:', result.matchConfidence);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
    
    // Add delay between tests
    await delay(3000);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  parsePublications,
  extractPublicationsWithSerpAPI,
  searchAuthorProfiles,
  getAuthorDetails,
  getEnhancedAuthorProfile,
  enhanceSingleProfile,
  getBasicAuthorInfo,
  matchBestEnhancedProfile,
  createEnhancedProfileMatchingPrompt,
  categorizeVenuesWithLLM,
  extractAuthorName,
  calculateExperienceBracket,
  createEmptyPublicationsData,
  testPublicationsExtraction,
  
  // Cache management functions
  clearAllCache,
  clearExpiredCache,
  getCacheStats,
  readFromCache,
  writeToCache,

  // New cache analysis functions
  getDetailedCacheAnalysis,
  isProfileFullyCached,
  setCacheExpiry,
  getCacheExpiry
}; 