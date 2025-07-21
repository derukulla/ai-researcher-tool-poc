// =============================================================================
// AI-POWERED PROFILE PARSER USING GOOGLE GEMINI
// =============================================================================
// This module uses Google Gemini AI to intelligently extract education information
// from raw profile data instead of relying on manual pattern matching.
// This approach is more flexible, accurate, and can handle various formats.

const axios = require('axios');
const { classifyInstituteTierWithLLM } = require('./qsRankings');


// =============================================================================
// OLLAMA CONFIGURATION
// =============================================================================

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3:latest'; // Use the available model

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
      options: {
        temperature: 0.1,
        top_p: 0.8,
        top_k: 40
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
// AI PROMPTS FOR EDUCATION EXTRACTION
// =============================================================================

/**
 * Create a detailed prompt for Ollama to extract education information
 * @param {string} profileData - Raw profile text or JSON string
 * @returns {string} Formatted prompt for Ollama
 */
function createEducationExtractionPrompt(profileData) {
  const profileText = typeof profileData === 'object' ? 
    JSON.stringify(profileData, null, 2) : profileData.toString();
    
  return `You are an expert at extracting education information from profiles. 
Analyze the SPECIFIC profile data below and extract the ACTUAL education information from it.

PROFILE DATA TO ANALYZE:
${profileText}

TASK: Extract the ACTUAL education information from this specific profile. Do not create fictional data.

INSTRUCTIONS:
1. Extract the person's full name from the profile (look for "name" field or first line)
   - REMOVE titles like Dr., Mr., Mrs., Miss., Ms., Prof., Professor, etc.
   - Return ONLY the actual name without any titles or honorifics
2. Find the highest/most recent degree mentioned PhD > Master's/Mtech > Bachelor's/Btech
3. Identify the field of study from the profile for that recent degree
4. Find the institution/university name mentioned
5. Use ONLY information present in the profile data

DEGREE CATEGORIES (choose based on what's mentioned):
- "PhD" - for completed PhDs, Doctorates, D.Phil
- "Pursuing PhD" - for ongoing PhD studies, PhD candidates  
- "Master's/ Mtech" - for Master's degrees, MS, MA, M.Tech, M.S., etc.
- "Bachelor's/ Btech" - for Bachelor's degrees, BS, BA, B.Tech, B.S., etc.

FIELD CATEGORIES (choose based on what's mentioned):
- "AI" - for Artificial Intelligence, Machine Learning, Deep Learning, Neural Networks
- "Computer Science" - for Computer Science, Software Engineering, Computing
- "Related Fields" - for other technical fields like Electronics, Mathematics, Data Science

RESPONSE FORMAT:
Respond with ONLY a valid JSON object in this exact format Dont include any explanation in fields:
{
  "name": "actual name from the profile WITHOUT titles (no Dr., Mr., Mrs., etc.)",
  "degree": "actual degree mentioned in profile", 
  "fieldOfStudy": "actual field mentioned in profile OR 'Unknown' if not found",
  "institute": "actual institution mentioned in profile OR 'Unknown Institute' if no institute is found",
  "confidence": "high/medium/low based on clarity of information in profile"
}

IMPORTANT: Extract ONLY from the provided profile data. Do not make up information. If no institute is mentioned, use 'Unknown Institute'.`;
}

// =============================================================================
// MAIN EXTRACTION FUNCTIONS
// =============================================================================

/**
 * Extract education information using Ollama AI
 * @param {object} profileData - Raw profile data (text, JSON, etc.)
 * @returns {Promise<object>} Structured education information
 */
async function 
parseEducation(profileData) {
  console.log('🚀 Starting Ollama-powered education extraction...');
  
  try {
    // Create the prompt for education extraction
    const prompt = createEducationExtractionPrompt(profileData);
    
    // Use Ollama to extract education information
    console.log('🦙 Using Ollama to extract education information...');
    const response = await generateWithOllama(prompt);
    // console.log('prompt:',prompt);
    console.log('🦙 Ollama education response:', response.substring(0, 200) + '...');
    
    // Parse the response
    let educationData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        educationData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, using fallback extraction...');
      educationData = extractEducationFromText(response);
    }
    
    // Validate and enhance the extracted data
    const validatedEducation = validateAndEnhanceEducation(educationData);
    
    console.log('✅ Education extraction completed successfully');
    
    
    return validatedEducation;
    
  } catch (error) {
    console.error('❌ Error in Ollama education extraction:', error);
    
    // Return fallback education data
    return {
      name: extractNameFallback(profileData),
      degree: 'Unknown',
      fieldOfStudy: 'Unknown',
      institute: 'Unknown Institute',
      instituteTier: 'Other Institute (QS >300)',
      qsRanking: null,
      confidence: 'low',
      extractionMethod: 'fallback',
      extractionDate: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Get QS ranking information for an institute
 * @param {string} instituteName - Name of the institute
 * @returns {Promise<object>} Institute ranking information
 */
async function getInstituteRankingInfo(instituteName) {
  try {
    if (!instituteName || instituteName.toLowerCase().includes('unknown institute')) {
      return {
        name: 'Unknown Institute',
        tier: 'Other Institute (QS >300)',
        qsRank: null,
        qsRankOriginal: null,
        qsMatchedName: null,
        qsFound: false,
        confidence: 'low',
        method: 'unknown-institute'
      };
    }
    
    // Use new LLM-based QS ranking system
    const rankInfo = await classifyInstituteTierWithLLM(instituteName);
    
    return {
      name: instituteName,
      tier: rankInfo.tier,
      qsRank: rankInfo.rank,
      qsMatchedName: rankInfo.matchedName, // Use exact QS name if available
      qsFound: rankInfo.found,
      confidence: rankInfo.confidence,
      method: rankInfo.method
    };
    
  } catch (error) {
    console.error('❌ Error getting QS ranking info:', error);
    return {
      name: instituteName,
      tier: 'Other Institute (QS >300)',
      qsRank: null,
      qsRankOriginal: null,
      qsMatchedName: null,
      qsFound: false,
      confidence: 'low',
      method: 'error-fallback'
    };
  }
}

/**
 * Create fallback education data when AI extraction fails
 * @param {string|object} profileData - Original profile data
 * @param {string} errorMessage - Error that caused fallback
 * @returns {object} Fallback education structure
 */
function createFallbackEducation(profileData, errorMessage) {
  console.log('⚠️ Using fallback education extraction due to error:', errorMessage);
  
  // Basic text analysis for fallback
  const profileText = typeof profileData === 'object' ? 
    JSON.stringify(profileData) : profileData.toString();
  const lowerText = profileText.toLowerCase();
  
  // Simple fallback logic
  let degree = 'Bachelor\'s';
  if (lowerText.includes('phd') || lowerText.includes('doctorate')) {
    degree = lowerText.includes('pursuing') || lowerText.includes('candidate') ? 
      'Pursuing PhD' : 'PhD';
  } else if (lowerText.includes('master') || lowerText.includes('m.s') || lowerText.includes('m.tech')) {
    degree = 'Master\'s';
  }
  
  let fieldOfStudy = 'Computer Science';
  if (lowerText.includes('artificial intelligence') || lowerText.includes('machine learning') || 
      lowerText.includes('deep learning') || lowerText.includes(' ai ')) {
    fieldOfStudy = 'AI';
  }
  
  // Try to extract name from fallback text analysis
  let name = 'Unknown Name';
  
  // Handle different input types for name extraction
  if (typeof profileData === 'object') {
    // For JSON/object data, look for name fields
    if (profileData.name) {
      name = profileData.name;
    } else if (profileData.firstName && profileData.lastName) {
      name = `${profileData.firstName} ${profileData.lastName}`;
    } else if (profileData.personalInfo?.name) {
      name = profileData.personalInfo.name;
    }
  } else {
    // For text data, extract from first line
    const lines = profileText.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine) {
      // Look for name patterns in the first line
      const nameMatch = firstLine.match(/^([A-Za-z\s\.]+?)(?:\s*[-–—]|\s*,|\s*\n|$)/);
      if (nameMatch && nameMatch[1].length > 2 && nameMatch[1].length < 50) {
        name = nameMatch[1].trim();
        // Remove titles like Dr., Mr., Mrs., Miss., Ms., Prof., Professor, etc.
        name = name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Miss\.?|Ms\.?|Prof\.?|Professor\.?)\s+/i, '');
      }
    }
  }

  return {
    name,
    degree,
    fieldOfStudy,
    instituteTier: 'Other Institute (QS >300)',
    institute: 'Unknown Institute',
    aiConfidence: 'low',
    qsRank: null,
    qsRankOriginal: null,
    qsMatchedName: null,
    qsFound: false,
    extractionMethod: 'fallback',
    fallbackReason: errorMessage
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract education information from text when JSON parsing fails
 * @param {string} text - Raw text response from Ollama
 * @returns {object} Extracted education data
 */
function extractEducationFromText(text) {
  console.log('🔧 Extracting education from text fallback...');
  
  // Basic text parsing fallback
  const lowerText = text.toLowerCase();
  
  // Extract name (look for patterns like "Name: John Doe" or first line)
  let name = 'Unknown Name';
  const nameMatch = text.match(/name[:\s]*([^\n,]+)/i) || 
                   text.match(/^([A-Za-z\s\.]+?)(?:\s*[-–—]|\s*,|\s*\n|$)/m);
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].trim();
    // Remove titles like Dr., Mr., Mrs., Miss., Ms., Prof., Professor, etc.
    name = name.replace(/^(Dr\.?|Mr\.?|Mrs\.?|Miss\.?|Ms\.?|Prof\.?|Professor\.?)\s+/i, '');
  }
  
  // Extract degree
  let degree = 'Bachelor\'s';
  if (lowerText.includes('phd') || lowerText.includes('doctorate')) {
    degree = lowerText.includes('pursuing') || lowerText.includes('candidate') ? 
      'Pursuing PhD' : 'PhD';
  } else if (lowerText.includes('master') || lowerText.includes('m.s') || lowerText.includes('m.tech')) {
    degree = 'Master\'s';
  }
  
  // Extract field of study
  let fieldOfStudy = 'Computer Science';
  if (lowerText.includes('artificial intelligence') || lowerText.includes('machine learning') || 
      lowerText.includes('deep learning') || lowerText.includes(' ai ')) {
    fieldOfStudy = 'AI';
  }
  
  // Extract institute
  let institute = 'Unknown Institute';
  const instituteMatch = text.match(/institute[:\s]*([^\n,]+)/i) || 
                        text.match(/university[:\s]*([^\n,]+)/i) ||
                        text.match(/college[:\s]*([^\n,]+)/i);
  if (instituteMatch && instituteMatch[1]) {
    institute = instituteMatch[1].trim();
  }
  
  return {
    name,
    degree,
    fieldOfStudy,
    institute,
    confidence: 'low'
  };
}

/**
 * Extract name from profile data as fallback
 * @param {object} profileData - Original profile data
 * @returns {string} Extracted name or default
 */
function extractNameFallback(profileData) {
  if (typeof profileData === 'object') {
    if (profileData.name) return profileData.name;
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    if (profileData.personalInfo?.name) return profileData.personalInfo.name;
  }
  
  if (typeof profileData === 'string') {
    const lines = profileData.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine) {
      const nameMatch = firstLine.match(/^([A-Za-z\s\.]+?)(?:\s*[-–—]|\s*,|\s*\n|$)/);
      if (nameMatch && nameMatch[1].length > 2 && nameMatch[1].length < 50) {
        return nameMatch[1].trim();
      }
    }
  }
  
  return 'Unknown Name';
}

/**
 * Validate and enhance extracted education data
 * @param {object} educationData - Raw education data from Ollama
 * @returns {Promise<object>} Enhanced education data with QS rankings
 */
async function validateAndEnhanceEducation(educationData) {
  // Get QS ranking information for the institute
  const instituteInfo = await getInstituteRankingInfo(educationData.institute);
  
  // Combine validated data with QS ranking information
  return {
    name: educationData.name,
    degree: educationData.degree,
    fieldOfStudy: educationData.fieldOfStudy,
    institute: instituteInfo.name,
    instituteTier: instituteInfo.tier,
    qsRanking: instituteInfo.qsRank,
    qsRankOriginal: instituteInfo.qsRankOriginal,
    qsMatchedName: instituteInfo.qsMatchedName,
    qsFound: instituteInfo.qsFound,
    confidence: educationData.confidence,
    extractionMethod: 'ollama-ai',
    extractionDate: new Date().toISOString()
  };
}

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Legacy function name for backward compatibility
 * @deprecated Use parseEducation instead
 */
async function extractEducation(profileText, structuredData = {}) {
  console.warn('⚠️ extractEducation is deprecated. Use parseEducation instead.');
  return parseEducation(profileText);
}

// =============================================================================
// TESTING FUNCTIONS
// =============================================================================

/**
 * Test the Ollama-powered education extraction with sample profiles
 */
async function testEducationExtraction() {
  console.log('🧪 Testing Ollama-powered education extraction...');
  console.log('=' .repeat(60));
  
  const testProfiles = [
    // Test Case 1: LinkedIn-style profile
    `Dr. Sarah Chen - AI Research Scientist
    Currently pursuing PhD in Artificial Intelligence at Stanford University
    Research focus: Machine Learning, Computer Vision, Neural Networks
    Previously: MS in Computer Science from MIT
    Email: sarah.chen@stanford.edu`,

    // Test Case 2: Structured resume format
    {
      name: "Alex Johnson",
      education: {
        current: "PhD in Machine Learning",
        university: "Carnegie Mellon University",
        previousDegree: "Bachelor's in Computer Science",
        previousUniversity: "UC Berkeley"
      },
      email: "alex.johnson@andrew.cmu.edu"
    },

    // Test Case 3: Simple format
    `Priya Sharma
    PhD student in AI at IISc Bangalore
    Working on deep learning and natural language processing
    Contact: priya@iisc.ac.in`,

    // Test Case 4: Minimal information
    `Software Engineer with BS in CS
    Experience with machine learning and data science
    Worked on AI projects at Google`
  ];

  for (let i = 0; i < testProfiles.length; i++) {
    console.log(`\n🔍 Test Case ${i + 1}:`);
    console.log('Input:', typeof testProfiles[i] === 'string' ? 
      testProfiles[i].substring(0, 100) + '...' : 
      JSON.stringify(testProfiles[i], null, 2));
    
    try {
      const startTime = Date.now();
      const result = await parseEducation(testProfiles[i]);
      const endTime = Date.now();
      
      console.log('✅ Result:', {
        name: result.name,
        degree: result.degree,
        field: result.fieldOfStudy,
        institute: result.institute,
        tier: result.instituteTier,
        confidence: result.confidence,
        method: result.extractionMethod,
        processingTime: `${endTime - startTime}ms`
      });
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('-'.repeat(50));
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
  // Main functions
  parseEducation,
  
  // Legacy compatibility
  extractEducation,
  
  // Testing
  testEducationExtraction,
  
  // Utility functions
  generateWithOllama,
  createEducationExtractionPrompt,
  getInstituteRankingInfo,
  createFallbackEducation
}; 