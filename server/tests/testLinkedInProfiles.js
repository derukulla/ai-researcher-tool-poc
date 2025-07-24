/**
 * LinkedIn Profiles Test - Complete Profile Evaluation
 * Fetches LinkedIn profiles using People Data Labs API and runs the entire AI researcher evaluation pipeline
 */

const axios = require('axios');
const { parseEducation } = require('./utils/aiProfileParser');
const { parsePublications } = require('./utils/publicationsParser');
const { parsePatents } = require('./utils/patentParser');
const { parseWorkExperience } = require('./utils/workExperienceParser');
const { parseGitHub } = require('./utils/githubParser');
const { calculateTotalScore } = require('./utils/scoringEngine');

// =============================================================================
// CONFIGURATION
// =============================================================================

// People Data Labs API configuration
const { PDL_API_KEY } = require('../config/apiKeys');
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5/person/enrich';

// Test LinkedIn IDs (you can modify this list)
const TEST_LINKEDIN_IDS = [
  'reetesh-mukul-5392532',
];

// =============================================================================
// LINKEDIN DATA FETCHING
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
        data: response.data.data,
        error: null
      };
    } else {
      console.log(`⚠️ Profile not found for: ${linkedinId}`);
      return {
        linkedinId,
        success: false,
        data: null,
        error: 'Profile not found'
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching profile for ${linkedinId}:`, error.message);
    return {
      linkedinId,
      success: false,
      data: null,
      error: error.message
    };
  }
}

/**
 * Convert PDL profile data to text format for processing
 * @param {object} profileData - Raw profile data from PDL API
 * @returns {string} Formatted profile text
 */
function formatProfileForProcessing(profileData) {
  if (!profileData) return '';
  
  let profileText = '';
  
  // Basic information
  if (profileData.full_name) {
    profileText += `Name: ${profileData.full_name}\n`;
  }
  
  if (profileData.headline) {
    profileText += `Headline: ${profileData.headline}\n`;
  }
  
  if (profileData.summary) {
    profileText += `Summary: ${profileData.summary}\n`;
  }
  
  // Education
  if (profileData.education && profileData.education.length > 0) {
    profileText += '\nEducation:\n';
    profileData.education.forEach(edu => {
      if (edu.school) {
        profileText += `- ${edu.school}`;
        if (edu.degree) profileText += ` - ${edu.degree}`;
        if (edu.field_of_study) profileText += ` in ${edu.field_of_study}`;
        if (edu.start_date) profileText += ` (${edu.start_date}`;
        if (edu.end_date) profileText += ` - ${edu.end_date})`;
        profileText += '\n';
      }
    });
  }
  
  // Experience
  if (profileData.experience && profileData.experience.length > 0) {
    profileText += '\nWork Experience:\n';
    profileData.experience.forEach(exp => {
      if (exp.company) {
        profileText += `- ${exp.title || 'Position'} at ${exp.company}`;
        if (exp.start_date) profileText += ` (${exp.start_date}`;
        if (exp.end_date) profileText += ` - ${exp.end_date})`;
        profileText += '\n';
        if (exp.summary) profileText += `  ${exp.summary}\n`;
      }
    });
  }
  
  // Skills
  if (profileData.skills && profileData.skills.length > 0) {
    profileText += '\nSkills:\n';
    profileData.skills.forEach(skill => {
      profileText += `- ${skill}\n`;
    });
  }
  
  // Interests
  if (profileData.interests && profileData.interests.length > 0) {
    profileText += '\nInterests:\n';
    profileData.interests.forEach(interest => {
      profileText += `- ${interest}\n`;
    });
  }
  
  return profileText;
}

// =============================================================================
// PROFILE EVALUATION
// =============================================================================

/**
 * Run complete evaluation pipeline for a LinkedIn profile
 * @param {object} profileResult - Profile result from fetchLinkedInProfile
 * @returns {Promise<object>} Complete evaluation results
 */
async function evaluateLinkedInProfile(profileResult) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 EVALUATING LINKEDIN PROFILE: ${profileResult.linkedinId}`);
  console.log(`${'='.repeat(80)}`);

  const results = {
    linkedinId: profileResult.linkedinId,
    profileName: null,
    parsing: {},
    scoring: null,
    errors: []
  };

  if (!profileResult.success) {
    console.log(`❌ Profile fetch failed: ${profileResult.error}`);
    results.errors.push(`Profile fetch: ${profileResult.error}`);
    return results;
  }

  const profileText = profileResult.data;
  
  results.profileName = profileText.full_name || 'Unknown';

  try {
    // Step 1: Parse Education
    console.log('\n📚 Step 1: Parsing Education...');
    let researcherName = profileText.full_name || 'Unknown Researcher';
    try {
      const education = await parseEducation(profileText);
      results.parsing.education = education;
      // Use the extracted name if available, otherwise use PDL name
      if (education.name && education.name !== 'Unknown') {
        researcherName = education.name;
      }
      console.log(`✅ Education parsed: ${education.degree || 'N/A'} from ${education.institute || 'N/A'}`);
      console.log(`   📝 Researcher name: ${researcherName}`);
    } catch (error) {
      console.error('❌ Education parsing failed:', error.message);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: researcherName };
    }

    // Step 2: Parse Publications
    console.log('\n📄 Step 2: Parsing Publications...');
    try {
      const publications = await parsePublications({
        name: researcherName,
        education: results.parsing.education,
        profileData: profileText
      });
      results.parsing.publications = publications;
      console.log(`✅ Publications parsed: ${publications.numberOfPublications} papers, ${publications.citations} citations, H-index: ${publications.hIndex}`);
    } catch (error) {
      console.error('❌ Publications parsing failed:', error.message);
      results.errors.push(`Publications: ${error.message}`);
      results.parsing.publications = { numberOfPublications: 0, citations: 0, hIndex: 0 };
    }

    // Step 3: Parse Patents
    console.log('\n🔬 Step 3: Parsing Patents...');
    try {
      const patents = await parsePatents({
        name: researcherName,
        education: results.parsing.education,
        profileData: profileText
      });
      results.parsing.patents = patents;
      console.log(`✅ Patents parsed: ${patents.grantedFirstInventor} granted (first), ${patents.grantedCoInventor} granted (co), ${patents.filedPatent} filed`);
    } catch (error) {
      console.error('❌ Patents parsing failed:', error.message);
      results.errors.push(`Patents: ${error.message}`);
      results.parsing.patents = { grantedFirstInventor: 0, grantedCoInventor: 0, filedPatent: 0 };
    }

    // Step 4: Parse GitHub
    console.log('\n💻 Step 4: Parsing GitHub...');
    try {
      const github = await parseGitHub({
        name: researcherName,
        education: results.parsing.education,
        profileData: profileText
      });
      results.parsing.github = github;
      if (github.githubUsername) {
        console.log(`✅ GitHub parsed: @${github.githubUsername}, ${github.repoVolume} repos, ${github.popularity} stars`);
      } else {
        console.log(`✅ GitHub parsed: No GitHub profile found`);
      }
    } catch (error) {
      console.error('❌ GitHub parsing failed:', error.message);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = { githubUsername: null, repoVolume: 0, popularity: 0 };
    }

    // Step 5: Parse Work Experience
    console.log('\n💼 Step 5: Parsing Work Experience...');
    try {
      const workExperience = await parseWorkExperience({
        name: researcherName,
        profileData: profileText,
        publications: results.parsing.publications.articles,
        info: results.parsing.publications.author,
        github: results.parsing.github
      });
      results.parsing.workExperience = workExperience;
      console.log(`✅ Work experience parsed: top AI orgs: ${workExperience.topAIOrganizations}, impact quality: ${workExperience.impactQuality}`);
    } catch (error) {
      console.error('❌ Work experience parsing failed:', error.message);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = { topAIOrganizations: false, impactQuality: 1, mentorshipRole: false };
    }

    // Step 6: Calculate Total Score
    console.log('\n🎯 Step 6: Calculating Total Score...');
    try {
      console.log(results.parsing);
      const totalScore = await calculateTotalScore(results.parsing);
      console.log('Total score:', totalScore);
      results.scoring = totalScore;
      console.log(`✅ Total Score: ${totalScore.totalScore}/${totalScore.maxPossibleScore} (${totalScore.percentage.toFixed(1)}%)`);
    } catch (error) {
      console.error('❌ Scoring failed:', error.message);
      results.errors.push(`Scoring: ${error.message}`);
      results.scoring = { totalScore: 0, maxPossibleScore: 100, percentage: 0 };
    }

    // Summary
    console.log(`\n📊 EVALUATION SUMMARY FOR: ${profileResult.linkedinId}`);
    console.log(`👤 Name: ${researcherName}`);
    if (results.scoring) {
      console.log(`🎯 Score: ${results.scoring.totalScore}/${results.scoring.maxPossibleScore} (${results.scoring.percentage.toFixed(1)}%)`);
    }
    if (results.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${results.errors.length}`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Fatal error during evaluation:', error);
    results.errors.push(`Fatal: ${error.message}`);
    return results;
  }
}

// =============================================================================
// MAIN TEST FUNCTION
// =============================================================================

/**
 * Main function to test LinkedIn profiles
 * @param {Array<string>} linkedinIds - Array of LinkedIn IDs to test (optional)
 */
async function testLinkedInProfiles(linkedinIds = TEST_LINKEDIN_IDS) {
  console.log('🚀 Starting LinkedIn Profiles Evaluation Test');
  console.log('=' .repeat(80));
  console.log(`📋 Testing ${linkedinIds.length} LinkedIn profiles`);
  console.log(`🔑 Using API Key: ${PDL_API_KEY.substring(0, 10)}...`);
  
  const allResults = [];
  
  // Process each LinkedIn profile
  for (let i = 0; i < linkedinIds.length; i++) {
    const linkedinId = linkedinIds[i];
    console.log(`\n🔄 Processing LinkedIn profile ${i + 1}/${linkedinIds.length}: ${linkedinId}`);
    
    try {
      // Fetch profile data
      const profileResult = await fetchLinkedInProfile(linkedinId);
      
      // Evaluate the profile
      const results = await evaluateLinkedInProfile(profileResult);
      allResults.push(results);
      
      // Add a delay between evaluations to avoid overwhelming APIs
      if (i < linkedinIds.length - 1) {
        console.log('⏳ Waiting 10 seconds before next profile...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to evaluate ${linkedinId}:`, error);
      allResults.push({
        linkedinId,
        profileName: null,
        parsing: {},
        scoring: null,
        errors: [`Fatal error: ${error.message}`]
      });
    }
  }
  
  // Final Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 FINAL SUMMARY - ALL LINKEDIN PROFILES');
  console.log(`${'='.repeat(80)}`);
  
  allResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.linkedinId} (${result.profileName || 'Unknown'})`);
    console.log(`   Score: ${result.scoring?.totalScore || 0}/${result.scoring?.maxPossibleScore || 100} (${result.scoring?.percentage?.toFixed(1) || 0}%)`);
    console.log(`   Errors: ${result.errors.length}`);
  });
  
  // Sort by score
  const sortedResults = allResults
    .filter(r => r.scoring && r.scoring.totalScore > 0)
    .sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);
  
  if (sortedResults.length > 0) {
    console.log(`\n🏆 TOP PERFORMERS:`);
    sortedResults.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.profileName || result.linkedinId}: ${result.scoring.totalScore} points (${result.scoring.percentage.toFixed(1)}%)`);
    });
  }
  
  console.log(`\n✅ Evaluation completed for ${allResults.length} LinkedIn profiles`);
  console.log(`📊 Average score: ${(allResults.reduce((sum, r) => sum + (r.scoring?.totalScore || 0), 0) / allResults.length).toFixed(1)} points`);
  
  return allResults;
}

// =============================================================================
// SINGLE PROFILE TEST FUNCTION
// =============================================================================

/**
 * Test a single LinkedIn profile
 * @param {string} linkedinId - LinkedIn ID to test
 */
async function testSingleLinkedInProfile(linkedinId) {
  console.log(`🔍 Testing single LinkedIn profile: ${linkedinId}`);
  
  try {
    const profileResult = await fetchLinkedInProfile(linkedinId);
    const results = await evaluateLinkedInProfile(profileResult);
    
    console.log(`\n✅ Single profile evaluation completed`);
    return results;
  } catch (error) {
    console.error(`❌ Single profile test failed:`, error);
    return {
      linkedinId,
      profileName: null,
      parsing: {},
      scoring: null,
      errors: [`Fatal error: ${error.message}`]
    };
  }
}

// =============================================================================
// RUN THE TEST
// =============================================================================

if (require.main === module) {
  // Check if a specific LinkedIn ID was provided as command line argument
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Test specific LinkedIn IDs provided as arguments
    console.log(`🎯 Testing specific LinkedIn profiles: ${args.join(', ')}`);
    testLinkedInProfiles(args).catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
  } else {
    // Test default LinkedIn profiles
    testLinkedInProfiles().catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  testLinkedInProfiles,
  testSingleLinkedInProfile,
  evaluateLinkedInProfile,
  fetchLinkedInProfile,
  formatProfileForProcessing
}; 