// =============================================================================
// TEST SCRIPT FOR PATENT CACHE SYSTEM
// =============================================================================
// This script demonstrates the caching system for SerpAPI calls
// Run with: node testPatentCache.js

const { parsePatents, searchPatents } = require('./utils/patentParser');
const { getCacheStats, clearCache, cleanExpiredCache } = require('./utils/patentCache');

/**
 * Test the caching system
 */
async function testCaching() {
  console.log('🧪 Testing Patent Cache System');
  console.log('=' .repeat(60));
  
  // Show initial cache stats
  console.log('\n📊 Initial Cache Stats:');
  const initialStats = getCacheStats();
  if (initialStats) {
    console.log(`  Files: ${initialStats.totalFiles} (${initialStats.validFiles} valid, ${initialStats.expiredFiles} expired)`);
    console.log(`  Size: ${initialStats.totalSizeKB} KB`);
    console.log(`  Directory: ${initialStats.cacheDir}`);
  }
  
  // Test with a researcher name
  const testName = 'Geoffrey Hinton';
  
  console.log(`\n🔍 First search for "${testName}" (should make API call):`);
  const startTime1 = Date.now();
  const result1 = await searchPatents(testName, 'GRANT');
  const endTime1 = Date.now();
  
  console.log(`  ⏱️ First search took: ${endTime1 - startTime1}ms`);
  console.log(`  📊 Found ${result1?.organic_results?.length || 0} patents`);
  
  console.log(`\n🔍 Second search for "${testName}" (should use cache):`);
  const startTime2 = Date.now();
  const result2 = await searchPatents(testName, 'GRANT');
  const endTime2 = Date.now();
  
  console.log(`  ⏱️ Second search took: ${endTime2 - startTime2}ms`);
  console.log(`  📊 Found ${result2?.organic_results?.length || 0} patents`);
  console.log(`  💾 Speed improvement: ${Math.round((endTime1 - startTime1) / (endTime2 - startTime2))}x faster`);
  
  // Test with filed patents
  console.log(`\n🔍 Filed patents search for "${testName}":`);
  const startTime3 = Date.now();
  const result3 = await searchPatents(testName, 'APPLICATION');
  const endTime3 = Date.now();
  
  console.log(`  ⏱️ Filed search took: ${endTime3 - startTime3}ms`);
  console.log(`  📊 Found ${result3?.organic_results?.length || 0} filed patents`);
  
  // Show final cache stats
  console.log('\n📊 Final Cache Stats:');
  const finalStats = getCacheStats();
  if (finalStats) {
    console.log(`  Files: ${finalStats.totalFiles} (${finalStats.validFiles} valid, ${finalStats.expiredFiles} expired)`);
    console.log(`  Size: ${finalStats.totalSizeKB} KB`);
    console.log(`  Directory: ${finalStats.cacheDir}`);
  }
  
  console.log('\n🎉 Cache system test completed!');
  console.log('💡 Tip: Run this script again to see instant cache hits!');
}

/**
 * Test cache management functions
 */
async function testCacheManagement() {
  console.log('\n🛠️ Testing Cache Management:');
  console.log('-'.repeat(40));
  
  // Show current stats
  const stats = getCacheStats();
  if (stats) {
    console.log(`📊 Current cache: ${stats.totalFiles} files, ${stats.totalSizeKB} KB`);
  }
  
  // Clean expired files
  console.log('\n🧹 Cleaning expired cache files:');
  cleanExpiredCache();
  
  // Show stats after cleanup
  const statsAfterClean = getCacheStats();
  if (statsAfterClean) {
    console.log(`📊 After cleanup: ${statsAfterClean.totalFiles} files, ${statsAfterClean.totalSizeKB} KB`);
  }
  
  // Option to clear all cache (commented out for safety)
  // console.log('\n🗑️ Clearing all cache:');
  // clearCache();
  
  console.log('\n💡 Cache Management Tips:');
  console.log('  - Cache expires after 24 hours');
  console.log('  - Use clearCache() to reset everything');
  console.log('  - Use cleanExpiredCache() to remove old files');
  console.log('  - Cache is stored in server/cache/ directory');
}

/**
 * Test full patent parsing with cache
 */
async function testFullParsingWithCache() {
  console.log('\n🔬 Testing Full Patent Parsing with Cache:');
  console.log('-'.repeat(50));
  
  const testProfile = {
    name: 'Yann LeCun',
    education: {
      institute: 'NYU',
      degree: 'PhD',
      fieldOfStudy: 'AI'
    }
  };
  
  console.log('📝 Test Profile:', JSON.stringify(testProfile, null, 2));
  
  const startTime = Date.now();
  const result = await parsePatents(testProfile);
  const endTime = Date.now();
  
  console.log('\n📊 Results:');
  console.log(`  Granted (First): ${result.grantedFirstInventor}`);
  console.log(`  Granted (Co): ${result.grantedCoInventor}`);
  console.log(`  Filed: ${result.filedPatent}`);
  console.log(`  Processing Time: ${endTime - startTime}ms`);
  console.log(`  Method: ${result.extractionMethod}`);
  console.log(`  Confidence: ${result.analysisConfidence}`);
  
  // Show cache stats
  const finalStats = getCacheStats();
  if (finalStats) {
    console.log(`\n💾 Cache Status: ${finalStats.totalFiles} files, ${finalStats.totalSizeKB} KB`);
  }
}

// Main execution
async function main() {
  try {
    await testCaching();
    await testCacheManagement();
    await testFullParsingWithCache();
    
    console.log('\n✅ All cache tests completed successfully!');
    console.log('\n🚀 Your SerpAPI calls are now cached - run the same searches again to see instant results!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testCaching, testCacheManagement }; 