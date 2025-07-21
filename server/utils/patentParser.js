/**
 * Patent Parser - Extracts patent information using SerpAPI and Ollama
 * Searches for granted patents first, then filed patents if no granted patents found
 */

const axios = require('axios');
const { loadFromCache, saveToCache } = require('./patentCache');

const { SERPAPI_API_KEY: SERPAPI_KEY } = require('../config/apiKeys');

/**
 * Extract name from profile for patent search
 */
function extractNameFromProfile(profileData) {
  if (typeof profileData === 'string') {
    // Extract name from text profile
    const nameMatch = profileData.match(/(?:Dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return nameMatch ? nameMatch[1] : null;
  }
  
  if (profileData.name) {
    return profileData.name;
  }
  
  return null;
}

/**
 * Analyze a single patent with Ollama
 */
async function analyzeSinglePatentWithOllama(profileData, patent, searchType, retryCount = 0) {
  const isGrantedSearch = searchType === 'GRANT';
  
  // Remove figures from patent data to reduce prompt size
  const cleanPatent = { ...patent };
  if (cleanPatent.figures) {
    delete cleanPatent.figures;
  }

  const prompt = `
PROFILE:
${JSON.stringify(profileData, null, 2)}

PATENT:
${JSON.stringify(cleanPatent, null, 2)}
Determine the following:
1. Does the patent belong to the profile person? Use full name from profile and check 
inventor list (case-insensitive, trim whitespace). The names must exactly 
match, including first
2. Is the patent related to Artificial Intelligence? Use keywords like ML, 
DL, computer vision, NLP, autonomous systems, etc.
3. Is the profile person the FIRST inventor in the inventor list? This means they must be at position 0 (first position) in the inventors array/list. Check if the profile person's name matches the very first name in the inventors list, not just anywhere in the list.

Return ONLY this JSON:
{
  "profile_match": "FULL" | "PARTIAL" | "NONE",
  "match_confidence": float,  // between 0 and 1
  "ai_related": true | false,
  "is_first_inventor": true | false,
  "reasoning": "Explain all decisions clearly in 1-2 lines"
}
`;
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'gemma3:4b',
      stream: false,
      prompt: prompt,
      options: {
        temperature: 0.1,
        top_p: 0.8,
        top_k: 40,
      }
    }, {
      timeout: 60000, // 60 second timeout
    });
    
    // console.log('prompt:', prompt);
    // console.log("Response data:", response.data);
    const responseText = response.data.response.trim();
    // console.log(" Response:", responseText);    
    
    // Extract JSON from DeepSeek response - handle thinking process and markdown
    let jsonString = '';
    
    // Method 1: Look for JSON after </think> tag and remove markdown code blocks
    if (responseText.includes('</think>')) {
      const afterThinking = responseText.split('</think>')[1];
      if (afterThinking) {
        // Remove markdown code blocks (```json and ```)
        let cleanedResponse = afterThinking.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        cleanedResponse = cleanedResponse.trim();
        
        // Find the JSON object
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
    }
    
    // Method 2: If method 1 failed, look for any JSON with profile_match (remove markdown first)
    if (!jsonString) {
      let cleanedResponse = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*?"profile_match"[\s\S]*?\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
    }
    
    // Method 3: Last resort - find the last complete JSON object
    if (!jsonString) {
      const lastBraceIndex = responseText.lastIndexOf('{');
      if (lastBraceIndex !== -1) {
        const potentialJson = responseText.substring(lastBraceIndex);
        // Remove any trailing markdown
        const cleanJson = potentialJson.replace(/```\s*$/, '').trim();
        if (cleanJson.includes('profile_match')) {
          jsonString = cleanJson;
        }
      }
    }
    
    // If still no valid JSON found, return early with error
    if (!jsonString || !jsonString.includes('profile_match')) {
      console.error(`No valid JSON found in response for patent ${patent.patent_id}`);
      return {
        match: false,
        profile_match: 'NONE',
        match_confidence: 0.0,
        ai_related: false,
        is_first_inventor: false,
        reasoning: 'Failed to extract JSON from LLM response'
      };
    }
    
    // If we still don't have expected fields, try to parse any JSON and return default
    if (!jsonString.includes('profile_match')) {
      console.warn(`LLM returned unexpected JSON format for patent ${patent.patent_id}, using fallback`);
      
      // Try to parse whatever JSON we have to avoid crashes
      try {
        JSON.parse(jsonString); // Just to validate it's valid JSON
      } catch (e) {
        // If it's not even valid JSON, clean it up
        jsonString = jsonString.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
        jsonString = jsonString.replace(/([{,]\s*)(\w+):/g, '$1"$2":');
      }
      
      // Return default response regardless of what LLM returned
      return {
        match: false,
        profile_match: 'NONE',
        match_confidence: 0.0,
        ai_related: false,
        is_first_inventor: false,
        reasoning: 'LLM returned unexpected format - defaulted to no match'
      };
    }
    console.log('json string:',jsonString);
    // Clean up common JSON issues
    jsonString = jsonString.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    jsonString = jsonString.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys
    jsonString = jsonString.replace(/:\s*([^",{\[\]}\s][^,}\]]*[^",{\[\]}\s])\s*([,}])/g, ':"$1"$2'); // Quote unquoted string values
    
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error(`JSON parse error for patent ${patent.patent_id}: ${parseError.message}`);
      console.error(`Attempted to parse: ${jsonString.substring(0, 200)}...`);
      
      // Return default values on parse error
      return {
        match: false,
        profile_match: 'NONE',
        match_confidence: 0.0,
        ai_related: false,
        is_first_inventor: false,
        reasoning: `JSON parse error: ${parseError.message}`
      };
    }
    
    // Convert string booleans to actual booleans
    if (typeof result.ai_related === 'string') {
      result.ai_related = result.ai_related.toLowerCase() === 'true';
    }
    if (typeof result.is_first_inventor === 'string') {
      result.is_first_inventor = result.is_first_inventor.toLowerCase() === 'true';
    }
    
    // Convert match_confidence to number if it's a string
    if (typeof result.match_confidence === 'string') {
      result.match_confidence = parseFloat(result.match_confidence);
    }
    
    // Convert to boolean for backward compatibility
    result.match = result.match_confidence >= 0.5;
    console.log('json string:',jsonString);

    return result;
    
  } catch (error) {
    console.error(`Error analyzing patent ${patent.patent_id}:`, error.message);
    
    // Retry logic for network errors
    if ((error.code === 'ECONNRESET' || error.message.includes('socket hang up')) && retryCount < 2) {
      console.log(`🔄 Retrying patent analysis (attempt ${retryCount + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return analyzeSinglePatentWithOllama(profileData, patent, searchType, retryCount + 1);
    }
    
    return { 
      match: false, 
      profile_match: 'NONE',
      match_confidence: 0.0,
      ai_related: false, 
      is_first_inventor: false, 
      reasoning: `analysis_failed: ${error.message}` 
    };
  }
}

/**
 * Process patents one by one until we find matches
 */
async function analyzePatentsWithOllama(profileData, patentResults, searchType) {
  const isGrantedSearch = searchType === 'GRANT';
  
  if (!patentResults.organic_results || patentResults.organic_results.length === 0) {
    return {
      findings: {
        [isGrantedSearch ? 'has_granted_first_inventor_ai' : 'has_filed_ai']: false,
        [isGrantedSearch ? 'has_granted_co_inventor_ai' : undefined]: isGrantedSearch ? false : undefined,
        profile_matches_found: false
      },
      sample_patents: []
    };
  }

  console.log(`🔍 Analyzing ${patentResults.organic_results.length} patents one by one...`);
  
  const results = {
    findings: {
      [isGrantedSearch ? 'has_granted_first_inventor_ai' : 'has_filed_ai']: false,
      [isGrantedSearch ? 'has_granted_co_inventor_ai' : undefined]: isGrantedSearch ? false : undefined,
      profile_matches_found: false
    },
    sample_patents: []
  };

  let foundFirstInventor = false;
  let foundCoInventor = false;
  let foundFiled = false;
  let profileMatches = false;

  // Process patents one by one
  for (let i = 0; i < patentResults.organic_results.length; i++) {
    const patent = patentResults.organic_results[i];
    
    console.log(`  📄 Analyzing patent ${i + 1}/${patentResults.organic_results.length}: ${patent.title?.substring(0, 50)}...`);
    
    const analysis = await analyzeSinglePatentWithOllama(profileData, patent, searchType);
    // console.log("ANALYSIS:",analysis);
    if (analysis.match) {
      profileMatches = true;
      results.findings.profile_matches_found = true;
      
      console.log(`    🎯 Profile Match: ${analysis.profile_match} (confidence: ${analysis.match_confidence})`);
      console.log(`    💭 Reasoning: ${analysis.reasoning}`);
      
      if (analysis.ai_related) {
        console.log(`    🤖 AI-related patent detected`);
        
        if (isGrantedSearch) {
          if (analysis.is_first_inventor && !foundFirstInventor) {
            foundFirstInventor = true;
            results.findings.has_granted_first_inventor_ai = true;
            results.sample_patents.push({
              patent_id: patent.patent_id,
              title: patent.title,
              classification: "granted_first_inventor_ai",
              reasoning: analysis.reasoning,
              match_details: {
                profile_match: analysis.profile_match,
                match_confidence: analysis.match_confidence,
                ai_related: analysis.ai_related,
                is_first_inventor: analysis.is_first_inventor
              }
            });
            console.log(`    ✅ Found granted first inventor AI patent!`);
          } else if (!analysis.is_first_inventor && !foundCoInventor) {
            foundCoInventor = true;
            results.findings.has_granted_co_inventor_ai = true;
            results.sample_patents.push({
              patent_id: patent.patent_id,
              title: patent.title,
              classification: "granted_co_inventor_ai",
              reasoning: analysis.reasoning,
              match_details: {
                profile_match: analysis.profile_match,
                match_confidence: analysis.match_confidence,
                ai_related: analysis.ai_related,
                is_first_inventor: analysis.is_first_inventor
              }
            });
            console.log(`    ✅ Found granted co-inventor AI patent!`);
          }
        } else {
          if (!foundFiled) {
            foundFiled = true;
            results.findings.has_filed_ai = true;
            results.sample_patents.push({
              patent_id: patent.patent_id,
              title: patent.title,
              classification: "filed_ai",
              reasoning: analysis.reasoning,
              match_details: {
                profile_match: analysis.profile_match,
                match_confidence: analysis.match_confidence,
                ai_related: analysis.ai_related,
                is_first_inventor: analysis.is_first_inventor
              }
            });
            console.log(`    ✅ Found filed AI patent!`);
          }
        }
      } else {
        console.log(`    ℹ️ Profile matches but not AI-related`);
      }
    } else {
      console.log(`    ❌ No profile match (${analysis.profile_match || 'NONE'})`);
    }
    
    // Stop early based on scoring optimization
    if (isGrantedSearch && foundFirstInventor) {
      // First inventor is max score - stop immediately
      console.log(`    🎯 Found granted first inventor (max score), stopping early at patent ${i + 1}`);
      break;
    } else if (!isGrantedSearch && foundFiled) {
      // For filed patents, one match is enough
      console.log(`    🎯 Found filed patent, stopping early at patent ${i + 1}`);
      break;
    }
    // Note: If only co-inventor found, continue searching for potential first inventor
    
    // Add small delay to avoid overwhelming Ollama
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📊 Analysis complete: ${results.sample_patents.length} matching patents found`);
  
  return {
    analysis: `Analyzed ${patentResults.organic_results.length} patents individually`,
    findings: Object.fromEntries(Object.entries(results.findings).filter(([k, v]) => v !== undefined)),
    sample_patents: results.sample_patents
  };
}

/**
 * Search for patents using SerpAPI with caching
 */
async function searchPatents(inventorName, status = 'GRANT') {
  // Check cache first
  const cachedResult = loadFromCache(inventorName, status);
  if (cachedResult) {
    return cachedResult.data;
  }

  // Make API call if not cached
  const url = `https://serpapi.com/search.json`;
  const params = {
    engine: 'google_patents',
    num: 100,
    inventor: inventorName,
    status: status,
    api_key: SERPAPI_KEY
  };

  try {
    console.log(`🌐 Making SerpAPI call for ${inventorName} (${status})`);
    const response = await axios.get(url, { params });
    
    // Save to cache
    saveToCache(inventorName, status, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`❌ SerpAPI error for ${inventorName}:`, error.message);
    console.error('🔍 Full patent error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Check for rate limit errors and throw them
    if (error.response?.status === 429) {
      console.error('🚨 DETECTED PATENT RATE LIMIT ERROR - Status 429');
      throw new Error('SERPAPI_RATE_LIMIT: Patent search rate limit exceeded. Please wait before trying again.');
    } else if (error.response?.status === 403) {
      console.error('🚨 DETECTED PATENT QUOTA EXCEEDED ERROR - Status 403');
      throw new Error('SERPAPI_QUOTA_EXCEEDED: Patent search quota exceeded. Please upgrade your plan or wait for quota reset.');
    } else if (error.response?.status >= 500) {
      console.error('🚨 DETECTED PATENT SERVER ERROR - Status >= 500');
      throw new Error('SERPAPI_SERVER_ERROR: Patent search service temporarily unavailable. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('🚨 DETECTED PATENT NETWORK ERROR');
      throw new Error('SERPAPI_NETWORK_ERROR: Unable to connect to patent search service. Please check your connection.');
    }
    
    // For other errors, return null to continue processing
    return null;
  }
}

/**
 * Main patent parsing function
 */
async function parsePatents(profileData) {
  const startTime = Date.now();
  
  try {
    // Extract name from profile
    const inventorName = extractNameFromProfile(profileData);
    if (!inventorName) {
      return {
        grantedFirstInventor: false,
        grantedCoInventor: false,
        filedPatent: false,
        significantContribution: false,
        extractionMethod: 'name_extraction_failed',
        extractionDate: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    }

    console.log(`🔍 Searching for patents by: ${inventorName}`);

    // Step 1: Search for granted patents
    let grantedResults;
    try {
      grantedResults = await searchPatents(inventorName, 'GRANT');
    } catch (error) {
      // Check if it's a rate limit or critical error
      if (error.message.includes('SERPAPI_RATE_LIMIT') || error.message.includes('SERPAPI_QUOTA_EXCEEDED')) {
        // For rate limit errors, throw them up to the evaluation endpoint
        throw new Error(error.message.replace(/^[A-Z_]+:\s*/, ''));
      } else if (error.message.includes('SERPAPI_NETWORK_ERROR') || error.message.includes('SERPAPI_SERVER_ERROR')) {
        // For network/server errors, throw them up
        throw new Error(error.message.replace(/^[A-Z_]+:\s*/, ''));
      } else {
        // For other errors, log and continue
        console.log('❌ No granted patents found or API error:', error.message);
        grantedResults = null;
      }
    }
    
    if (!grantedResults || grantedResults.error) {
      console.log('❌ No granted patents found or API error');
    }

    let patentAnalysis = null;
    let hasGrantedPatents = false;

    // Analyze granted patents if found
    if (grantedResults && grantedResults.organic_results && grantedResults.organic_results.length > 0) {
      console.log(`📊 Found ${grantedResults.organic_results.length} granted patents, analyzing...`);
      patentAnalysis = await analyzePatentsWithOllama(profileData, grantedResults, 'GRANT');
      
      if (!patentAnalysis) {
        console.log('⚠️ Ollama analysis failed for granted patents, creating fallback result');
        patentAnalysis = {
          findings: {
            has_granted_first_inventor_ai: false,
            has_granted_co_inventor_ai: false,
            profile_matches_found: false
          },
          sample_patents: []
        };
      }
      
      hasGrantedPatents = patentAnalysis && patentAnalysis.findings && 
                         (patentAnalysis.findings.has_granted_first_inventor_ai || 
                          patentAnalysis.findings.has_granted_co_inventor_ai);
    }

    // Step 2: Search for filed patents only if no granted first inventor found
    // (granted first inventor = max score, no need to search further)
    const hasGrantedFirstInventor = patentAnalysis && patentAnalysis.findings && 
                                  patentAnalysis.findings.has_granted_first_inventor_ai;
    
    if (!hasGrantedFirstInventor) {
      console.log(hasGrantedPatents ? 
        '🔍 Found granted co-inventor, but searching filed patents for potential first inventor...' : 
        '🔍 No granted patents found, searching for filed patents...');
      
      let filedResults;
      try {
        filedResults = await searchPatents(inventorName, 'APPLICATION');
      } catch (error) {
        // Check if it's a rate limit or critical error
        if (error.message.includes('SERPAPI_RATE_LIMIT') || error.message.includes('SERPAPI_QUOTA_EXCEEDED')) {
          // For rate limit errors, throw them up to the evaluation endpoint
          throw new Error(error.message.replace(/^[A-Z_]+:\s*/, ''));
        } else if (error.message.includes('SERPAPI_NETWORK_ERROR') || error.message.includes('SERPAPI_SERVER_ERROR')) {
          // For network/server errors, throw them up
          throw new Error(error.message.replace(/^[A-Z_]+:\s*/, ''));
        } else {
          // For other errors, log and continue
          console.log('❌ No filed patents found or API error:', error.message);
          filedResults = null;
        }
      }
      
      if (filedResults && filedResults.organic_results && filedResults.organic_results.length > 0) {
        console.log(`📊 Found ${filedResults.organic_results.length} filed patents, analyzing...`);
        const filedAnalysis = await analyzePatentsWithOllama(profileData, filedResults, 'APPLICATION');
        
        if (!filedAnalysis) {
          console.log('⚠️ Ollama analysis failed for filed patents, using fallback');
          // Create fallback for filed patents
          const filedFallback = {
            findings: {
              has_filed_ai: false,
              profile_matches_found: false
            },
            sample_patents: []
          };
          
          if (patentAnalysis) {
            patentAnalysis.findings.has_filed_ai = false;
          } else {
            patentAnalysis = filedFallback;
          }
        } else {
          // Combine analyses if both exist
          if (patentAnalysis && filedAnalysis) {
            patentAnalysis.sample_patents = [...(patentAnalysis.sample_patents || []), ...(filedAnalysis.sample_patents || [])];
            patentAnalysis.findings.has_filed_ai = filedAnalysis.findings.has_filed_ai || false;
            patentAnalysis.findings.profile_matches_found = patentAnalysis.findings.profile_matches_found || filedAnalysis.findings.profile_matches_found;
          } else if (filedAnalysis) {
            patentAnalysis = filedAnalysis;
          }
        }
      }
    } else {
      console.log('🎯 Granted first inventor found - skipping filed patent search (max score achieved)');
    }

    // Process results
    if (!patentAnalysis) {
      return {
        grantedFirstInventor: false,
        grantedCoInventor: false,
        filedPatent: false,
        significantContribution: false,
        extractionMethod: 'ollama_analysis_failed',
        extractionDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        searchedName: inventorName
      };
    }

    // Determine patent status based on analysis
    const findings = patentAnalysis.findings;
    const grantedFirstInventor = findings.has_granted_first_inventor_ai || false;
    const grantedCoInventor = findings.has_granted_co_inventor_ai || false;
    const filedPatent = findings.has_filed_ai || false;
    const significantContribution = grantedFirstInventor || grantedCoInventor || filedPatent;

    console.log(`✅ Patent analysis complete:`);
    console.log(`  - Has Granted (First Inventor): ${grantedFirstInventor}`);
    console.log(`  - Has Granted (Co-Inventor): ${grantedCoInventor}`);
    console.log(`  - Has Filed Patents: ${filedPatent}`);
    console.log(`  - Significant Contribution: ${significantContribution}`);
    console.log(`  - Profile Matches Found: ${findings.profile_matches_found}`);

    return {
      grantedFirstInventor,
      grantedCoInventor,
      filedPatent,
      significantContribution,
      extractionMethod: 'serpapi_ollama_strict_analysis',
      extractionDate: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      searchedName: inventorName,
      patentDetails: {
        profileMatchesFound: findings.profile_matches_found || false,
        hasGrantedFirstInventor: grantedFirstInventor,
        hasGrantedCoInventor: grantedCoInventor,
        hasFiledPatent: filedPatent,
        samplePatents: patentAnalysis.sample_patents || []
      },
      analysisConfidence: findings.profile_matches_found ? 'high' : 'low'
    };

  } catch (error) {
    console.error('❌ Patent parsing error:', error.message);
    
    // Check if it's a critical error that should be re-thrown to evaluation route
    const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                           error.message.includes('SERPAPI_SERVER_ERROR') ||
                           error.message.includes('SERPAPI_NETWORK_ERROR');
    
    if (isCriticalError) {
      console.error('🚨 CRITICAL PATENT ERROR - Re-throwing to evaluation route');
      throw error; // Re-throw critical errors to be handled by evaluation route
    }
    
    console.error('📝 Non-critical patent error - returning fallback values');
    return {
      grantedFirstInventor: false,
      grantedCoInventor: false,
      filedPatent: false,
      significantContribution: false,
      extractionMethod: 'error',
      extractionDate: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

module.exports = {
  parsePatents,
  searchPatents,
  analyzePatentsWithOllama,
  extractNameFromProfile
}; 