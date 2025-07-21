const axios = require('axios');

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';

// Top AI organizations for scoring
const TOP_AI_ORGANIZATIONS = [
  'Microsoft', 'Google', 'OpenAI', 'DeepMind', 'Meta', 'Apple', 'Amazon', 
  'Tesla', 'Nvidia', 'Intel', 'IBM', 'Adobe', 'Salesforce', 'Uber', 'Airbnb',
  'IISc', 'MIT', 'Stanford', 'CMU', 'Berkeley', 'Oxford', 'Cambridge',
  'AI Startups', 'Research Labs', 'Tech Companies'
];

// Top universities with QS Score < 300 (representative list)
const TOP_UNIVERSITIES_QS_300 = [
  'MIT', 'Stanford', 'Harvard', 'Caltech', 'Oxford', 'Cambridge', 'ETH Zurich',
  'UCL', 'Imperial College London', 'University of Chicago', 'NUS', 'Peking University',
  'University of Pennsylvania', 'Tsinghua University', 'University of Edinburgh',
  'Princeton', 'Yale', 'King\'s College London', 'London School of Economics',
  'University of California Berkeley', 'University of Tokyo', 'Columbia University',
  'McGill University', 'University of Michigan', 'Australian National University',
  'University of Toronto', 'Manchester University', 'Northwestern University',
  'University of Hong Kong', 'London School of Economics', 'University of California Los Angeles',
  'Seoul National University', 'University of Melbourne', 'University of Sydney',
  'University of New South Wales', 'University of British Columbia', 'Carnegie Mellon University',
  'New York University', 'University of Bristol', 'KAIST', 'University of Zurich',
  'University of Warwick', 'University of Glasgow', 'University of Wisconsin Madison',
  'University of Southampton', 'University of Birmingham', 'University of St Andrews',
  'Brown University', 'University of Leeds', 'University of Sheffield',
  'University of Nottingham', 'Boston University', 'University of Amsterdam',
  'Delft University of Technology', 'KU Leuven', 'University of Copenhagen',
  'Technical University of Munich', 'Heidelberg University', 'University of Oslo',
  'Stockholm University', 'University of Helsinki', 'University of Geneva',
  'University of Zurich', 'University of Vienna', 'Charles University Prague',
  'University of Warsaw', 'Moscow State University', 'Lomonosov Moscow State University',
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'IIT Roorkee', 'IIT Guwahati', 'IISc Bangalore', 'BITS Pilani', 'NIT Trichy',
  'University of Washington', 'Georgia Institute of Technology', 'University of Illinois',
  'University of Texas Austin', 'University of California San Diego', 'Purdue University',
  'Ohio State University', 'University of Minnesota', 'University of Colorado Boulder',
  'University of Maryland', 'Virginia Tech', 'North Carolina State University',
  'University of California Irvine', 'University of California Davis', 'University of California Santa Barbara',
  'Rice University', 'Vanderbilt University', 'Emory University', 'University of Rochester',
  'Case Western Reserve University', 'Rensselaer Polytechnic Institute', 'University of Pittsburgh'
];

// Deep learning frameworks
const DL_FRAMEWORKS = [
  'TensorFlow', 'PyTorch', 'Keras', 'JAX', 'Caffe', 'MXNet', 'Theano',
  'Scikit-learn', 'Hugging Face', 'OpenCV', 'CUDA', 'cuDNN'
];

/**
 * Extract work experience and skills from profile using Ollama
 */
async function parseWorkExperience(profileData, retryCount = 0) {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Extracting work experience and skills...');
    console.log('📊 Profile data type:', typeof profileData);
    
    if (typeof profileData === 'object' && profileData !== null) {
      console.log('📊 Profile data keys:', Object.keys(profileData));
      console.log('📊 Profile data structure:', JSON.stringify(profileData, null, 2).substring(0, 300) + '...');
    } else if (typeof profileData === 'string') {
      console.log('📊 Profile data preview:', profileData.substring(0, 100) + '...');
    } else {
      console.log('📊 Profile data value:', profileData);
    }
    
    // Convert profileData to string format if it's an object
    let profileText = '';
    if (typeof profileData === 'string') {
      profileText = profileData;
    } else if (typeof profileData === 'object' && profileData !== null) {
      // If it's an object, try to extract the actual profile text
      if (profileData.profileData && typeof profileData.profileData === 'string') {
        profileText = profileData.profileData;
      } else if (profileData.name && profileData.education) {
        // Construct profile text from structured data
        profileText = `Name: ${profileData.name}\n`;
        if (profileData.education) {
          profileText += `Education: ${JSON.stringify(profileData.education, null, 2)}\n`;
        }
        if (profileData.publications) {
          profileText += `Publications: ${JSON.stringify(profileData.publications, null, 2)}\n`;
        }
        if (profileData.github) {
          profileText += `GitHub: ${JSON.stringify(profileData.github, null, 2)}\n`;
        }
        if (profileData.info) {
          profileText += `Additional Info: ${JSON.stringify(profileData.info, null, 2)}\n`;
        }
      } else {
        profileText = JSON.stringify(profileData, null, 2);
      }
    } else {
      profileText = String(profileData);
    }
    
    console.log('📝 Final profile text length:', profileText.length);
    console.log('📝 Final profile text preview:', profileText.substring(0, 200) + '...');
    
    const prompt = `
PROFILE DATA:
${profileText}

Extract work experience and skills information from this profile.

TASKS:
1. Identify top AI organizations the person has worked at (include both companies AND academic positions)
   - Academic positions at top universities should be treated as equivalent to top AI company positions
   
2. Assess impact and quality of work (rate 1-4 based on achievements, leadership, notable projects)
3. Check if they have mentorship role (teaching, supervising, leading teams, worked as professor or researcher)
4. Identify deep learning frameworks they have experience with if yes return true else false
5. Extract years of experience in AI/ML field

Return ONLY this JSON:
{
  "topAIOrganizations": true,
  "impactQuality": 4,
  "mentorshipRole": true,
  "dlFrameworks": true,
  "yearsOfExperience": 5,
  "reasoning": "brief explanation of assessment (avoid colons and quotes in text)"
}

IMPORTANT:
- Use true/false for boolean values (not True/False)

Be accurate and conservative in your assessment.
`;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'llama3:latest',
      prompt: prompt,
      stream: false,
      system: "You are a work experience analyzer. You must return ONLY valid JSON. Do not write code, explanations, or markdown. Return only the JSON object as specified in the prompt.",
      options: {
        temperature: 0.1,
        num_predict: 300
      }
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseText = response.data.response.trim();
    
    // Extract JSON
    let jsonString = responseText;
    if (!jsonString.startsWith('{')) {
      const match = jsonString.match(/\{[\s\S]*?\}/);
      if (match) jsonString = match[0];
    }
    // console.log('prompt:',prompt);
    console.log('🔍 DEBUG: Raw response text:', responseText.substring(0, 200) + '...');
    console.log('🔍 DEBUG: Extracted JSON string:', jsonString.substring(0, 200) + '...');
    
    // Special handling for the reasoning field that often contains problematic characters
    // Completely remove the reasoning field and everything after it, then rebuild
    const reasoningStart = jsonString.indexOf('"reasoning":');
    if (reasoningStart !== -1) {
      // Get everything before the reasoning field
      let beforeReasoning = jsonString.substring(0, reasoningStart);
      
      // Remove trailing comma if it exists
      beforeReasoning = beforeReasoning.replace(/,\s*$/, '');
      
      // Rebuild the JSON without the problematic reasoning field
      jsonString = beforeReasoning + '\n}';
      
      console.log('🔧 Removed problematic reasoning field, rebuilt JSON:', jsonString);
    }
    
    // Clean up common JSON issues
    jsonString = jsonString.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    
    // Fix unquoted keys
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix unquoted values (but be careful not to break already quoted strings)
    jsonString = jsonString.replace(/:\s*([^",{\[\]}\s][^,}\]]*[^",{\[\]}\s])\s*([,}])/g, function(match, value, ending) {
      const trimmedValue = value.trim();
      // Don't quote if it's already a number or boolean
      if (/^\d+$/.test(trimmedValue) || /^(true|false)$/.test(trimmedValue)) {
        return ': ' + trimmedValue + ending;
      }
      // Quote the string value
      return ': "' + trimmedValue + '"' + ending;
    });
    
    console.log('🔍 DEBUG: Cleaned JSON string:', jsonString.substring(0, 200) + '...');
    
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('❌ Failed to parse JSON:', jsonString);
      
             // Try a more aggressive cleanup
       jsonString = jsonString.replace(/'/g, '"'); // Replace single quotes with double quotes
       
       // Handle the specific case where reasoning field has unescaped content
       // Find the reasoning field and properly escape it
       const reasoningMatch = jsonString.match(/"reasoning":\s*"([^"]*)"([^}]*)/);
       if (reasoningMatch) {
         const reasoningContent = reasoningMatch[1] + reasoningMatch[2];
         // Find the end of the reasoning field (next comma or closing brace)
         const endMatch = reasoningContent.match(/^([^"]*?)"\s*([,}])/);
         if (endMatch) {
           const fullReasoning = reasoningMatch[1] + endMatch[1];
           const cleanReasoning = fullReasoning.replace(/"/g, '\\"'); // Escape internal quotes
           jsonString = jsonString.replace(
             /"reasoning":\s*"[^"]*"[^,}]*([,}])/,
             `"reasoning": "${cleanReasoning}"$1`
           );
         }
       }
       
       // Quote all unquoted keys and values
       jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
       jsonString = jsonString.replace(/:\s*([^",{\[\]}\s][^,}\]]*)\s*([,}])/g, ':"$1"$2');
      
      console.log('🔍 DEBUG: Aggressively cleaned JSON:', jsonString.substring(0, 200) + '...');
      
      try {
        result = JSON.parse(jsonString);
      } catch (secondError) {
        console.error('❌ Second JSON parse attempt failed:', secondError.message);
        throw parseError; // Throw the original error
      }
    }
    
    // Clean the results (no validation needed since LLM is instructed to return only valid entries)
    const workExperience = {
      topAIOrganizations: Boolean(result.topAIOrganizations),
      impactQuality: Math.max(1, Math.min(4, result.impactQuality || 1)),
      mentorshipRole: Boolean(result.mentorshipRole),
      dlFrameworks: Boolean(result.dlFrameworks),
      yearsOfExperience: Math.max(0, result.yearsOfExperience || 0),
      extractionMethod: 'ollama_analysis',
      extractionDate: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      reasoning: result.reasoning || 'Profile analysis completed successfully'
    };

    console.log('✅ Work experience extraction complete:');
    console.log(`  - Top AI Organizations: ${workExperience.topAIOrganizations}`);
    console.log(`  - Impact Quality: ${workExperience.impactQuality}/4`);
    console.log(`  - Mentorship Role: ${workExperience.mentorshipRole}`);
    console.log(`  - DL Frameworks: ${workExperience.dlFrameworks}`);
    console.log(`  - Years of Experience: ${workExperience.yearsOfExperience}`);

    return workExperience;

  } catch (error) {
    console.error('❌ Work experience parsing error:', error.message);
    
    // Retry logic for network errors
    if ((error.code === 'ECONNRESET' || error.message.includes('socket hang up')) && retryCount < 2) {
      console.log(`🔄 Retrying work experience analysis (attempt ${retryCount + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return parseWorkExperience(profileData, retryCount + 1);
    }
    
    // For JSON parsing errors, try to extract basic info from the raw text
    if (error.message.includes('JSON') && typeof responseText === 'string') {
      console.log('🔧 Attempting basic text extraction as fallback...');
      
      const fallbackResult = {
        topAIOrganizations: false,
        impactQuality: 1,
        mentorshipRole: false,
        dlFrameworks: false,
        yearsOfExperience: 0,
        extractionMethod: 'text_fallback',
        extractionDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        error: error.message
      };
      
      // Try to extract some basic info from the text
      const text = responseText.toLowerCase();
      
      // Look for years of experience
      const yearsMatch = text.match(/(\d+)\s*years?\s*of\s*experience/);
      if (yearsMatch) {
        fallbackResult.yearsOfExperience = parseInt(yearsMatch[1]);
      }
      
      // Look for mentorship keywords
      if (text.includes('mentor') || text.includes('lead') || text.includes('teach') || text.includes('supervise')) {
        fallbackResult.mentorshipRole = true;
      }
      
      // Look for impact quality indicators
      if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('director')) {
        fallbackResult.impactQuality = 3;
      } else if (text.includes('mid') || text.includes('experienced')) {
        fallbackResult.impactQuality = 2;
      }
      
      console.log('✅ Basic text extraction completed:', fallbackResult);
      return fallbackResult;
    }
    
    return {
      topAIOrganizations: false,
      impactQuality: 1,
      mentorshipRole: false,
      dlFrameworks: false,
      yearsOfExperience: 0,
      extractionMethod: 'error',
      extractionDate: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Extract HuggingFace ID or GitHub username from profile using LLM
 * @param {object|string} profileData - Profile data to analyze
 * @returns {Promise<object>} HuggingFace ID or GitHub username information
 */
async function gethuggingid(profileData) {
  const startTime = Date.now();
  
  try {
    console.log('🤗 Searching for HuggingFace ID or GitHub username...');
    
    // Convert profile to text for analysis
    let profileText = '';
    if (typeof profileData === 'string') {
      profileText = profileData;
    } else if (typeof profileData === 'object') {
      profileText = JSON.stringify(profileData, null, 2);
    } else {
      profileText = String(profileData);
    }
    
    const prompt = `
PROFILE DATA:
${profileText}

Extract HuggingFace ID or GitHub username from this profile data.

PRIORITY ORDER:
1. First, look for HuggingFace profile ID, username, or profile URL
2. If no HuggingFace found, look for GitHub username or profile URL

HUGGINGFACE PATTERNS TO LOOK FOR:
- huggingface.co/username
- HuggingFace profile links
- HF username mentions
- @username on HuggingFace
- Hugging Face profile references

GITHUB PATTERNS TO LOOK FOR:
- github.com/username
- GitHub profile links
- @username on GitHub
- GitHub username mentions
- Git repository links

EXTRACTION RULES:
- Extract just the username/ID, not the full URL
- Remove any prefixes like @ or /
- Prefer verified or explicitly mentioned profiles
- Be case-sensitive for usernames

Return ONLY this JSON:
{
  "found": true/false,
  "platform": "huggingface" | "github" | null,
  "username": "extracted_username" | null,
  "confidence": "high" | "medium" | "low",
  "source_text": "relevant text where found" | null,
  "reasoning": "brief explanation of what was found"
}

IMPORTANT:
- Return false if no clear username/ID found
- Prioritize HuggingFace over GitHub
- Use true/false for boolean values (not True/False)
`;

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'llama3:latest',
      prompt: prompt,
      stream: false,
      system: "You are a profile analyzer. You must return ONLY valid JSON. Do not write code, explanations, or markdown. Return only the JSON object as specified in the prompt.",
      options: {
        temperature: 0.1,
        num_predict: 300
      }
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseText = response.data.response.trim();
    
    // Extract JSON
    let jsonString = responseText;
    if (!jsonString.startsWith('{')) {
      const match = jsonString.match(/\{[\s\S]*?\}/);
      if (match) jsonString = match[0];
    }
    
    console.log('🔍 DEBUG: Raw LLM response:', responseText.substring(0, 200) + '...');
    
    let result;
    try {
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('❌ JSON parsing failed for HuggingFace/GitHub extraction');
      return {
        found: false,
        platform: null,
        username: null,
        confidence: 'low',
        source_text: null,
        reasoning: 'JSON parsing failed',
        extractionMethod: 'llm_parse_error',
        extractionDate: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    }
    
    // Validate and enhance result
    if (typeof result.found !== 'boolean') {
      result.found = false;
    }
    
    // Fallback: If no social profiles found, use full name without spaces
    if (!result.found || !result.username) {
      let fallbackUsername = null;
      
      // Try to extract name from profileData
      if (profileData && typeof profileData === 'object' && profileData.name) {
        fallbackUsername = profileData.name.replace(/\s+/g, ''); // Remove all spaces
      } else if (typeof profileData === 'string') {
        // Try to extract name from text (look for name patterns)
        const nameMatch = profileData.match(/(?:name|Name):\s*([A-Za-z\s]+)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (nameMatch) {
          fallbackUsername = (nameMatch[1] || nameMatch[2]).trim().replace(/\s+/g, '');
        }
      }
      
      if (fallbackUsername && fallbackUsername.length > 2) {
        result.found = true;
        result.platform = 'fallback';
        result.username = fallbackUsername;
        result.confidence = 'low';
        result.reasoning = 'Using full name as fallback username (no social profiles found)';
        result.source_text = 'Extracted from profile name field';
        console.log(`🔄 Using fallback username: ${fallbackUsername}`);
      }
    }
    
    // Add metadata
    result.extractionMethod = result.platform === 'fallback' ? 'fallback_name_extraction' : 'ollama_llm_analysis';
    result.extractionDate = new Date().toISOString();
    result.processingTime = Date.now() - startTime;
    
    if (result.found && result.username) {
      if (result.platform === 'fallback') {
        console.log(`🔄 Using fallback username: ${result.username} (from profile name)`);
      } else {
        console.log(`✅ Found ${result.platform} ID: ${result.username} (confidence: ${result.confidence})`);
        console.log(`   Source: ${result.source_text?.substring(0, 100)}...`);
      }
    } else {
      console.log('❌ No HuggingFace ID, GitHub username, or valid name found');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error extracting HuggingFace/GitHub ID:', error.message);
    
    // Try fallback name extraction even on error
    let fallbackResult = {
      found: false,
      platform: null,
      username: null,
      confidence: 'low',
      source_text: null,
      reasoning: `extraction_failed: ${error.message}`,
      extractionMethod: 'error',
      extractionDate: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      error: error.message
    };
    
    // Try to extract name as fallback
    try {
      let fallbackUsername = null;
      
      if (profileData && typeof profileData === 'object' && profileData.name) {
        fallbackUsername = profileData.name.replace(/\s+/g, '');
      } else if (typeof profileData === 'string') {
        const nameMatch = profileData.match(/(?:name|Name):\s*([A-Za-z\s]+)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (nameMatch) {
          fallbackUsername = (nameMatch[1] || nameMatch[2]).trim().replace(/\s+/g, '');
        }
      }
      
      if (fallbackUsername && fallbackUsername.length > 2) {
        fallbackResult.found = true;
        fallbackResult.platform = 'fallback';
        fallbackResult.username = fallbackUsername;
        fallbackResult.reasoning = 'LLM extraction failed, using name fallback';
        fallbackResult.extractionMethod = 'error_fallback_name';
        console.log(`🔄 LLM failed, using fallback name: ${fallbackUsername}`);
      }
    } catch (fallbackError) {
      console.error('❌ Fallback name extraction also failed:', fallbackError.message);
    }
    
    return fallbackResult;
  }
}



module.exports = {
  parseWorkExperience,
  gethuggingid,
  TOP_AI_ORGANIZATIONS,
  TOP_UNIVERSITIES_QS_300,
  DL_FRAMEWORKS
}; 