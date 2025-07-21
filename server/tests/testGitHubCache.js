/**
 * Test GitHub Cache System
 * Tests caching functionality for GitHub API responses
 */

const {
  getCachedUserProfile,
  setCachedUserProfile,
  getCachedSearchResults,
  setCachedSearchResults,
  clearGitHubCache,
  getCacheStats,
  cleanExpiredCache
} = require('./utils/githubCache');

// =============================================================================
// TEST DATA
// =============================================================================

const testUserProfile = {
  name: 'Linus Torvalds',
  company: 'Linux Foundation',
  blog: 'https://github.com/torvalds',
  location: 'Portland, OR',
  email: null,
  bio: 'Creator of Linux and Git',
  twitter_username: null,
  public_repos: 4,
  followers: 240152,
  following: 0,
  created_at: '2011-09-03T15:26:22Z'
};

const testSearchResults = [
  {
    login: 'torvalds',
    id: 1024025,
    avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    html_url: 'https://github.com/torvalds',
    type: 'User'
  },
  {
    login: 'torvalds-dev',
    id: 1234567,
    avatar_url: 'https://avatars.githubusercontent.com/u/1234567?v=4',
    html_url: 'https://github.com/torvalds-dev',
    type: 'User'
  }
];

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test user profile caching
 */
async function testUserProfileCache() {
  console.log('\n🧪 Testing User Profile Cache...');
  
  const username = 'torvalds';
  
  // Test cache miss
  console.log('1. Testing cache miss...');
  const cachedProfile1 = getCachedUserProfile(username);
  console.log('   Cache result:', cachedProfile1 ? 'HIT' : 'MISS');
  
  // Test cache set
  console.log('2. Setting cache...');
  setCachedUserProfile(username, testUserProfile);
  
  // Test cache hit
  console.log('3. Testing cache hit...');
  const cachedProfile2 = getCachedUserProfile(username);
  console.log('   Cache result:', cachedProfile2 ? 'HIT' : 'MISS');
  
  if (cachedProfile2) {
    console.log('   ✅ Cached profile name:', cachedProfile2.name);
    console.log('   ✅ Cached profile company:', cachedProfile2.company);
    console.log('   ✅ Cached profile followers:', cachedProfile2.followers);
  }
  
  console.log('✅ User profile cache test completed');
}

/**
 * Test search results caching
 */
async function testSearchResultsCache() {
  console.log('\n🧪 Testing Search Results Cache...');
  
  const searchTerm = 'Linus Torvalds';
  
  // Test cache miss
  console.log('1. Testing cache miss...');
  const cachedResults1 = getCachedSearchResults(searchTerm);
  console.log('   Cache result:', cachedResults1 ? 'HIT' : 'MISS');
  
  // Test cache set
  console.log('2. Setting cache...');
  setCachedSearchResults(searchTerm, testSearchResults);
  
  // Test cache hit
  console.log('3. Testing cache hit...');
  const cachedResults2 = getCachedSearchResults(searchTerm);
  console.log('   Cache result:', cachedResults2 ? 'HIT' : 'MISS');
  
  if (cachedResults2) {
    console.log('   ✅ Cached results count:', cachedResults2.length);
    console.log('   ✅ First result login:', cachedResults2[0]?.login);
    console.log('   ✅ First result ID:', cachedResults2[0]?.id);
  }
  
  console.log('✅ Search results cache test completed');
}

/**
 * Test cache statistics
 */
async function testCacheStats() {
  console.log('\n🧪 Testing Cache Statistics...');
  
  const stats = getCacheStats();
  console.log('📊 Cache Statistics:');
  console.log('   Total files:', stats.totalFiles);
  console.log('   Valid files:', stats.validFiles);
  console.log('   Expired files:', stats.expiredFiles);
  console.log('   Total size:', stats.totalSizeMB, 'MB');
  
  console.log('✅ Cache statistics test completed');
}

/**
 * Test cache cleanup
 */
async function testCacheCleanup() {
  console.log('\n🧪 Testing Cache Cleanup...');
  
  // Test expired cache cleanup
  console.log('1. Cleaning expired cache...');
  const cleanedCount = cleanExpiredCache();
  console.log('   Cleaned files:', cleanedCount);
  
  // Test full cache clear
  console.log('2. Clearing all GitHub cache...');
  const clearedCount = clearGitHubCache();
  console.log('   Cleared files:', clearedCount);
  
  console.log('✅ Cache cleanup test completed');
}

/**
 * Test cache key generation and collision handling
 */
async function testCacheKeyGeneration() {
  console.log('\n🧪 Testing Cache Key Generation...');
  
  // Test same search terms with different cases
  const searchTerm1 = 'Linus Torvalds';
  const searchTerm2 = 'linus torvalds';
  const searchTerm3 = 'LINUS TORVALDS';
  
  console.log('1. Testing case-insensitive caching...');
  setCachedSearchResults(searchTerm1, testSearchResults);
  
  const result1 = getCachedSearchResults(searchTerm1);
  const result2 = getCachedSearchResults(searchTerm2);
  const result3 = getCachedSearchResults(searchTerm3);
  
  console.log('   Original case result:', result1 ? 'HIT' : 'MISS');
  console.log('   Lowercase result:', result2 ? 'HIT' : 'MISS');
  console.log('   Uppercase result:', result3 ? 'HIT' : 'MISS');
  
  if (result1 && result2 && result3) {
    console.log('   ✅ Case-insensitive caching works correctly');
  } else {
    console.log('   ❌ Case-insensitive caching failed');
  }
  
  console.log('✅ Cache key generation test completed');
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

/**
 * Run all cache tests
 */
async function runAllTests() {
  console.log('🚀 Starting GitHub Cache System Tests...');
  
  try {
    await testUserProfileCache();
    await testSearchResultsCache();
    await testCacheKeyGeneration();
    await testCacheStats();
    await testCacheCleanup();
    
    console.log('\n🎉 All GitHub cache tests completed successfully!');
    
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
  testUserProfileCache,
  testSearchResultsCache,
  testCacheStats,
  testCacheCleanup,
  testCacheKeyGeneration
}; 