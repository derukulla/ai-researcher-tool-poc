// =============================================================================
// GITHUB OPEN SOURCE CONTRIBUTION PARSER
// =============================================================================
// This module searches GitHub for user profiles and uses Ollama to match
// the correct profile based on the input profile data.

const axios = require('axios');
const {
  getCachedUserProfile,
  setCachedUserProfile,
  getCachedSearchResults,
  setCachedSearchResults
} = require('./githubCache');

// =============================================================================
// GITHUB API CONFIGURATION
// =============================================================================

const GITHUB_BASE_URL = 'https://api.github.com';
const SEARCH_LIMIT = 30; // Maximum number of search results to return
const { GITHUB_TOKEN } = require('../config/apiKeys');

// =============================================================================
// OLLAMA CONFIGURATION
// =============================================================================

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3:latest';

/**
 * Generate content using Ollama with axios
 * @param {string} prompt - The prompt to send to Ollama
 * @returns {Promise<string>} Generated response
 */
async function generateWithOllama(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      system: "You are a GitHub profile matcher. You must return ONLY valid JSON. Do not write code or explanations. Return only the JSON object as specified in the prompt.",
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
// GITHUB API FUNCTIONS
// =============================================================================

/**
 * Add delay to avoid rate limiting
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for GitHub users by name
 * @param {string} name - Name to search for
 * @returns {Promise<Array>} Array of user search results
 */
async function searchGitHubUsers(name) {
  try {
    // Check cache first
    const cachedResults = getCachedSearchResults(name);
    if (cachedResults) {
      console.log(`💾 Using cached search results for: ${name}`);
      return cachedResults;
    }
    
    // Add delay to avoid rate limiting
    await delay(1000);
    
    const encodedName = encodeURIComponent(name);
    const url = `${GITHUB_BASE_URL}/search/users`;
    
    console.log(`🔍 Searching GitHub for: ${name}`);
    console.log(`📡 API Request: ${url}?q=${encodedName}+in:fullname&type=Users`);
    
    const response = await axios.get(url, {
      params: {
        q: `${name} in:fullname`,
        type: 'Users',
        per_page: SEARCH_LIMIT
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'AI-Researcher-Tool/1.0 (Academic Research)',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`
      }
    });
    
    if (response.status === 200 && response.data && response.data.items) {
      const results = response.data.items;
      console.log(`📊 Found ${response.data.total_count} total matches, returning ${results.length} results`);
      
      // Cache the search results
      setCachedSearchResults(name, results);
      
      return results;
    } else {
      console.log('⚠️ Unexpected API response format:', response.status);
      return [];
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      if (status === 403) {
        console.log('⚠️ GitHub API rate limit hit, waiting 60 seconds...');
        await delay(60000);
        throw new Error(`GitHub API error: Rate limit exceeded (${status}) - please try again later`);
      } else if (status === 422) {
        throw new Error(`GitHub API error: Validation failed (${status}) - check query format`);
      } else if (status === 404) {
        console.log('📭 No results found for this user');
        return [];
      } else {
        throw new Error(`GitHub API error: ${status} ${statusText}`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to GitHub API - check internet connection');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('GitHub API domain not found - check internet connection');
    } else {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

/**
 * Get detailed user information from GitHub
 * @param {string} login - GitHub username/login
 * @returns {Promise<object>} Detailed user information
 */
async function getGitHubUserDetails(login) {
  try {
    // Check cache first
    const cachedProfile = getCachedUserProfile(login);
    if (cachedProfile) {
      console.log(`💾 Using cached profile for: ${login}`);
      return cachedProfile;
    }
    
    // Add delay to avoid rate limiting
    await delay(500);
    
    const url = `${GITHUB_BASE_URL}/users/${login}`;
    
    console.log(`📡 Getting details for user: ${login}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'AI-Researcher-Tool/1.0 (Academic Research)',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`
      }
    });
    
    if (response.status === 200 && response.data) {
      const userData = response.data;
      
      // Extract only the fields we need
      const profileData = {
        name: userData.name,
        company: userData.company,
        blog: userData.blog,
        location: userData.location,
        email: userData.email,
        bio: userData.bio,
        twitter_username: userData.twitter_username,
        public_repos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        created_at: userData.created_at
      };
      
      // Cache the profile data
      setCachedUserProfile(login, profileData);
      
      return profileData;
    } else {
      console.log('⚠️ Unexpected user API response format:', response.status);
      return null;
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        console.log('⚠️ GitHub API rate limit hit for user details');
        await delay(60000);
        throw new Error(`GitHub API error: Rate limit exceeded (${status})`);
      } else if (status === 404) {
        console.log(`⚠️ User ${login} not found`);
        return null;
      } else {
        throw new Error(`GitHub API error: ${status} ${error.response.statusText}`);
      }
    } else {
      throw new Error(`Network error getting user details: ${error.message}`);
    }
  }
}

/**
 * Enhance GitHub search results with detailed user information
 * @param {Array} searchResults - Results from GitHub user search
 * @returns {Promise<Array>} Enhanced profile data
 */
async function enhanceGitHubProfiles(searchResults) {
  const enhancedProfiles = [];
  
  console.log(`🔍 Enhancing ${searchResults.length} GitHub profiles with detailed information...`);
  
  for (const profile of searchResults) {
    try {
      // Get detailed user information
      const userDetails = await getGitHubUserDetails(profile.login);
      
      // Combine search result with user details
      const enhancedProfile = {
        // Basic info from search
        login: profile.login,
        id: profile.id,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        type: profile.type,
        
        // Enhanced info from user details API
        name: userDetails?.name || null,
        company: userDetails?.company || null,
        blog: userDetails?.blog || null,
        location: userDetails?.location || null,
        email: userDetails?.email || null,
        bio: userDetails?.bio || null,
        twitter_username: userDetails?.twitter_username || null,
        public_repos: userDetails?.public_repos || 0,
        followers: userDetails?.followers || 0,
        following: userDetails?.following || 0,
        created_at: userDetails?.created_at || null
      };
      
      enhancedProfiles.push(enhancedProfile);
      
      console.log(`  ✅ Enhanced profile for ${profile.login} (${enhancedProfile.name || 'No name'})`);
      
    } catch (error) {
      console.error(`❌ Failed to enhance profile for ${profile.login}:`, error.message);
      
      // Add basic profile without enhancement
      enhancedProfiles.push({
        login: profile.login,
        id: profile.id,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        type: profile.type,
        name: null,
        company: null,
        blog: null,
        location: null,
        email: null,
        bio: null,
        twitter_username: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: null
      });
    }
  }
  
  console.log(`✅ Enhanced ${enhancedProfiles.length} GitHub profiles`);
  return enhancedProfiles;
}

// =============================================================================
// AI MATCHING FUNCTIONS
// =============================================================================

/**
 * Create prompt for Ollama to find the best matching GitHub profile
 * @param {object} profileData - Original profile data
 * @param {array} githubProfiles - Enhanced GitHub profiles
 * @returns {string} Formatted prompt for Ollama
 */
function createGitHubMatchingPrompt(profileData, githubProfiles) {
  const targetName = extractNameFromProfile(profileData);
  
  let prompt = `You are a strict identity resolution system tasked with matching a TARGET PROFILE to the most accurate GitHub profile from a list of candidates.

Your goal is to find whether any GitHub profile truly belongs to the TARGET PERSON — based on identity, not popularity, fandom, or keyword overlap.

TARGET PROFILE:
- Name: "${targetName}"
- Profile Context: ${JSON.stringify(profileData, null, 2)}

GITHUB PROFILES FOUND:
`;

  githubProfiles.forEach((profile, index) => {
    prompt += `
${index + 1}. GitHub Username: ${profile.login}
   Full Name: ${profile.name || 'Not provided'}
   Company: ${profile.company || 'Not provided'}
   Location: ${profile.location || 'Not provided'}
   Bio: ${profile.bio || 'Not provided'}
   Blog: ${profile.blog || 'Not provided'}
   Twitter: ${profile.twitter_username || 'Not provided'}
   Email: ${profile.email || 'Not provided'}
   Public Repos: ${profile.public_repos}
   Followers: ${profile.followers}
   Created: ${profile.created_at || 'Unknown'}
   Profile URL: ${profile.html_url}`;
  });

  prompt += `
MATCHING RULES:

1. ✅ **STRICT Identity Match**: The GitHub profile must BE the actual person:
   - The full name must match or be very close (e.g., "Linus Torvalds" matches "Linus Torvalds", not "Praneeth Patakota")
   - Username should relate to their real name (e.g., "torvalds" for Linus Torvalds)
   - Profile should claim to BE the person, not just reference them
   - REJECT all fan accounts, bots, nicknames, or people who merely reference the target

2. ✅ **Professional Alignment** (Optional but Strong Signal):
   - Match on company, role, or industry
   - Prefer profiles that mention the same employer, industry, or location

3. ✅ **Real Name Verification**:
   - Username and/or full name should strongly match the person’s real name
   - Slight variations or initials are acceptable if context confirms the match
   - Reject profiles with unrelated names

4. ✅ **Additional Signals** (Soft filters):
   - Email or domain match (e.g., john.smith@company.com)
   - GitHub activity history (low activity is acceptable if identity is verified)
   - Blog, Twitter, LinkedIn if present

5. ❌ **Hard Exclusion Rules**:
   - Bio says “inspired by” or references the person without claiming to be them
   - Name mismatch or suspicious usernames 
   - Profile created recently with no credible activity or metadata
   - Offensive or unrelated bios
   - Spammy or placeholder accounts

OUTPUT FORMAT:

Return ONLY a valid JSON object in this exact format:

If a match is found:
{
  "match_found": true,
  "github_username": "actual_username_here",
  "confidence": "high",
  "reasoning": "brief explanation of why this is the best match"
}

If no match is found:
{
  "match_found": false,
  "github_username": null,
  "confidence": "none",
  "reasoning": "brief explanation of why no match was found"
}

IMPORTANT: 
- Return ONLY the JSON object, no other text
- Do not write Python code or explanations
- Do not include markdown code blocks
- Start your response with { and end with }
- Example valid response: {"match_found": false, "github_username": null, "confidence": "none", "reasoning": "No exact name match found"}`;

  return prompt;
}

/**
 * Use Ollama to match GitHub profile
 * @param {object} profileData - Original profile data
 * @param {array} githubProfiles - Enhanced GitHub profiles
 * @returns {Promise<object>} Matching result
 */
async function matchGitHubProfileWithAI(profileData, githubProfiles) {
  try {
    console.log('🦙 Using Ollama to match GitHub profile...');
    
    const prompt = createGitHubMatchingPrompt(profileData, githubProfiles);
    const response = await generateWithOllama(prompt);
    // console.log("PROMPT:",prompt);
    console.log('🦙 Ollama GitHub matching response:', response.trim());
    
    const text = response.trim();
    
    // Parse JSON response
    let matchResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, trying fallback extraction...');
      console.log('🔍 DEBUG: Raw response:', text);
      
      // Fallback: try to determine if it's a match or no match
      if (text.includes('NO_MATCH') || text.toLowerCase().includes('no match')) {
        return {
          matchFound: false,
          matchedProfile: null,
          matchConfidence: 'none',
          matchReason: 'Ollama determined no suitable match found',
          extractedData: null
        };
      }
      
      // Try to extract username from old format for backward compatibility
      let githubUsername = null;
      const lines = text.split('\n');
      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.length > 0 && cleanLine.length < 50 && 
            /^[a-zA-Z0-9\-_]+$/.test(cleanLine)) {
          githubUsername = cleanLine;
          break;
        }
      }
      
      if (githubUsername) {
        matchResult = {
          match_found: true,
          github_username: githubUsername,
          confidence: 'medium',
          reasoning: 'Extracted from non-JSON response'
        };
      } else {
        return {
          matchFound: false,
          matchedProfile: null,
          matchConfidence: 'low',
          matchReason: 'Could not parse response format',
          extractedData: null
        };
      }
    }
    
    // Validate the JSON structure
    if (!matchResult.hasOwnProperty('match_found') || !matchResult.hasOwnProperty('github_username')) {
      console.log('⚠️ Invalid JSON structure in response');
      return {
        matchFound: false,
        matchedProfile: null,
        matchConfidence: 'low',
        matchReason: 'Invalid JSON response structure',
        extractedData: null
      };
    }
    
    // Handle no match case
    if (!matchResult.match_found) {
      console.log('🔍 DEBUG: Ollama returned no match. Available profiles were:');
      console.log('📋 Target Name:', extractNameFromProfile(profileData));
      console.log('📊 GitHub Profiles:');
      
      githubProfiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.login} (${profile.name || 'No name'})`);
        console.log(`     Company: ${profile.company || 'N/A'}, Location: ${profile.location || 'N/A'}`);
        console.log(`     Repos: ${profile.public_repos}, Followers: ${profile.followers}`);
        console.log('');
      });
      
      return {
        matchFound: false,
        matchedProfile: null,
        matchConfidence: 'none',
        matchReason: matchResult.reasoning || 'No suitable match found',
        extractedData: null
      };
    }
    
    const githubUsername = matchResult.github_username;
    
    if (!githubUsername) {
      console.log('⚠️ No GitHub username provided in match result');
      return {
        matchFound: false,
        matchedProfile: null,
        matchConfidence: 'low',
        matchReason: 'No username in response',
        extractedData: null
      };
    }
    
    // Additional validation to prevent fan account matches
    const targetName = extractNameFromProfile(profileData);
    const potentialMatch = githubProfiles.find(profile => 
      profile.login.toLowerCase() === githubUsername.toLowerCase()
    );
    
    if (potentialMatch) {
      // Check if this is a fan account by comparing names
      const profileName = potentialMatch.name || '';
      const targetNameLower = targetName.toLowerCase();
      const profileNameLower = profileName.toLowerCase();
      
      // If names are completely different, this might be a fan account
      if (profileName && !profileNameLower.includes(targetNameLower.split(' ')[0]) && 
          !profileNameLower.includes(targetNameLower.split(' ')[1] || '')) {
        
        // Check if bio mentions the target (indicating fan account)
        const bio = potentialMatch.bio || '';
        if (bio.toLowerCase().includes(targetNameLower) || 
            bio.toLowerCase().includes('inspired by') || 
            bio.toLowerCase().includes('fan of')) {
          
          console.log('⚠️ Detected potential fan account - rejecting match');
          console.log(`   Target: ${targetName}`);
          console.log(`   Profile: ${profileName} (${githubUsername})`);
          console.log(`   Bio: ${bio}`);
          
          return {
            matchFound: false,
            matchedProfile: null,
            matchConfidence: 'none',
            matchReason: `Rejected potential fan account: ${profileName} (${githubUsername}) - name mismatch with target ${targetName}`,
            extractedData: null
          };
        }
      }
    }
    
    // Find the matched profile in search results
    const matchedProfile = githubProfiles.find(profile => 
      profile.login.toLowerCase() === githubUsername.toLowerCase()
    );
    
    if (!matchedProfile) {
      console.log('⚠️ GitHub username not found in search results:', githubUsername);
      console.log('🔍 DEBUG: Available usernames were:');
      githubProfiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.login}`);
      });
      
      return {
        matchFound: false,
        matchedProfile: null,
        matchConfidence: 'low',
        matchReason: 'GitHub username not found in search results',
        extractedData: null
      };
    }
    
    console.log('✅ Successfully matched GitHub profile:', matchedProfile.login);
    console.log('📊 Profile stats:', {
      name: matchedProfile.name,
      company: matchedProfile.company,
      repos: matchedProfile.public_repos,
      followers: matchedProfile.followers
    });
    
    return {
      matchFound: true,
      matchedProfile: matchedProfile,
      matchConfidence: 'high',
      matchReason: `Ollama matched to ${matchedProfile.login} (${matchedProfile.name || 'No name'})`,
      extractedData: {
        githubUsername: matchedProfile.login,
        fullName: matchedProfile.name,
        company: matchedProfile.company,
        location: matchedProfile.location,
        bio: matchedProfile.bio,
        publicRepos: matchedProfile.public_repos,
        followers: matchedProfile.followers,
        profileUrl: matchedProfile.html_url,
        createdAt: matchedProfile.created_at
      }
    };
    
  } catch (error) {
    console.error('❌ Error in Ollama GitHub matching:', error);
    
    return {
      matchFound: false,
      matchedProfile: null,
      matchConfidence: 'none',
      matchReason: `Ollama matching failed: ${error.message}`,
      extractedData: null
    };
  }
}

// =============================================================================
// GITHUB PROFILE ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Get user's repositories from GitHub API
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} Array of repository data
 */
async function getUserRepositories(username) {
  try {
    // Check if we have cached repo data
    const cachedRepos = getCachedData('repos', username);
    if (cachedRepos) {
      console.log(`💾 Using cached repositories for: ${username}`);
      return cachedRepos;
    }
    
    await delay(500); // Rate limiting
    
    const url = `${GITHUB_BASE_URL}/users/${username}/repos`;
    
    console.log(`📡 Getting repositories for user: ${username}`);
    
    const response = await axios.get(url, {
      params: {
        sort: 'updated',
        direction: 'desc'
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'AI-Researcher-Tool/1.0 (Academic Research)',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`
      }
    });
    
    if (response.status === 200 && response.data) {
      const repos = response.data;
      console.log(`📊 Found ${repos.length} repositories for ${username}`);
      
      // Cache the repository data
      setCachedData('repos', username, repos);
      
      return repos;
    } else {
      console.log('⚠️ Unexpected repos API response format:', response.status);
      return [];
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        console.log('⚠️ GitHub API rate limit hit for repositories');
        await delay(60000);
        throw new Error(`GitHub API error: Rate limit exceeded (${status})`);
      } else if (status === 404) {
        console.log(`⚠️ Repositories not found for ${username}`);
        return [];
      } else {
        throw new Error(`GitHub API error: ${status} ${error.response.statusText}`);
      }
    } else {
      throw new Error(`Network error getting repositories: ${error.message}`);
    }
  }
}

/**
 * Analyze repositories for AI relevance using LLM
 * @param {Array} repos - Array of repository data
 * @returns {Promise<boolean>} True if has AI relevant repositories
 */
async function analyzeAIRelevance(repos) {
  try {
    console.log('🦙 Using Ollama to analyze AI relevance...');
    
    // Prepare repository data for LLM analysis
    const repoData = repos.map(repo => ({
      name: repo.name,
      description: repo.description || '',
      topics: repo.topics || [],
      language: repo.language || ''
    }));
    
    const prompt = `You are an expert AI researcher evaluating GitHub repositories for AI/ML relevance. 
Analyze the following repositories and determine if the person has ANY AI/ML related work.

REPOSITORIES TO ANALYZE:
${JSON.stringify(repoData, null, 2)}

ANALYSIS CRITERIA:
Look for AI/ML keywords in:
- Repository names (ai, ml, neural, deep, learning, gpt, transformer, etc.)
- Descriptions (machine learning, artificial intelligence, neural networks, etc.)
- Topics (tensorflow, pytorch, keras, scikit-learn, etc.)
- Programming languages commonly used for AI (Python, R, Julia, etc.)

INSTRUCTIONS:
- Return ONLY "true" if you find at least ONE repository that is clearly AI/ML related
- Return ONLY "false" if you find NO AI/ML related repositories
- Do not provide explanations or additional text
- Be strict: only return true if there's clear AI/ML relevance

RESPONSE FORMAT:
Return only "true" or "false" (without quotes)`;

    const response = await generateWithOllama(prompt);
    
    console.log('🦙 Ollama AI relevance response:', response.trim());
    
    // Parse the response - look for true/false
    const text = response.trim().toLowerCase();
    
    // Check for explicit true/false
    if (text === 'true' || text.includes('true')) {
      console.log('✅ AI relevance found: true');
      return true;
    } else if (text === 'false' || text.includes('false')) {
      console.log('❌ AI relevance found: false');
      return false;
    }
    
    // Fallback: look for AI keywords in the response
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
      'neural', 'tensorflow', 'pytorch', 'keras', 'gpt', 'transformer',
      'computer vision', 'nlp', 'natural language'
    ];
    
    const hasAIKeywords = aiKeywords.some(keyword => text.includes(keyword));
    
    console.log(`🔍 Fallback AI keyword detection: ${hasAIKeywords}`);
    return hasAIKeywords;
    
  } catch (error) {
    console.error('❌ Error in AI relevance analysis:', error);
    return false; // Default to false on error
  }
}

/**
 * Analyze GitHub profile comprehensively
 * @param {object} profile - GitHub profile data
 * @returns {Promise<object>} Comprehensive analysis
 */
async function analyzeGitHubProfile(profile) {
  try {
    console.log(`🔍 Starting comprehensive analysis for: ${profile.login}`);
    
    // Get user repositories
    const repos = await getUserRepositories(profile.login);
    
    if (repos.length === 0) {
      console.log('📭 No repositories found for analysis');
      return {
        repoVolume: 0,
        repoInitiative: 0,
        recentActivity: 0,
        popularity: 0,
        aiRelevance: false,
        analysisDate: new Date().toISOString()
      };
    }
    
    // 1. Repo Volume - from profile public_repos
    const repoVolume = profile.public_repos || 0;
    
    // 2. Repo Initiative - count non-fork repositories
    const repoInitiative = repos.filter(repo => !repo.fork).length;
    
    // 3. Recent Activity - repos updated in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentActivity = repos.filter(repo => {
      if (!repo.updated_at) return false; // Skip repos with no update date
      
      const updatedAt = new Date(repo.updated_at);
      if (isNaN(updatedAt.getTime())) return false; // Skip invalid dates
      
      return updatedAt >= sixMonthsAgo;
    }).length;
    
    // 4. Popularity - total stars across all repositories
    const popularity = repos.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
    
    // 5. AI Relevance - analyze using LLM
    const aiRelevance = await analyzeAIRelevance(repos);
    
    console.log('📊 Analysis Results:');
    console.log(`   Repo Volume: ${repoVolume}`);
    console.log(`   Repo Initiative: ${repoInitiative}`);
    console.log(`   Recent Activity: ${recentActivity}`);
    console.log(`   Popularity: ${popularity} stars`);
    console.log(`   AI Relevance: ${aiRelevance ? 'Yes' : 'No'}`);
    
    return {
      repoVolume,
      repoInitiative,
      recentActivity,
      popularity,
      aiRelevance,
      analysisDate: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error in GitHub profile analysis:', error);
    return {
      repoVolume: 0,
      repoInitiative: 0,
      recentActivity: 0,
      popularity: 0,
      aiRelevance: false,
      analysisDate: new Date().toISOString(),
      error: error.message
    };
  }
}

// =============================================================================
// CACHE HELPER FUNCTIONS
// =============================================================================

/**
 * Generic cache data function (for repositories)
 * @param {string} type - Cache type
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
function setCachedData(type, key, data) {
  const { setCachedSearchResults } = require('./githubCache');
  // Reuse the search cache function with different type prefix
  setCachedSearchResults(`${type}_${key}`, data);
}

/**
 * Generic get cache data function (for repositories)
 * @param {string} type - Cache type
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
function getCachedData(type, key) {
  const { getCachedSearchResults } = require('./githubCache');
  // Reuse the search cache function with different type prefix
  return getCachedSearchResults(`${type}_${key}`);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract name from profile data
 * @param {object} profileData - Profile data
 * @returns {string} Extracted name
 */
function extractNameFromProfile(profileData) {
  let name = 'Unknown Name';
  
  if (typeof profileData === 'object') {
    if (profileData.name) name = profileData.name;
    else if (profileData.education?.name) name = profileData.education.name;
    else if (profileData.firstName && profileData.lastName) {
      name = `${profileData.firstName} ${profileData.lastName}`;
    }
  } else if (typeof profileData === 'string') {
    const lines = profileData.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine) {
      const nameMatch = firstLine.match(/^([A-Za-z\s\.]+?)(?:\s*[-–—]|\s*,|\s*\n|$)/);
      if (nameMatch && nameMatch[1].length > 2 && nameMatch[1].length < 50) {
        name = nameMatch[1].trim();
      }
    }
  }
  
  // Clean up the name
  if (name && name !== 'Unknown Name') {
    name = name
      .replace(/^(Dr\.?|Prof\.?|Professor|Mr\.?|Ms\.?|Mrs\.?)\s+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return name || 'Unknown Name';
}

/**
 * Create empty GitHub data structure
 * @param {string} reason - Reason for empty data
 * @returns {object} Empty GitHub data
 */
function createEmptyGitHubData(reason) {
  return {
    githubUsername: null,
    fullName: null,
    company: null,
    location: null,
    bio: null,
    publicRepos: 0,
    followers: 0,
    profileUrl: null,
    matchConfidence: 'none',
    matchReason: reason,
    extractionMethod: 'fallback',
    extractionDate: new Date().toISOString()
  };
}

// =============================================================================
// MAIN EXTRACTION FUNCTION
// =============================================================================

/**
 * Extract GitHub profile information using AI matching
 * @param {object} profileData - Profile data containing name and other info
 * @returns {Promise<object>} GitHub profile data
 */
async function extractGitHubWithAI(profileData) {
  try {
    // Extract name from profile
    const targetName = extractNameFromProfile(profileData);
    
    if (!targetName || targetName === 'Unknown Name') {
      console.log('⚠️ No valid name found in profile');
      return createEmptyGitHubData('No name found in profile');
    }
    
    console.log(`🔍 Starting GitHub profile extraction for: ${targetName}`);
    
    // Step 1: Search GitHub for potential user matches
    const searchResults = await searchGitHubUsers(targetName);
    
    if (!searchResults || searchResults.length === 0) {
      console.log('📭 No GitHub users found');
      return createEmptyGitHubData('No GitHub users found');
    }
    
    // Step 2: Enhance profiles with detailed information
    const enhancedProfiles = await enhanceGitHubProfiles(searchResults);
    
    if (enhancedProfiles.length === 0) {
      console.log('📭 No enhanced profiles available');
      return createEmptyGitHubData('No enhanced profiles available');
    }
    
    // Step 3: Use Ollama AI to match the correct profile
    const matchResult = await matchGitHubProfileWithAI(profileData, enhancedProfiles);
    
    if (!matchResult.matchFound || !matchResult.extractedData) {
      console.log('🔍 No suitable GitHub profile match found');
      return createEmptyGitHubData(matchResult.matchReason || 'No suitable match found');
    }
    
    console.log('✅ GitHub profile match found, starting comprehensive analysis...');
    
    // Step 4: Perform comprehensive analysis of the matched profile
    const profileAnalysis = await analyzeGitHubProfile(matchResult.matchedProfile);
    
    console.log('✅ GitHub profile extraction and analysis completed successfully');
    
    return {
      ...matchResult.extractedData,
      matchConfidence: matchResult.matchConfidence,
      matchReason: matchResult.matchReason,
      extractionMethod: 'github_ai_matching',
      extractionDate: new Date().toISOString(),
      
      // Add comprehensive analysis results
      analysis: profileAnalysis
    };
    
  } catch (error) {
    console.error('❌ Error in GitHub profile extraction:', error);
    return createEmptyGitHubData(`Extraction failed: ${error.message}`);
  }
}

/**
 * Main function to parse GitHub profile data
 * @param {object} profileData - Profile data containing name and other info
 * @returns {Promise<object>} GitHub profile data
 */
async function parseGitHub(profileData) {
  console.log('🚀 Starting GitHub profile extraction...');
  
  try {
    const result = await extractGitHubWithAI(profileData);
    return result;
  } catch (error) {
    console.error('❌ Critical error in parseGitHub:', error);
    return createEmptyGitHubData(`Critical error: ${error.message}`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  parseGitHub,
  extractGitHubWithAI,
  searchGitHubUsers,
  enhanceGitHubProfiles,
  matchGitHubProfileWithAI,
  extractNameFromProfile,
  createEmptyGitHubData,
  analyzeGitHubProfile, // Add the new function to exports
  getUserRepositories, // Add the new function to exports
  analyzeAIRelevance // Add the new function to exports
}; 