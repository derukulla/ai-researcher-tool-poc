/**
 * Profile Search - Searches LinkedIn profiles using SerpAPI and filters them step by step
 * Uses education filters to find relevant profiles, then parses and filters each one
 */

const axios = require('axios');
const { parseEducation } = require('./aiProfileParser');
const { parsePublications } = require('./publicationsParser');
const { parsePatents } = require('./patentParser');
const { parseWorkExperience } = require('./workExperienceParser');
const { parseGitHub } = require('./githubParser');
const { formatLinkedInProfile } = require('./linkedinFormatter');

const { SERPAPI_API_KEY: SERPAPI_KEY, PDL_API_KEY } = require('../config/apiKeys');

// People Data Labs API configuration
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5/person/enrich';

/**
 * Fetch LinkedIn profile data using People Data Labs API
 * @param {string} linkedinId - LinkedIn ID (without linkedin.com/in/)
 * @returns {Promise<object>} Profile data from PDL API
 */
async function fetchLinkedInProfile(linkedinId) {
  console.log(`🔍 Fetching LinkedIn profile: ${linkedinId}`);
  
  try {
    const response = await axios.get(PDL_BASE_URL, {
      params: {
        profile: `linkedin.com/in/${linkedinId}`
      },
      headers: {
        'X-Api-Key': PDL_API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data && response.data.status === 200) {
      console.log(`✅ Successfully fetched profile for: ${linkedinId}`);
      return {
        linkedinId,
        success: true,
        rawData: response.data,
        data: response.data.data,
        error: null
      };
    } else {
      console.log(`⚠️ Profile not found for: ${linkedinId}`);
      return {
        linkedinId,
        success: false,
        rawData: null,
        data: null,
        error: 'Profile not found'
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching profile for ${linkedinId}:`, error.message);
    return {
      linkedinId,
      success: false,
      rawData: null,
      data: null,
      error: error.message
    };
  }
}

/**
 * Build search query for LinkedIn profiles based on education filters
 * @param {object} filters - Filter object with degree and fieldOfStudy
 * @returns {string} Search query
 */
function buildLinkedInSearchQuery(filters) {
  const { degree, fieldOfStudy } = filters;
  
  const queryParts = ['site:linkedin.com/in'];
  
  // Add degree to search
  if (degree && degree !== '') {
    // Map degree values to search terms
    const degreeMap = {
      'PhD': '"PhD" OR "Ph.D" OR "Doctor"',
      "Master's": '"Master" OR "MS" OR "MSc" OR "MA"',
      'Pursuing PhD': '"PhD student" OR "PhD candidate" OR "pursuing PhD"'
    };
    queryParts.push(degreeMap[degree] || `"${degree}"`);
  }
  
  // Add field of study to search
  if (fieldOfStudy && fieldOfStudy !== '') {
    // Map field values to search terms
    const fieldMap = {
      'AI': '"Artificial Intelligence" OR "AI" OR "Machine Learning"',
      'Computer Science': '"Computer Science" OR "CS"',
      'Machine Learning': '"Machine Learning" OR "ML" OR "Deep Learning"',
      'Computer Vision': '"Computer Vision" OR "CV" OR "Image Processing"',
      'NLP': '"Natural Language Processing" OR "NLP" OR "Text Mining"',
      'Related Fields': '"Data Science" OR "Robotics" OR "Statistics"'
    };
    queryParts.push(fieldMap[fieldOfStudy] || `"${fieldOfStudy}"`);
  }
  
  return queryParts.join(' ');
}

/**
 * Extract LinkedIn username from LinkedIn URL
 * @param {string} url - LinkedIn URL
 * @returns {string|null} LinkedIn username
 */
function extractLinkedInUsername(url) {
  try {
    const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting LinkedIn username:', error);
    return null;
  }
}

/**
 * Search for LinkedIn profiles using SerpAPI
 * @param {object} filters - Filter object
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Array>} Array of LinkedIn profile URLs
 */
async function searchLinkedInProfiles(filters, maxResults = 50) {
  try {
    const query = buildLinkedInSearchQuery(filters);
    console.log(`🔍 Searching LinkedIn profiles with query: ${query}`);
    
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: query,
        gl: 'us',
        hl: 'en',
        num: 100, // Google max is 100
        api_key: SERPAPI_KEY
      },
      timeout: 15000
    });
    
    const organicResults = response.data.organic_results || [];
    console.log(`📊 Found ${organicResults.length} search results`);
    
    // Extract LinkedIn URLs and usernames
    const linkedInProfiles = [];
    for (const result of organicResults) {
      if (result.link && result.link.includes('linkedin.com/in/')) {
        const username = extractLinkedInUsername(result.link);
        if (username) {
          linkedInProfiles.push({
            url: result.link,
            username: username,
            title: result.title,
            snippet: result.snippet
          });
        }
      }
    }
    
    console.log(`✅ Extracted ${linkedInProfiles.length} LinkedIn profiles`);
    return linkedInProfiles;
    
  } catch (error) {
    console.error('❌ Error searching LinkedIn profiles:', error.message);
    throw error;
  }
}

/**
 * Check if education meets filter criteria
 * @param {object} education - Parsed education data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether education meets criteria
 */
function checkEducationFilter(education, filters) {
  const { degree, fieldOfStudy, instituteTier } = filters;
  
  // Check degree
  if (degree && degree !== '') {
    if (!education.degree || !education.degree.toLowerCase().includes(degree.toLowerCase())) {
      return false;
    }
  }
  
  // Check field of study
  if (fieldOfStudy && fieldOfStudy !== '') {
    const actualField = education.fieldOfStudy || '';
    const filterFieldLower = fieldOfStudy.toLowerCase();
    const actualFieldLower = actualField.toLowerCase();
    
    // Handle broad matches for field of study
    let fieldMatches = false;
    
    if (filterFieldLower === 'ai') {
      fieldMatches = actualFieldLower.includes('ai') || 
                    actualFieldLower.includes('artificial intelligence') ||
                    actualFieldLower.includes('machine learning') ||
                    actualFieldLower.includes('deep learning');
    } else if (filterFieldLower === 'computer science') {
      fieldMatches = actualFieldLower.includes('computer science') ||
                    actualFieldLower.includes('computer') ||
                    actualFieldLower.includes('cs') ||
                    actualFieldLower.includes('software');
    } else if (filterFieldLower === 'machine learning') {
      fieldMatches = actualFieldLower.includes('machine learning') ||
                    actualFieldLower.includes('ml') ||
                    actualFieldLower.includes('deep learning') ||
                    actualFieldLower.includes('ai');
    } else if (filterFieldLower === 'computer vision') {
      fieldMatches = actualFieldLower.includes('computer vision') ||
                    actualFieldLower.includes('cv') ||
                    actualFieldLower.includes('image processing') ||
                    actualFieldLower.includes('vision');
    } else if (filterFieldLower === 'nlp') {
      fieldMatches = actualFieldLower.includes('nlp') ||
                    actualFieldLower.includes('natural language') ||
                    actualFieldLower.includes('text') ||
                    actualFieldLower.includes('language processing');
    } else if (filterFieldLower === 'related fields') {
      fieldMatches = actualFieldLower.includes('data science') ||
                    actualFieldLower.includes('robotics') ||
                    actualFieldLower.includes('statistics') ||
                    actualFieldLower.includes('mathematics') ||
                    actualFieldLower.includes('electrical') ||
                    actualFieldLower.includes('electronics');
    } else {
      // Default case: simple string matching
      fieldMatches = actualFieldLower.includes(filterFieldLower);
    }
    
    if (!fieldMatches) {
      console.log(`❌ Field of study filter failed: expected "${fieldOfStudy}", got "${education.fieldOfStudy}"`);
      return false;
    }
  }
  
  // Check institute tier (QS ranking based)
  if (instituteTier && instituteTier !== '') {
    const actualTier = education.instituteTier;
    
    // Handle the two tier categories
    if (instituteTier === 'Top Institute (QS <300)') {
      if (actualTier !== 'Top Institute (QS <300)') {
        console.log(`❌ Institute tier filter failed: expected "Top Institute (QS <300)", got "${actualTier}"`);
        return false;
      }
    } else if (instituteTier === 'Other Institute (QS >300)') {
      if (actualTier !== 'Other Institute (QS >300)') {
        console.log(`❌ Institute tier filter failed: expected "Other Institute (QS >300)", got "${actualTier}"`);
        return false;
      }
    }
  }
  
  console.log(`✅ Education filter passed all criteria`);
  return true;
}

/**
 * Check if publications meet filter criteria
 * @param {object} publications - Parsed publications data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether publications meet criteria
 */
function checkPublicationsFilter(publications, filters) {
  const {
    hasTopAIConferences,
    hasOtherAIConferences,
    hasReputableJournals,
    hasOtherJournals,
    minPublications,
    minCitations
  } = filters;
  
  // Check minimum publications
  if (minPublications && minPublications !== '') {
    const minPubs = parseInt(minPublications);
    if (publications.numberOfPublications < minPubs) {
      return false;
    }
  }
  
  // Check minimum citations
  if (minCitations && minCitations !== '') {
    const minCites = parseInt(minCitations);
    if (publications.citations < minCites) {
      return false;
    }
  }
  
  // Check venue quality requirements
  if (hasTopAIConferences && !publications.venueQuality?.hasTopAIConference) {
    return false;
  }
  
  if (hasOtherAIConferences && !publications.venueQuality?.hasOtherAIConference) {
    return false;
  }
  
  if (hasReputableJournals && !publications.venueQuality?.hasReputableJournal) {
    return false;
  }
  
  if (hasOtherJournals && !publications.venueQuality?.hasOtherPeerReviewed) {
    return false;
  }
  
  return true;
}

/**
 * Check if patents meet filter criteria
 * @param {object} patents - Parsed patents data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether patents meet criteria
 */
function checkPatentsFilter(patents, filters) {
  const {
    grantedFirstInventor,
    grantedCoInventor,
    filedPatent,
    significantContribution
  } = filters;
  
  if (grantedFirstInventor && !patents.grantedFirstInventor) {
    return false;
  }
  
  if (grantedCoInventor && !patents.grantedCoInventor) {
    return false;
  }
  
  if (filedPatent && !patents.filedPatent) {
    return false;
  }
  
  if (significantContribution && !patents.significantContribution) {
    return false;
  }
  
  return true;
}

/**
 * Check if GitHub meets filter criteria
 * @param {object} github - Parsed GitHub data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether GitHub meets criteria
 */
function checkGitHubFilter(github, filters) {
  // Add GitHub-specific filter criteria here if needed
  // For now, just return true since no GitHub filters are defined in the UI
  return true;
}

/**
 * Check if work experience meets filter criteria
 * @param {object} workExperience - Parsed work experience data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether work experience meets criteria
 */
function checkExperienceFilter(workExperience, filters) {
  const { experienceBracket, minHIndex } = filters;
  
  // Check experience bracket
  if (experienceBracket && experienceBracket !== '') {
    if (workExperience.experienceBracket !== experienceBracket) {
      return false;
    }
  }
  
  // Check minimum H-index (if available in publications data)
  if (minHIndex && minHIndex !== '') {
    const minH = parseInt(minHIndex);
    // This would be checked in publications, not work experience
    // Keeping here for completeness
  }
  
  return true;
}

/**
 * Parse and filter a single LinkedIn profile following the evaluation.js pattern
 * @param {object} profileInfo - Profile info from search
 * @param {object} filters - Filter criteria
 * @returns {Promise<object|null>} Parsed profile or null if filtered out
 */
async function parseAndFilterProfile(profileInfo, filters) {
  const { username, url, title, snippet } = profileInfo;
  
  console.log(`🔍 Processing profile: ${username}`);
  
  const results = {
    username,
    url,
    title,
    snippet,
    profileName: null,
    parsing: {},
    passedFilters: [],
    errors: []
  };

  try {
    // Step 1: Fetch LinkedIn profile
    console.log(`📱 Step 1: Fetching LinkedIn profile: ${username}`);
    let profileResult;
    let linkedInProfile;
    
    try {
      profileResult = await fetchLinkedInProfile(username);
      if (!profileResult || !profileResult.success || profileResult.error) {
        console.log(`❌ Failed to fetch LinkedIn profile for ${username}: ${profileResult?.error || 'Unknown error'}`);
        return null;
      }
      
      // Extract and format the LinkedIn profile data
      const rawProfileData = profileResult.data;
      if (!rawProfileData) {
        console.log(`❌ No LinkedIn data found for ${username}`);
        return null;
      }
      
      linkedInProfile = formatLinkedInProfile(rawProfileData);
      results.profileName = linkedInProfile.full_name || 'Unknown';
      let researcherName = linkedInProfile.full_name || 'Unknown Researcher';
      
      console.log(`✅ LinkedIn profile fetched: ${researcherName}`);
      
    } catch (error) {
      console.log(`❌ LinkedIn fetching failed for ${username}: ${error.message}`);
      return null;
    }

    // Step 2: Parse and check education
    console.log(`📚 Step 2: Parsing Education for ${username}...`);
    try {
      const education = await parseEducation(linkedInProfile);
      results.parsing.education = education;
      
      if (education.name && education.name !== 'Unknown') {
        researcherName = education.name;
        results.profileName = education.name;
      }
      
      console.log(`✅ Education parsed: ${education.degree || 'N/A'} from ${education.institute || 'N/A'}`);
      
      // Filter check: Education
      if (!checkEducationFilter(education, filters)) {
        console.log(`❌ ${username} filtered out: Education doesn't match criteria`);
        return null;
      }
      
      results.passedFilters.push('education');
      
    } catch (error) {
      console.log(`⚠️ Education parsing failed for ${username}: ${error.message}`);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: researcherName };
    }

    // Step 3: Parse and check publications
    console.log(`📄 Step 3: Parsing Publications for ${username}...`);
    try {
      const publications = await parsePublications({
        name: researcherName,
        education: results.parsing.education,
        profileData: linkedInProfile
      });
      results.parsing.publications = publications;
      
      console.log(`✅ Publications parsed: ${publications.numberOfPublications} papers, ${publications.citations} citations`);
      
      // Filter check: Publications
      if (!checkPublicationsFilter(publications, filters)) {
        console.log(`❌ ${username} filtered out: Publications don't match criteria`);
        return null;
      }
      
      results.passedFilters.push('publications');
      
    } catch (error) {
      console.log(`⚠️ Publications parsing failed for ${username}: ${error.message}`);
      results.errors.push(`Publications: ${error.message}`);
      results.parsing.publications = { numberOfPublications: 0, citations: 0, hIndex: 0 };
    }

    // Step 4: Parse and check patents
    console.log(`🔬 Step 4: Parsing Patents for ${username}...`);
    try {
      const patents = await parsePatents({
        name: researcherName,
        education: results.parsing.education,
        profileData: linkedInProfile
      });
      results.parsing.patents = patents;
      
      console.log(`✅ Patents parsed: ${patents.grantedFirstInventor} granted (first inventor)`);
      
      // Filter check: Patents
      if (!checkPatentsFilter(patents, filters)) {
        console.log(`❌ ${username} filtered out: Patents don't match criteria`);
        return null;
      }
      
      results.passedFilters.push('patents');
      
    } catch (error) {
      console.log(`⚠️ Patents parsing failed for ${username}: ${error.message}`);
      results.errors.push(`Patents: ${error.message}`);
      results.parsing.patents = { grantedFirstInventor: false, grantedCoInventor: false, filedPatent: false };
    }

    // Step 5: Parse and check GitHub
    console.log(`💻 Step 5: Parsing GitHub for ${username}...`);
    try {
      const gitHubInput = {
        name: researcherName,
        education: results.parsing.education,
        profileData: linkedInProfile
      };
      
      // Add GitHub username from LinkedIn profile if available
      if (linkedInProfile.github_username) {
        gitHubInput.githubUsername = linkedInProfile.github_username;
        console.log(`🔗 Using GitHub username from LinkedIn: ${linkedInProfile.github_username}`);
      }
      
      const github = await parseGitHub(gitHubInput);
      results.parsing.github = github;
      
      console.log(`✅ GitHub parsed: ${github.githubUsername || 'No profile found'}`);
      
      // Filter check: GitHub
      if (!checkGitHubFilter(github, filters)) {
        console.log(`❌ ${username} filtered out: GitHub doesn't match criteria`);
        return null;
      }
      
      results.passedFilters.push('github');
      
    } catch (error) {
      console.log(`⚠️ GitHub parsing failed for ${username}: ${error.message}`);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = { githubUsername: null, repoVolume: 0, popularity: 0 };
    }

    // Step 6: Parse and check work experience
    console.log(`💼 Step 6: Parsing Work Experience for ${username}...`);
    try {
      const workExperience = await parseWorkExperience({
        name: researcherName,
        profileData: linkedInProfile,
        publications: results.parsing.publications.articles,
        info: results.parsing.publications.author,
        github: results.parsing.github
      });
      results.parsing.workExperience = workExperience;
      
      console.log(`✅ Work experience parsed: top AI orgs: ${workExperience.topAIOrganizations}`);
      
      // Filter check: Work Experience
      if (!checkExperienceFilter(workExperience, filters)) {
        console.log(`❌ ${username} filtered out: Work experience doesn't match criteria`);
        return null;
      }
      
      results.passedFilters.push('workExperience');
      
    } catch (error) {
      console.log(`⚠️ Work experience parsing failed for ${username}: ${error.message}`);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = { topAIOrganizations: false, impactQuality: 1, mentorshipRole: false };
    }

    console.log(`✅ ${username} passed all filters: ${results.passedFilters.join(', ')}`);
    return results;
    
  } catch (error) {
    console.error(`❌ Error processing profile ${username}:`, error.message);
    return null;
  }
}

/**
 * Main profile search function
 * @param {object} filters - All filter criteria from UI
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
async function profileSearch(filters, options = {}) {
  const {
    maxProfiles = 20,
    maxSearchResults = 50,
    skipCachedProfiles = false
  } = options;
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting comprehensive profile search with filters:', filters);
    
    // Step 1: Search for LinkedIn profiles using SerpAPI
    const linkedInProfiles = await searchLinkedInProfiles(filters, maxSearchResults);
    
    if (linkedInProfiles.length === 0) {
      return {
        success: true,
        profiles: [],
        summary: {
          searchResults: 0,
          profilesProcessed: 0,
          profilesPassed: 0,
          processingTime: Date.now() - startTime
        }
      };
    }
    
    // Step 2: Parse and filter each profile using comprehensive evaluation
    const validProfiles = [];
    const maxToProcess = Math.min(linkedInProfiles.length, maxProfiles * 3); // Process more to get enough valid ones
    
    console.log(`📋 Processing ${maxToProcess} profiles with comprehensive parsing...`);
    
    for (let i = 0; i < maxToProcess && validProfiles.length < maxProfiles; i++) {
      const profileInfo = linkedInProfiles[i];
      
      try {
        console.log(`\n--- Processing Profile ${i + 1}/${maxToProcess}: ${profileInfo.username} ---`);
        
        const parsedProfile = await parseAndFilterProfile(profileInfo, filters);
        
        if (parsedProfile) {
          validProfiles.push(parsedProfile);
          console.log(`✅ Profile ${validProfiles.length}/${maxProfiles} added: ${parsedProfile.profileName} (${parsedProfile.username})`);
        }
        
        // Add delay to avoid overwhelming APIs and respect rate limits
        if (i < maxToProcess - 1) {
          console.log('⏳ Waiting 2 seconds before next profile...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Failed to process profile ${profileInfo.username}:`, error.message);
        continue;
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`\n🎯 Profile search completed successfully!`);
    console.log(`📊 Results: ${validProfiles.length} valid profiles found out of ${maxToProcess} processed`);
    console.log(`⏱️ Total processing time: ${Math.round(processingTime / 1000)} seconds`);
    
    return {
      success: true,
      profiles: validProfiles,
      summary: {
        searchResults: linkedInProfiles.length,
        profilesProcessed: maxToProcess,
        profilesPassed: validProfiles.length,
        processingTime: processingTime,
        filters: filters,
        averageTimePerProfile: Math.round(processingTime / maxToProcess)
      }
    };
    
  } catch (error) {
    console.error('❌ Profile search failed:', error);
    return {
      success: false,
      error: error.message,
      profiles: [],
      summary: {
        searchResults: 0,
        profilesProcessed: 0,
        profilesPassed: 0,
        processingTime: Date.now() - startTime
      }
    };
  }
}

module.exports = {
  profileSearch,
  searchLinkedInProfiles,
  parseAndFilterProfile,
  buildLinkedInSearchQuery,
  extractLinkedInUsername,
  checkEducationFilter,
  checkPublicationsFilter,
  checkPatentsFilter,
  checkGitHubFilter,
  checkExperienceFilter
}; 