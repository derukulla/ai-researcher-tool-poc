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

// =============================================================================
// PARALLEL PROCESSING FUNCTIONS
// =============================================================================

/**
 * Process multiple profiles in parallel with batching and rate limiting
 * @param {Array} profiles - Array of profile objects
 * @param {Function} processingFunction - Function to process each profile
 * @param {object} options - Processing options
 * @returns {Promise<Array>} Array of results
 */
async function processProfilesInParallel(profiles, processingFunction, options = {}) {
  const {
    batchSize = 5,  // Process 5 profiles at a time to avoid overwhelming APIs
    delayBetweenBatches = 2000,  // 2 second delay between batches
    maxRetries = 2,
    timeoutPerProfile = 60000  // 60 seconds timeout per profile
  } = options;

  console.log(`🔄 Processing ${profiles.length} profiles in parallel (batch size: ${batchSize})`);
  
  const results = [];
  const errors = [];

  // Process profiles in batches
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(profiles.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} profiles)`);
    
    // Process current batch in parallel
    const batchPromises = batch.map(async (profile, index) => {
      const globalIndex = i + index;
      try {
        // Add timeout to each profile processing
        const result = await Promise.race([
          processingFunction(profile, globalIndex),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile processing timeout')), timeoutPerProfile)
          )
        ]);
        
        return { success: true, data: result, index: globalIndex, profileId: profile.username || profile.linkedinId || `profile_${globalIndex}` };
      } catch (error) {
        console.error(`❌ Error processing profile ${globalIndex}:`, error.message);
        errors.push({ index: globalIndex, profileId: profile.username || profile.linkedinId || `profile_${globalIndex}`, error: error.message });
        return { success: false, error: error.message, index: globalIndex, profileId: profile.username || profile.linkedinId || `profile_${globalIndex}` };
      }
    });

    // Wait for all profiles in current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < profiles.length) {
      console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  const successfulResults = results.filter(r => r.success).map(r => r.data);
  console.log(`✅ Parallel processing complete: ${successfulResults.length}/${profiles.length} successful`);
  
  if (errors.length > 0) {
    console.log(`⚠️ Errors encountered: ${errors.length}`);
    errors.forEach(error => {
      console.log(`   - ${error.profileId}: ${error.error}`);
    });
  }

  return successfulResults;
}

/**
 * Fetch multiple LinkedIn profiles in parallel
 * @param {Array} profileInfos - Array of profile info objects
 * @returns {Promise<Array>} Array of successful profile fetches
 */
async function fetchLinkedInProfilesParallel(profileInfos) {
  console.log(`📱 Fetching ${profileInfos.length} LinkedIn profiles in parallel...`);
  
  const fetchFunction = async (profileInfo, index) => {
    const { username } = profileInfo;
    console.log(`📱 [${index + 1}] Fetching LinkedIn profile: ${username}`);
    
    const profileResult = await fetchLinkedInProfile(username);
    
    if (!profileResult || !profileResult.success || profileResult.error) {
      throw new Error(`Failed to fetch LinkedIn profile: ${profileResult?.error || 'Unknown error'}`);
    }

    const rawProfileData = profileResult.data;
    if (!rawProfileData) {
      throw new Error('No LinkedIn data found');
    }

    const linkedInProfile = formatLinkedInProfile(rawProfileData);
    const researcherName = linkedInProfile.full_name || 'Unknown Researcher';
    
    console.log(`✅ [${index + 1}] LinkedIn profile fetched: ${researcherName}`);
    
    return {
      ...profileInfo,
      linkedInProfile,
      researcherName,
      rawProfileData
    };
  };

  return await processProfilesInParallel(profileInfos, fetchFunction, {
    batchSize: 8,  // LinkedIn API can handle more concurrent requests
    delayBetweenBatches: 1000  // Shorter delay for LinkedIn fetching
  });
}

/**
 * Parse education for multiple profiles in parallel
 * @param {Array} profiles - Array of profiles with LinkedIn data
 * @returns {Promise<Array>} Array of profiles with education data
 */
async function parseEducationParallel(profiles) {
  console.log(`🎓 Parsing education for ${profiles.length} profiles in parallel...`);
  
  const parseFunction = async (profile, index) => {
    console.log(`🎓 [${index + 1}] Parsing education for: ${profile.researcherName}`);
    
    const education = await parseEducation(profile.linkedInProfile);
    
    // Update researcher name if education parsing found a better name
    let researcherName = profile.researcherName;
    if (education.name && education.name !== 'Unknown') {
      researcherName = education.name;
    }
    
    console.log(`✅ [${index + 1}] Education parsed: ${education.degree || 'N/A'} from ${education.institute || 'N/A'}`);
    
    return {
      ...profile,
      researcherName,
      education
    };
  };

  return await processProfilesInParallel(profiles, parseFunction);
}

/**
 * Parse publications for multiple profiles in parallel
 * @param {Array} profiles - Array of profiles with education data
 * @returns {Promise<Array>} Array of profiles with publications data
 */
async function parsePublicationsParallel(profiles) {
  console.log(`📚 Parsing publications for ${profiles.length} profiles in parallel...`);
  
  const parseFunction = async (profile, index) => {
    console.log(`📚 [${index + 1}] Parsing publications for: ${profile.researcherName}`);
    
    const publications = await parsePublications({
      name: profile.researcherName,
      education: profile.education,
      profileData: profile.linkedInProfile
    });
    
    console.log(`✅ [${index + 1}] Publications parsed: ${publications.numberOfPublications} papers, ${publications.citations} citations`);
    
    return {
      ...profile,
      publications
    };
  };

  return await processProfilesInParallel(profiles, parseFunction, {
    batchSize: 3,  // Smaller batches for SerpAPI to avoid rate limits
    delayBetweenBatches: 3000  // Longer delay for API-heavy operations
  });
}

/**
 * Parse patents for multiple profiles in parallel
 * @param {Array} profiles - Array of profiles with publications data
 * @returns {Promise<Array>} Array of profiles with patents data
 */
async function parsePatentsParallel(profiles) {
  console.log(`🔬 Parsing patents for ${profiles.length} profiles in parallel...`);
  
  const parseFunction = async (profile, index) => {
    console.log(`🔬 [${index + 1}] Parsing patents for: ${profile.researcherName}`);
    
    const patents = await parsePatents({
      name: profile.researcherName,
      education: profile.education,
      profileData: profile.linkedInProfile
    });
    
    console.log(`✅ [${index + 1}] Patents parsed: ${patents.grantedFirstInventor} granted (first inventor)`);
    
    return {
      ...profile,
      patents
    };
  };

  return await processProfilesInParallel(profiles, parseFunction, {
    batchSize: 3,  // Smaller batches for SerpAPI
    delayBetweenBatches: 3000
  });
}

/**
 * Parse GitHub for multiple profiles in parallel
 * @param {Array} profiles - Array of profiles with patents data
 * @returns {Promise<Array>} Array of profiles with GitHub data
 */
async function parseGitHubParallel(profiles) {
  console.log(`💻 Parsing GitHub for ${profiles.length} profiles in parallel...`);
  
  const parseFunction = async (profile, index) => {
    console.log(`💻 [${index + 1}] Parsing GitHub for: ${profile.researcherName}`);
    
    const gitHubInput = {
      name: profile.researcherName,
      education: profile.education,
      profileData: profile.linkedInProfile
    };
    
    // Add GitHub username from LinkedIn profile if available
    if (profile.linkedInProfile.github_username) {
      gitHubInput.githubUsername = profile.linkedInProfile.github_username;
      console.log(`🔗 [${index + 1}] Using GitHub username from LinkedIn: ${profile.linkedInProfile.github_username}`);
    }
    
    const github = await parseGitHub(gitHubInput);
    
    console.log(`✅ [${index + 1}] GitHub parsed: ${github.githubUsername || 'No profile found'}`);
    
    return {
      ...profile,
      github
    };
  };

  return await processProfilesInParallel(profiles, parseFunction, {
    batchSize: 4,  // GitHub API can handle moderate concurrent requests
    delayBetweenBatches: 2000
  });
}

/**
 * Parse work experience for multiple profiles in parallel
 * @param {Array} profiles - Array of profiles with GitHub data
 * @returns {Promise<Array>} Array of profiles with work experience data
 */
async function parseWorkExperienceParallel(profiles) {
  console.log(`💼 Parsing work experience for ${profiles.length} profiles in parallel...`);
  
  const parseFunction = async (profile, index) => {
    console.log(`💼 [${index + 1}] Parsing work experience for: ${profile.researcherName}`);
    
    const workExperience = await parseWorkExperience({
      name: profile.researcherName,
      profileData: profile.linkedInProfile,
      publications: profile.publications.articles,
      info: profile.publications.author,
      github: profile.github
    });
    
    console.log(`✅ [${index + 1}] Work experience parsed: top AI orgs: ${workExperience.topAIOrganizations}`);
    
    return {
      ...profile,
      workExperience
    };
  };

  return await processProfilesInParallel(profiles, parseFunction);
}

// =============================================================================
// FILTERING FUNCTIONS
// =============================================================================

/**
 * Apply education filter to profiles
 * @param {Array} profiles - Array of profiles with education data
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered profiles
 */
function applyEducationFilter(profiles, filters) {
  console.log(`🎓 Applying education filter to ${profiles.length} profiles...`);
  
  const filteredProfiles = profiles.filter(profile => {
    const passed = checkEducationFilter(profile.education, filters);
    if (!passed) {
      console.log(`❌ ${profile.researcherName} (${profile.username}) filtered out: Education doesn't match criteria`);
    }
    return passed;
  });
  
  console.log(`✅ Education filter: ${filteredProfiles.length}/${profiles.length} profiles passed`);
  return filteredProfiles;
}

/**
 * Apply publications filter to profiles
 * @param {Array} profiles - Array of profiles with publications data
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered profiles
 */
function applyPublicationsFilter(profiles, filters) {
  console.log(`📚 Applying publications filter to ${profiles.length} profiles...`);
  
  const filteredProfiles = profiles.filter(profile => {
    const passed = checkPublicationsFilter(profile.publications, filters);
    if (!passed) {
      console.log(`❌ ${profile.researcherName} (${profile.username}) filtered out: Publications don't match criteria`);
    }
    return passed;
  });
  
  console.log(`✅ Publications filter: ${filteredProfiles.length}/${profiles.length} profiles passed`);
  return filteredProfiles;
}

/**
 * Apply patents filter to profiles
 * @param {Array} profiles - Array of profiles with patents data
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered profiles
 */
function applyPatentsFilter(profiles, filters) {
  console.log(`🔬 Applying patents filter to ${profiles.length} profiles...`);
  
  const filteredProfiles = profiles.filter(profile => {
    const passed = checkPatentsFilter(profile.patents, filters);
    if (!passed) {
      console.log(`❌ ${profile.researcherName} (${profile.username}) filtered out: Patents don't match criteria`);
    }
    return passed;
  });
  
  console.log(`✅ Patents filter: ${filteredProfiles.length}/${profiles.length} profiles passed`);
  return filteredProfiles;
}

/**
 * Apply GitHub filter to profiles
 * @param {Array} profiles - Array of profiles with GitHub data
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered profiles
 */
function applyGitHubFilter(profiles, filters) {
  console.log(`💻 Applying GitHub filter to ${profiles.length} profiles...`);
  
  const filteredProfiles = profiles.filter(profile => {
    const passed = checkGitHubFilter(profile.github, filters);
    if (!passed) {
      console.log(`❌ ${profile.researcherName} (${profile.username}) filtered out: GitHub doesn't match criteria`);
    }
    return passed;
  });
  
  console.log(`✅ GitHub filter: ${filteredProfiles.length}/${profiles.length} profiles passed`);
  return filteredProfiles;
}

/**
 * Apply work experience filter to profiles
 * @param {Array} profiles - Array of profiles with work experience data
 * @param {object} filters - Filter criteria
 * @returns {Array} Filtered profiles
 */
function applyWorkExperienceFilter(profiles, filters) {
  console.log(`💼 Applying work experience filter to ${profiles.length} profiles...`);
  
  const filteredProfiles = profiles.filter(profile => {
    const passed = checkExperienceFilter(profile.workExperience, filters);
    if (!passed) {
      console.log(`❌ ${profile.researcherName} (${profile.username}) filtered out: Work experience doesn't match criteria`);
    }
    return passed;
  });
  
  console.log(`✅ Work experience filter: ${filteredProfiles.length}/${profiles.length} profiles passed`);
  return filteredProfiles;
}

// =============================================================================
// MAIN PARALLEL PROCESSING FUNCTION
// =============================================================================

/**
 * Main profile search function with parallel processing
 * @param {object} filters - All filter criteria from UI
 * @param {object} options - Search options
 * @returns {Promise<object>} Search results
 */
async function profileSearchParallel(filters, options = {}) {
  const {
    maxProfiles = 20,
    maxSearchResults = 50,
    skipCachedProfiles = false
  } = options;
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting PARALLEL profile search with filters:', filters);
    console.log('⚡ Using parallel processing for maximum speed!');
    
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
    
    const maxToProcess = Math.min(linkedInProfiles.length, maxProfiles * 3);
    const profilesToProcess = linkedInProfiles.slice(0, maxToProcess);
    
    console.log(`📋 Processing ${profilesToProcess.length} profiles with PARALLEL parsing...`);
    
    let currentProfiles = profilesToProcess;
    let stageStartTime = Date.now();
    
    // Stage 1: Fetch LinkedIn profiles in parallel
    console.log(`\n🏁 STAGE 1: Fetching LinkedIn profiles...`);
    currentProfiles = await fetchLinkedInProfilesParallel(currentProfiles);
    console.log(`⏱️ Stage 1 completed in ${Math.round((Date.now() - stageStartTime) / 1000)}s`);
    
    if (currentProfiles.length === 0) {
      console.log('❌ No LinkedIn profiles could be fetched');
      return {
        success: true,
        profiles: [],
        summary: {
          searchResults: linkedInProfiles.length,
          profilesProcessed: profilesToProcess.length,
          profilesPassed: 0,
          processingTime: Date.now() - startTime,
          stageResults: {
            linkedInFetched: profilesWithEducation.length,
            educationPassed: 0
          }
        }
      };
    }
    
    // Stage 2: Parse education in parallel → Apply education filter
    console.log(`\n🏁 STAGE 2: Education parsing and filtering...`);
    stageStartTime = Date.now();
    let profilesWithEducation = await parseEducationParallel(currentProfiles);
    currentProfiles = applyEducationFilter(profilesWithEducation, filters);
    console.log(`⏱️ Stage 2 completed in ${Math.round((Date.now() - stageStartTime) / 1000)}s`);
    
    if (currentProfiles.length === 0) {
      console.log('❌ No profiles passed education filter');
      return {
        success: true,
        profiles: [],
        summary: {
          searchResults: linkedInProfiles.length,
          profilesProcessed: profilesToProcess.length,
          profilesPassed: 0,
          processingTime: Date.now() - startTime,
          stageResults: {
            linkedInFetched: profilesWithEducation.length,
            educationPassed: 0
          }
        }
      };
    }
    
    // Stage 3: Parse publications in parallel → Apply publications filter
    console.log(`\n🏁 STAGE 3: Publications parsing and filtering...`);
    stageStartTime = Date.now();
    let profilesWithPublications = await parsePublicationsParallel(currentProfiles);
    currentProfiles = applyPublicationsFilter(profilesWithPublications, filters);
    console.log(`⏱️ Stage 3 completed in ${Math.round((Date.now() - stageStartTime) / 1000)}s`);
    
    if (currentProfiles.length === 0) {
      console.log('❌ No profiles passed publications filter');
      return {
        success: true,
        profiles: [],
        summary: {
          searchResults: linkedInProfiles.length,
          profilesProcessed: profilesToProcess.length,
          profilesPassed: 0,
          processingTime: Date.now() - startTime,
          stageResults: {
            linkedInFetched: profilesWithEducation.length,
            educationPassed: profilesWithPublications.length,
            publicationsPassed: 0
          }
        }
      };
    }
    
    // Stage 4: Parse patents in parallel → Apply patents filter
    console.log(`\n🏁 STAGE 4: Patents parsing and filtering...`);
    stageStartTime = Date.now();
    let profilesWithPatents = await parsePatentsParallel(currentProfiles);
    currentProfiles = applyPatentsFilter(profilesWithPatents, filters);
    console.log(`⏱️ Stage 4 completed in ${Math.round((Date.now() - stageStartTime) / 1000)}s`);
    
    if (currentProfiles.length === 0) {
      console.log('❌ No profiles passed patents filter');
      return {
        success: true,
        profiles: [],
        summary: {
          searchResults: linkedInProfiles.length,
          profilesProcessed: profilesToProcess.length,
          profilesPassed: 0,
          processingTime: Date.now() - startTime,
          stageResults: {
            linkedInFetched: profilesWithEducation.length,
            educationPassed: profilesWithPublications.length,
            publicationsPassed: profilesWithPatents.length,
            patentsPassed: 0
          }
        }
      };
    }
    
    // Stage 5: Parse GitHub in parallel → Apply GitHub filter
    console.log(`\n🏁 STAGE 5: GitHub parsing and filtering...`);
    stageStartTime = Date.now();
    let profilesWithGitHub = await parseGitHubParallel(currentProfiles);
    currentProfiles = applyGitHubFilter(profilesWithGitHub, filters);
    console.log(`⏱️ Stage 5 completed in ${Math.round((Date.now() - stageStartTime) / 1000)}s`);
    
    if (currentProfiles.length === 0) {
      console.log('❌ No profiles passed GitHub filter');
      return {
        success: true,
        profiles: [],
        summary: {
          searchResults: linkedInProfiles.length,
          profilesProcessed: profilesToProcess.length,
          profilesPassed: 0,
          processingTime: Date.now() - startTime,
          stageResults: {
            linkedInFetched: profilesWithEducation.length,
            educationPassed: profilesWithPublications.length,
            publicationsPassed: profilesWithPatents.length,
            patentsPassed: profilesWithGitHub.length,
            githubPassed: 0
          }
        }
      };
    }
    
    // Stage 6: Parse work experience in parallel → Apply work experience filter
    console.log(`\n🏁 STAGE 6: Work experience parsing and filtering...`);
    stageStartTime = Date.now();
    let profilesWithWorkExperience = await parseWorkExperienceParallel(currentProfiles);
    currentProfiles = applyWorkExperienceFilter(profilesWithWorkExperience, filters);
    console.log(`⏱️ Stage 6 completed in ${Math.round((Date.now() - stageStartTime) / 1000)}s`);
    
    // Limit to requested number of profiles
    const finalProfiles = currentProfiles.slice(0, maxProfiles);
    
    // Convert to the expected format for the frontend
    const formattedProfiles = finalProfiles.map(profile => ({
      username: profile.username,
      url: profile.url,
      title: profile.title,
      snippet: profile.snippet,
      profileName: profile.researcherName,
      parsing: {
        education: profile.education,
        publications: profile.publications,
        patents: profile.patents,
        github: profile.github,
        workExperience: profile.workExperience
      },
      passedFilters: ['education', 'publications', 'patents', 'github', 'workExperience'],
      errors: []
    }));
    
    const processingTime = Date.now() - startTime;
    
    console.log(`\n🎯 PARALLEL profile search completed successfully!`);
    console.log(`⚡ SPEED IMPROVEMENT: Parallel processing vs sequential!`);
    console.log(`📊 Results: ${finalProfiles.length} valid profiles found`);
    console.log(`⏱️ Total processing time: ${Math.round(processingTime / 1000)} seconds`);
    console.log(`🚀 Average time per profile: ${Math.round(processingTime / profilesToProcess.length)}ms`);
    
    return {
      success: true,
      profiles: formattedProfiles,
      summary: {
        searchResults: linkedInProfiles.length,
        profilesProcessed: profilesToProcess.length,
        profilesPassed: finalProfiles.length,
        processingTime: processingTime,
        filters: filters,
        averageTimePerProfile: Math.round(processingTime / profilesToProcess.length),
        stageResults: {
          linkedInFetched: profilesWithEducation.length,
          educationPassed: profilesWithPublications.length,
          publicationsPassed: profilesWithPatents.length,
          patentsPassed: profilesWithGitHub.length,
          githubPassed: profilesWithWorkExperience.length,
          finalPassed: finalProfiles.length
        },
        processingMethod: 'parallel'
      }
    };
    
  } catch (error) {
    console.error('❌ Error in parallel profile search:', error);
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

// =============================================================================
// ORIGINAL FUNCTIONS (keeping for compatibility)
// =============================================================================

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
 * Search for LinkedIn profiles using SerpAPI with education filters
 * @param {object} filters - Filter criteria
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of LinkedIn profile info
 */
async function searchLinkedInProfiles(filters, maxResults = 50) {
  try {
    console.log('🔍 Searching LinkedIn profiles with SerpAPI...');
    
    // Build search query based on filters
    let searchQuery = 'site:linkedin.com/in/ ';
    
    // Add education filters to search query
    if (filters.education && filters.education.enabled) {
      if (filters.education.degree) {
        searchQuery += `"${filters.education.degree}" `;
      }
      if (filters.education.fieldOfStudy) {
        searchQuery += `"${filters.education.fieldOfStudy}" `;
      }
      if (filters.education.institute) {
        searchQuery += `"${filters.education.institute}" `;
      }
    }
    
    // Add general AI/ML keywords
    searchQuery += '"AI" OR "Machine Learning" OR "Artificial Intelligence" OR "Deep Learning" OR "Data Science"';
    
    console.log(`🔍 Search query: ${searchQuery}`);
    
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: searchQuery,
        num: maxResults,
        api_key: SERPAPI_KEY
      },
      timeout: 30000
    });

    const organicResults = response.data.organic_results || [];
    
    // Extract LinkedIn profile information
    const linkedInProfiles = organicResults
      .filter(result => result.link && result.link.includes('linkedin.com/in/'))
      .map(result => {
        const urlMatch = result.link.match(/linkedin\.com\/in\/([^\/\?]+)/);
        const username = urlMatch ? urlMatch[1] : null;
        
        if (!username) return null;
        
        return {
          username,
          url: result.link,
          title: result.title,
          snippet: result.snippet || ''
        };
      })
      .filter(Boolean);

    console.log(`📊 Found ${linkedInProfiles.length} LinkedIn profiles from search`);
    return linkedInProfiles;
    
  } catch (error) {
    console.error('❌ Error searching LinkedIn profiles:', error.message);
    return [];
  }
}

// =============================================================================
// FILTER CHECK FUNCTIONS
// =============================================================================

/**
 * Check if education meets filter criteria
 * @param {object} education - Education data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether education passes filter
 */
function checkEducationFilter(education, filters) {

  const filter = filters;

  // Check degree requirement
  if (filter.degree && education.degree) {
    const expectedDegree = filter.degree.toLowerCase();
    const actualDegree = education.degree.toLowerCase();
    
    if (expectedDegree.includes('phd') && !actualDegree.includes('phd')) {
      return false;
    }
    if (expectedDegree.includes('master') && !actualDegree.includes('master') && !actualDegree.includes('m.')) {
      return false;
    }
    if (expectedDegree.includes('bachelor') && !actualDegree.includes('bachelor') && !actualDegree.includes('b.')) {
      return false;
    }
  }

  // Check field of study
  if (filter.fieldOfStudy && education.fieldOfStudy) {
    const filterFieldLower = filter.fieldOfStudy.toLowerCase();
    const actualFieldLower = education.fieldOfStudy.toLowerCase();
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
        return false;
    }
  }

  // Check institute tier requirement (QS ranking based)
  if (filter.instituteTier && education.instituteTier) {
    const expectedTier = filter.instituteTier;
    const actualTier = education.instituteTier;
    
    console.log(`🔍 Institute filter: expected "${expectedTier}", got "${actualTier}"`);
    
    // Handle the two tier categories
    if (expectedTier === 'Top Institute (QS <300)') {
      if (!actualTier.includes('<300')) {
        console.log(`❌ Institute tier filter failed: expected "Top Institute (QS <300)", got "${actualTier}"`);
        return false;
      }
    } else if (expectedTier === 'Other Institute (QS >300)') {
      if (!actualTier.includes('>300')) {
        console.log(`❌ Institute tier filter failed: expected "Other Institute (QS >300)", got "${actualTier}"`);
        return false;
      }
    } else {
      // Exact match for other tier specifications
      if (actualTier !== expectedTier) {
        console.log(`❌ Institute tier filter failed: expected "${expectedTier}", got "${actualTier}"`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if publications meet filter criteria
 * @param {object} publications - Publications data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether publications pass filter
 */
function checkPublicationsFilter(publications, filters) {

  const filter = filters.publications;

  // Check minimum publications
  if (filter.minPublications && publications.numberOfPublications < filter.minPublications) {
    return false;
  }

  // Check minimum citations
  if (filter.minCitations && publications.citations < filter.minCitations) {
    return false;
  }

  // Check h-index
  if (filter.minHIndex && publications.hIndex < filter.minHIndex) {
    return false;
  }

  // Check venue quality
  if (filter.hasTopAIConferences && !publications.venueQuality?.hasTopAIConference) {
    return false;
  }

  if (filter.hasOtherAIConferences && !publications.venueQuality?.hasOtherAIConference) {
    return false;
  }
  
  if (filter.hasReputableJournals && !publications.venueQuality?.hasReputableJournal) {
    return false;
  }
  
  if (filter.hasOtherJournals && !publications.venueQuality?.hasOtherPeerReviewed) {
    return false;
  }

  if (filter.experienceBracket && publications.experienceBracket !== filter.experienceBracket) {
    return false;
  }

  return true;
}

/**
 * Check if patents meet filter criteria
 * @param {object} patents - Patents data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether patents pass filter
 */
function checkPatentsFilter(patents, filters) {
  const filter = filters;

  // Check granted patents requirement
  if (filter.grantedFirstInventor && !patents.grantedFirstInventor) {
    return false;
  }

  if (filter.grantedCoInventor && !(patents.grantedFirstInventor || patents.grantedCoInventor)) {
    return false;
  }

  if (filter.filedPatent && !(patents.grantedFirstInventor || patents.grantedCoInventor || patents.filedPatent)) {
    return false;
  }

  return true;
}

/**
 * Check if GitHub meets filter criteria
 * @param {object} github - GitHub data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether GitHub passes filter
 */
function checkGitHubFilter(github, filters) {
  return true;
}

/**
 * Check if work experience meets filter criteria
 * @param {object} workExperience - Work experience data
 * @param {object} filters - Filter criteria
 * @returns {boolean} Whether work experience passes filter
 */
function checkExperienceFilter(workExperience, filters) {
  
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
 * Main profile search function (original sequential version)
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
        averageTimePerProfile: Math.round(processingTime / maxToProcess),
        processingMethod: 'sequential'
      }
    };
    
  } catch (error) {
    console.error('❌ Error in profile search:', error);
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
  // Main functions
  profileSearch, // Original sequential version
  profileSearchParallel, // New parallel version
  
  // LinkedIn profile functions
  searchLinkedInProfiles,
  fetchLinkedInProfile,
  fetchLinkedInProfilesParallel,
  
  // Individual parsing functions (original)
  parseAndFilterProfile,
  
  // Parallel processing functions
  processProfilesInParallel,
  parseEducationParallel,
  parsePublicationsParallel,
  parsePatentsParallel,
  parseGitHubParallel,
  parseWorkExperienceParallel,
  
  // Filter application functions
  applyEducationFilter,
  applyPublicationsFilter,
  applyPatentsFilter,
  applyGitHubFilter,
  applyWorkExperienceFilter,
  
  // Filter check functions
  checkEducationFilter,
  checkPublicationsFilter,
  checkPatentsFilter,
  checkGitHubFilter,
  checkExperienceFilter
}; 