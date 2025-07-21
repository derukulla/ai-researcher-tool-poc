/**
 * Test Date Parsing for GitHub API
 * Tests the date parsing logic used in GitHub profile analysis
 */

/**
 * Test the date parsing logic used in analyzeGitHubProfile
 */
function testDateParsing() {
  console.log('🧪 Testing GitHub Date Parsing Logic...');
  console.log('=' .repeat(50));
  
  // Test dates in GitHub format
  const testDates = [
    '2024-10-09T15:58:42Z',  // Recent (should be in last 6 months)
    '2024-01-15T10:30:00Z',  // Older (might be outside 6 months depending on current date)
    '2023-06-01T08:45:30Z',  // Definitely older than 6 months
    '2024-12-01T12:00:00Z',  // Future date
    null,                    // Null date
    undefined,               // Undefined date
    'invalid-date'           // Invalid date format
  ];
  
  // Calculate 6 months ago (same logic as in the code)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  console.log(`📅 Current Date: ${new Date().toISOString()}`);
  console.log(`📅 Six Months Ago: ${sixMonthsAgo.toISOString()}`);
  console.log('');
  
  testDates.forEach((dateString, index) => {
    console.log(`Test ${index + 1}: ${dateString || 'null/undefined'}`);
    
    try {
      if (dateString) {
        const updatedAt = new Date(dateString);
        const isRecent = updatedAt >= sixMonthsAgo;
        const isValid = !isNaN(updatedAt.getTime());
        
        console.log(`  Parsed Date: ${updatedAt.toISOString()}`);
        console.log(`  Is Valid: ${isValid}`);
        console.log(`  Is Recent (last 6 months): ${isRecent}`);
        console.log(`  Days from now: ${Math.floor((new Date() - updatedAt) / (1000 * 60 * 60 * 24))}`);
      } else {
        console.log(`  Parsed Date: Invalid (null/undefined)`);
        console.log(`  Is Valid: false`);
        console.log(`  Is Recent: false`);
      }
    } catch (error) {
      console.log(`  Error parsing date: ${error.message}`);
    }
    
    console.log('');
  });
}

/**
 * Test with mock repository data
 */
function testWithMockRepos() {
  console.log('🧪 Testing with Mock Repository Data...');
  console.log('=' .repeat(50));
  
  const mockRepos = [
    {
      name: 'recent-project',
      updated_at: '2024-10-09T15:58:42Z',
      fork: false,
      stargazers_count: 100
    },
    {
      name: 'old-project',
      updated_at: '2023-03-15T10:30:00Z',
      fork: false,
      stargazers_count: 50
    },
    {
      name: 'forked-project',
      updated_at: '2024-09-01T12:00:00Z',
      fork: true,
      stargazers_count: 0
    },
    {
      name: 'very-recent',
      updated_at: '2024-11-01T08:45:30Z',
      fork: false,
      stargazers_count: 200
    }
  ];
  
  console.log(`📊 Total repositories: ${mockRepos.length}`);
  
  // Test the exact logic from analyzeGitHubProfile
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentActivity = mockRepos.filter(repo => {
    const updatedAt = new Date(repo.updated_at);
    return updatedAt >= sixMonthsAgo;
  }).length;
  
  const repoInitiative = mockRepos.filter(repo => !repo.fork).length;
  const popularity = mockRepos.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
  
  console.log(`📈 Recent Activity (last 6 months): ${recentActivity}`);
  console.log(`🚀 Repo Initiative (non-forks): ${repoInitiative}`);
  console.log(`⭐ Total Popularity: ${popularity} stars`);
  
  console.log('\n📋 Repository Analysis:');
  mockRepos.forEach((repo, index) => {
    const updatedAt = new Date(repo.updated_at);
    const isRecent = updatedAt >= sixMonthsAgo;
    const daysSinceUpdate = Math.floor((new Date() - updatedAt) / (1000 * 60 * 60 * 24));
    
    console.log(`  ${index + 1}. ${repo.name}`);
    console.log(`     Updated: ${repo.updated_at}`);
    console.log(`     Days ago: ${daysSinceUpdate}`);
    console.log(`     Recent: ${isRecent ? '✅ Yes' : '❌ No'}`);
    console.log(`     Fork: ${repo.fork ? '✅ Yes' : '❌ No'}`);
    console.log(`     Stars: ${repo.stargazers_count}`);
    console.log('');
  });
}

/**
 * Test edge cases
 */
function testEdgeCases() {
  console.log('🧪 Testing Edge Cases...');
  console.log('=' .repeat(50));
  
  const edgeCases = [
    {
      name: 'Empty repository list',
      repos: []
    },
    {
      name: 'Repositories with null updated_at',
      repos: [
        { name: 'repo1', updated_at: null, fork: false, stargazers_count: 10 },
        { name: 'repo2', updated_at: '2024-10-09T15:58:42Z', fork: false, stargazers_count: 20 }
      ]
    },
    {
      name: 'All forked repositories',
      repos: [
        { name: 'fork1', updated_at: '2024-10-09T15:58:42Z', fork: true, stargazers_count: 5 },
        { name: 'fork2', updated_at: '2024-09-01T12:00:00Z', fork: true, stargazers_count: 3 }
      ]
    }
  ];
  
  edgeCases.forEach((testCase, index) => {
    console.log(`\nEdge Case ${index + 1}: ${testCase.name}`);
    console.log(`Repositories: ${testCase.repos.length}`);
    
    if (testCase.repos.length === 0) {
      console.log('  Recent Activity: 0');
      console.log('  Repo Initiative: 0');
      console.log('  Popularity: 0');
      return;
    }
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentActivity = testCase.repos.filter(repo => {
      if (!repo.updated_at) return false;
      const updatedAt = new Date(repo.updated_at);
      return !isNaN(updatedAt.getTime()) && updatedAt >= sixMonthsAgo;
    }).length;
    
    const repoInitiative = testCase.repos.filter(repo => !repo.fork).length;
    const popularity = testCase.repos.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
    
    console.log(`  Recent Activity: ${recentActivity}`);
    console.log(`  Repo Initiative: ${repoInitiative}`);
    console.log(`  Popularity: ${popularity}`);
  });
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting GitHub Date Parsing Tests...\n');
  
  testDateParsing();
  console.log('\n');
  
  testWithMockRepos();
  console.log('\n');
  
  testEdgeCases();
  
  console.log('\n🎉 All date parsing tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDateParsing,
  testWithMockRepos,
  testEdgeCases,
  runAllTests
}; 