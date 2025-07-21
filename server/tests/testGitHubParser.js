/**
 * Test GitHub Parser with AI Matching
 * Tests the complete GitHub profile extraction and analysis system
 */

const { 
  parseGitHub, 
  extractGitHubWithAI, 
  searchGitHubUsers, 
  enhanceGitHubProfiles, 
  matchGitHubProfileWithAI,
  analyzeGitHubProfile,
  getUserRepositories,
  analyzeAIRelevance
} = require('./utils/githubParser');

// =============================================================================
// TEST DATA
// =============================================================================

const testProfiles = [
  {
    name: 'Linus Torvalds',
    description: 'Creator of Linux and Git',
    expectedUsername: 'torvalds'
  },
  {
    name: 'Andrej Karpathy',
    description: 'AI researcher, former Tesla/OpenAI',
    expectedUsername: 'karpathy'
  },
  {
    name: 'François Chollet',
    description: 'Creator of Keras, Google AI',
    expectedUsername: 'fchollet'
  }
];

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test GitHub user search
 */
async function testGitHubSearch() {
  console.log('\n🧪 Testing GitHub User Search...');
  
  try {
    const searchResults = await searchGitHubUsers('Linus Torvalds');
    
    console.log(`📊 Search Results: ${searchResults.length} users found`);
    
    if (searchResults.length > 0) {
      console.log('✅ First result:', {
        login: searchResults[0].login,
        id: searchResults[0].id,
        type: searchResults[0].type
      });
    }
    
    console.log('✅ GitHub search test completed');
    return searchResults;
    
  } catch (error) {
    console.error('❌ GitHub search test failed:', error.message);
    throw error;
  }
}

/**
 * Test repository fetching
 */
async function testRepositoryFetching() {
  console.log('\n🧪 Testing Repository Fetching...');
  
  try {
    const repos = await getUserRepositories('torvalds');
    
    console.log(`📊 Repository Results: ${repos.length} repositories found`);
    
    if (repos.length > 0) {
      console.log('✅ First repository:', {
        name: repos[0].name,
        description: repos[0].description,
        language: repos[0].language,
        stars: repos[0].stargazers_count,
        fork: repos[0].fork
      });
    }
    
    console.log('✅ Repository fetching test completed');
    return repos;
    
  } catch (error) {
    console.error('❌ Repository fetching test failed:', error.message);
    throw error;
  }
}

/**
 * Test AI relevance analysis
 */
async function testAIRelevanceAnalysis() {
  console.log('\n🧪 Testing AI Relevance Analysis...');
  
  try {
    // Get some repositories first
    const repos = await getUserRepositories('karpathy');
    
    if (repos.length === 0) {
      console.log('⚠️ No repositories found for AI analysis test');
      return;
    }
    
    const aiRelevance = await analyzeAIRelevance(repos);
    
    console.log('📊 AI Relevance Analysis Results:');
    console.log(`   Has AI Relevance: ${aiRelevance ? 'Yes' : 'No'}`);
    console.log(`   Repository Count: ${repos.length}`);
    
    console.log('✅ AI relevance analysis test completed');
    return aiRelevance;
    
  } catch (error) {
    console.error('❌ AI relevance analysis test failed:', error.message);
    throw error;
  }
}

/**
 * Test comprehensive profile analysis
 */
async function testProfileAnalysis() {
  console.log('\n🧪 Testing Comprehensive Profile Analysis...');
  
  try {
    // Create a mock profile for testing
    const mockProfile = {
      login: 'karpathy',
      name: 'Andrej Karpathy',
      company: null,
      location: null,
      bio: 'AI researcher',
      public_repos: 50,
      followers: 100000,
      html_url: 'https://github.com/karpathy'
    };
    
    const analysis = await analyzeGitHubProfile(mockProfile);
    
    console.log('📊 Profile Analysis Results:');
    console.log(`   Repo Volume: ${analysis.repoVolume}`);
    console.log(`   Repo Initiative: ${analysis.repoInitiative}`);
    console.log(`   Recent Activity: ${analysis.recentActivity}`);
    console.log(`   Popularity: ${analysis.popularity} stars`);
    console.log(`   AI Relevance: ${analysis.aiRelevance ? 'Yes' : 'No'}`);
    
    if (analysis.scoring) {
      console.log(`\n🏆 GitHub Score: ${analysis.scoring.totalScore}/${analysis.scoring.maxScore} (${analysis.scoring.percentage}%)`);
      console.log('📊 Score Breakdown:');
      console.log(`   Repo Volume: ${analysis.scoring.breakdown.repoVolume}/3`);
      console.log(`   Repo Initiative: ${analysis.scoring.breakdown.repoInitiative}/3`);
      console.log(`   Recent Activity: ${analysis.scoring.breakdown.recentActivity}/3`);
      console.log(`   Popularity: ${analysis.scoring.breakdown.popularity}/4`);
      console.log(`   AI Relevance: ${analysis.scoring.breakdown.aiRelevance}/3`);
    }
    
    console.log('✅ Profile analysis test completed');
    return analysis;
    
  } catch (error) {
    console.error('❌ Profile analysis test failed:', error.message);
    throw error;
  }
}

/**
 * Test complete GitHub parsing workflow
 */
async function testCompleteWorkflow() {
  console.log('\n🧪 Testing Complete GitHub Parsing Workflow...');
  
  try {
    const testProfile = {
      name: 'Andrej Karpathy',
      description: 'AI researcher and educator'
    };
    
    console.log('🔍 Starting complete GitHub extraction...');
    const result = await parseGitHub(testProfile);
    
    console.log('📊 Complete Workflow Results:');
    console.log(`   GitHub Username: ${result.githubUsername || 'Not found'}`);
    console.log(`   Full Name: ${result.fullName || 'Not found'}`);
    console.log(`   Company: ${result.company || 'Not found'}`);
    console.log(`   Public Repos: ${result.publicRepos || 0}`);
    console.log(`   Followers: ${result.followers || 0}`);
    console.log(`   Match Confidence: ${result.matchConfidence}`);
    console.log(`   Match Reason: ${result.matchReason}`);
    
    if (result.analysis) {
      console.log('\n📈 Analysis Results:');
      console.log(`   Repo Volume: ${result.analysis.repoVolume}`);
      console.log(`   Repo Initiative: ${result.analysis.repoInitiative}`);
      console.log(`   Recent Activity: ${result.analysis.recentActivity}`);
      console.log(`   Popularity: ${result.analysis.popularity} stars`);
      console.log(`   AI Relevance: ${result.analysis.aiRelevance ? 'Yes' : 'No'}`);
      
      if (result.analysis.scoring) {
        console.log(`\n🏆 GitHub Score: ${result.analysis.scoring.totalScore}/${result.analysis.scoring.maxScore} (${result.analysis.scoring.percentage}%)`);
      }
    }
    
    console.log('✅ Complete workflow test completed');
    return result;
    
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error.message);
    throw error;
  }
}

/**
 * Test multiple profiles
 */
async function testMultipleProfiles() {
  console.log('\n🧪 Testing Multiple Profiles...');
  
  for (const profile of testProfiles) {
    console.log(`\n📋 Testing profile: ${profile.name}`);
    
    try {
      const result = await parseGitHub({ name: profile.name });
      
      console.log(`   ✅ Result: ${result.githubUsername || 'Not found'}`);
      console.log(`   📊 Confidence: ${result.matchConfidence}`);
      
      if (result.analysis) {
        console.log(`   🤖 AI Relevance: ${result.analysis.aiRelevance ? 'Yes' : 'No'}`);
        console.log(`   ⭐ Total Stars: ${result.analysis.popularity}`);
        console.log(`   📦 Initiative Repos: ${result.analysis.repoInitiative}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('✅ Multiple profiles test completed');
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

/**
 * Run all GitHub parser tests
 */
async function runAllTests() {
  console.log('🚀 Starting GitHub Parser Tests...');
  
  try {
    await testGitHubSearch();
    await testRepositoryFetching();
    await testAIRelevanceAnalysis();
    await testProfileAnalysis();
    await testCompleteWorkflow();
    await testMultipleProfiles();
    
    console.log('\n🎉 All GitHub parser tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testGitHubSearch,
  testRepositoryFetching,
  testAIRelevanceAnalysis,
  testProfileAnalysis,
  testCompleteWorkflow,
  testMultipleProfiles
}; 