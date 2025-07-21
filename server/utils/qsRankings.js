const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Cache for QS rankings data
let qsRankingsCache = null;
let lastLoadTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Cache for top 300 universities list
let top300UniversitiesCache = null;

// Path to QS rankings Excel file
const QS_FILE_PATH = path.join(__dirname, '../data/2026 QS World University Rankings 1.0 (For qs.com) 1.xlsx');

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3:latest';

/**
 * Generate content using Ollama
 * @param {string} prompt - The prompt to send to Ollama
 * @returns {Promise<string>} Generated response
 */
async function generateWithOllama(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      system: "You are a university matching expert. You must return ONLY valid JSON. Do not include explanations or other text.",
      options: {
        temperature: 0.1,
        top_p: 0.8,
        top_k: 40,
        num_predict: 100
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

/**
 * Load QS rankings from Excel file
 */
function loadQSRankings() {
  try {
    // Check if file exists
    if (!fs.existsSync(QS_FILE_PATH)) {
      console.log('QS rankings file not found at:', QS_FILE_PATH);
      return null;
    }

    // Check cache first
    const now = Date.now();
    if (qsRankingsCache && lastLoadTime && (now - lastLoadTime) < CACHE_DURATION) {
      return qsRankingsCache;
    }

    console.log('Loading QS rankings from Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile(QS_FILE_PATH);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!rawData || rawData.length === 0) {
      console.log('No data found in QS rankings file');
      return null;
    }

    // Process and normalize the data
    const processedRankings = processQSData(rawData);
    
    // Cache the results
    qsRankingsCache = processedRankings;
    lastLoadTime = now;
    
    console.log(`Loaded ${processedRankings.length} universities from QS rankings`);
    
    return processedRankings;
    
  } catch (error) {
    console.error('Error loading QS rankings:', error);
    return null;
  }
}

/**
 * Process raw QS data and normalize university names
 */
function processQSData(rawData) {
  const processedData = [];
  
  if (!rawData || rawData.length < 3) {
    console.log('Not enough data rows in QS file');
    return processedData;
  }
  
  // Row 2 (index 1) contains the column headers
  const headerRow = rawData[1];
  
  // console.log('Row 2 headers:', headerRow);
  
  // Based on the structure we found:
  // __EMPTY = "Rank"
  // __EMPTY_1 = "Previous Rank" 
  // __EMPTY_2 = "Name" (institution name)
  
  const rankColumn = '__EMPTY';
  const nameColumn = '__EMPTY_2';
  
  console.log(`Using columns: Institution="${nameColumn}", Rank="${rankColumn}"`);
  
  // Process data starting from row 3 (index 2)
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    const universityName = row[nameColumn];
    const rank = row[rankColumn];
    
    if (universityName && rank && 
        String(universityName).trim() !== '' && 
        String(rank).trim() !== '') {
      
      // Parse rank (handle ranges like "51-100" by taking the first number)
      let numericRank = null;
      if (typeof rank === 'number') {
        numericRank = rank;
      } else if (typeof rank === 'string') {
        const rankMatch = String(rank).match(/(\d+)/);
        if (rankMatch) {
          numericRank = parseInt(rankMatch[1]);
        }
      }
      
      if (numericRank && String(universityName).trim()) {
        processedData.push({
          name: String(universityName).trim(),
          normalizedName: normalizeUniversityName(String(universityName).trim()),
          rank: numericRank,
          originalRank: rank
        });
      }
    }
  }
  
  return processedData;
}

/**
 * Normalize university name for better matching
 */
function normalizeUniversityName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    // Common variations
    .replace(/\buniversity of\b/g, 'university of')
    .replace(/\bmassachusetts institute of technology\b/g, 'mit')
    .replace(/\bstanford university\b/g, 'stanford')
    .replace(/\bharvard university\b/g, 'harvard')
    .replace(/\buc berkeley\b/g, 'berkeley')
    .replace(/\buniversity of california berkeley\b/g, 'berkeley')
    .replace(/\bcarnegie mellon university\b/g, 'carnegie mellon')
    .replace(/\bindian institute of technology\b/g, 'iit')
    .replace(/\bindian institute of science\b/g, 'iisc')
    .replace(/\biisc\b/g, 'indian institute of science');
}

/**
 * Look up university rank by name
 */
function getUniversityRank(universityName) {
  const rankings = loadQSRankings();
  
  if (!rankings || !universityName) {
    return null;
  }
  
  const normalizedInput = normalizeUniversityName(universityName);
  
  // Try exact match first
  let match = rankings.find(uni => uni.normalizedName === normalizedInput);
  
  // Try word-by-word matching for better results
  if (!match) {
    const inputWords = normalizedInput.split(' ').filter(word => word.length > 2);
    match = rankings.find(uni => {
      const uniWords = uni.normalizedName.split(' ');
      return inputWords.some(inputWord => 
        uniWords.some(uniWord => 
          uniWord.includes(inputWord) || inputWord.includes(uniWord)
        )
      );
    });
  }
  
  return match ? { name: match.name, rank: match.rank, originalRank: match.originalRank } : null;
}

/**
 * Get top 300 universities list from QS rankings
 */
function getTop300Universities() {
  // Check cache first
  if (top300UniversitiesCache) {
    return top300UniversitiesCache;
  }

  const allRankings = loadQSRankings();
  
  if (!allRankings) {
    console.log('No QS rankings data available');
    return [];
  }

  // Filter universities with rank <= 300
  const top300 = allRankings
    .filter(uni => uni.rank <= 300)
    .sort((a, b) => a.rank - b.rank)
    .map(uni => ({
      name: uni.name,
      rank: uni.rank
    }));

  // Cache the result
  top300UniversitiesCache = top300;
  
  console.log(`📚 Extracted ${top300.length} universities from top 300 QS rankings`);
  
  return top300;
}

/**
 * Use LLM to check if a university exists in the top 300 list
 * @param {string} universityName - University name to check
 * @returns {Promise<object>} Result with match information
 */
async function checkUniversityWithLLM(universityName) {
  if (!universityName || universityName.trim() === '') {
    return {
      found: false,
      matchedName: null,
      rank: null,
      confidence: 'low',
      reason: 'Empty university name provided'
    };
  }

  try {
    const top300List = getTop300Universities();
    
    if (top300List.length === 0) {
      return {
        found: false,
        matchedName: null,
        rank: null,
        confidence: 'low',
        reason: 'No QS rankings data available'
      };
    }

    // Create the university names list for the prompt
    const universityNames = top300List.map(uni => uni.name);

    const prompt = `You are a university matching expert. I will provide you with a university name and a list of top 300 QS-ranked universities. Your task is to determine if the given university exists in the list.

UNIVERSITY TO CHECK: "${universityName}"

TOP 300 QS UNIVERSITIES LIST:
${universityNames.join('\n')}

INSTRUCTIONS:
1. Check if the given university name matches any university in the list
2. Consider variations in naming (e.g., "MIT" = "Massachusetts Institute of Technology")
3. Consider partial matches and common abbreviations
4. Be case-insensitive but strict about the institution identity
5. If found, return the exact name from the list and indicate confidence

RESPONSE FORMAT (JSON only):
{
  "found": true/false,
  "matchedName": "Exact name from list" or null,
  "confidence": "high/medium/low",
  "reason": "Brief explanation"
}

Return ONLY the JSON object, no other text.`;

    console.log(`🦙 Using LLM to check university: "${universityName}"`);
    const response = await generateWithOllama(prompt);
    
    // Parse the LLM response
    let result;
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in LLM response');
      }
    } catch (parseError) {
      console.log('⚠️ LLM JSON parsing failed, using fallback');
      return {
        found: false,
        matchedName: null,
        rank: null,
        confidence: 'low',
        reason: 'LLM response parsing failed'
      };
    }

    console.log(`🎯 LLM university check result:`, result);
    return result;

  } catch (error) {
    console.error('❌ Error in LLM university check:', error);
    return {
      found: false,
      matchedName: null,
      rank: null,
      confidence: 'low',
      reason: `LLM check failed: ${error.message}`
    };
  }
}

/**
 * Classify institute tier based on QS rank
 */
function classifyInstituteTier(universityName) {
  const rankInfo = getUniversityRank(universityName);
  
  if (!rankInfo) {
    return {
      tier: 'Other Institute (QS >300)',
      rank: null,
      found: false
    };
  }
  
  const tier = rankInfo.rank <= 300 ? 'Top Institute (QS <300)' : 'Other Institute (QS >300)';
  
  return {
    tier,
    rank: rankInfo.rank,
    originalRank: rankInfo.originalRank,
    found: true,
    matchedName: rankInfo.name
  };
}

/**
 * Classify institute tier based on QS rank using LLM
 */
async function classifyInstituteTierWithLLM(universityName) {
  const llmResult = await checkUniversityWithLLM(universityName);
  
  if (!llmResult.found) {
    return {
      tier: 'Other Institute (QS >300)',
      rank: null,
      found: false,
      confidence: llmResult.confidence,
      reason: llmResult.reason,
      method: 'llm'
    };
  }
  
  // If LLM found the university in the top 300 list, it's a top institute by definition
  // Even if exact rank lookup fails due to name formatting differences
  const tier = 'Top Institute (QS <300)';
  
  return {
    tier: tier,
    rank: llmResult.rank || 'Found in Top 300', // Use actual rank if available, otherwise indicate it's in top 300
    found: true,
    matchedName: llmResult.matchedName,
    confidence: llmResult.confidence,
    reason: llmResult.reason,
    method: 'llm'
  };
}

/**
 * Get statistics about loaded rankings
 */
function getRankingsStats() {
  const rankings = loadQSRankings();
  
  if (!rankings) {
    return { error: 'No rankings data available' };
  }
  
  const topTier = rankings.filter(uni => uni.rank <= 300).length;
  const total = rankings.length;
  
  return {
    total,
    topTier,
    otherTier: total - topTier,
    topUniversities: rankings.slice(0, 10).map(uni => ({
      name: uni.name,
      rank: uni.rank
    }))
  };
}

module.exports = {
  loadQSRankings,
  getUniversityRank,
  classifyInstituteTier,
  getRankingsStats,
  getTop300Universities,
  checkUniversityWithLLM,
  classifyInstituteTierWithLLM
}; 