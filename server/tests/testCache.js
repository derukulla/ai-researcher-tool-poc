const { 
  parsePublications, 
  getCacheStats, 
  clearAllCache, 
  clearExpiredCache 
} = require('./utils/publicationsParser');

async function testCaching() {
  console.log('🧪 Testing Publications Parser Caching System');
  console.log('=' .repeat(60));
  
  // Get initial cache stats
  console.log('\n📊 Initial Cache Stats:');
  const initialStats = getCacheStats();
  console.log(initialStats);
  
  const testProfile = {
    name: 'Geoffrey Hinton',
    affiliation: 'University of Toronto',
    field: 'AI'
  };
  
  console.log('\n🔄 First API call (should cache results):');
  const start1 = Date.now();
  
  try {
    const result1 = await parsePublications(testProfile);
    const time1 = Date.now() - start1;
    
    console.log(`✅ First call completed in ${time1}ms`);
    console.log(`📊 Publications: ${result1.numberOfPublications}`);
    console.log(`📈 Citations: ${result1.citations}`);
    console.log(`🏆 H-Index: ${result1.hIndex}`);
    
    // Get cache stats after first call
    console.log('\n📊 Cache Stats after first call:');
    const stats1 = getCacheStats();
    console.log(stats1);
    
    console.log('\n🔄 Second API call (should use cache):');
    const start2 = Date.now();
    
    const result2 = await parsePublications(testProfile);
    const time2 = Date.now() - start2;
    
    console.log(`✅ Second call completed in ${time2}ms`);
    console.log(`📊 Publications: ${result2.numberOfPublications}`);
    console.log(`📈 Citations: ${result2.citations}`);
    console.log(`🏆 H-Index: ${result2.hIndex}`);
    
    // Compare results
    console.log('\n🔍 Comparing Results:');
    console.log(`Time difference: ${time1 - time2}ms (should be positive if cache worked)`);
    console.log(`Results match: ${JSON.stringify(result1) === JSON.stringify(result2)}`);
    
    // Get final cache stats
    console.log('\n📊 Final Cache Stats:');
    const finalStats = getCacheStats();
    console.log(finalStats);
    
    // Test cache management
    console.log('\n🧹 Testing Cache Management:');
    console.log('Clearing expired cache...');
    clearExpiredCache();
    
    console.log('\n📊 Cache Stats after clearing expired:');
    const afterExpiredStats = getCacheStats();
    console.log(afterExpiredStats);
    
    console.log('\n🗑️ Clearing all cache...');
    const clearedCount = clearAllCache();
    console.log(`Cleared ${clearedCount} files`);
    
    console.log('\n📊 Cache Stats after clearing all:');
    const emptyStats = getCacheStats();
    console.log(emptyStats);
    
    console.log('\n✅ Cache testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Cache test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the cache test
testCaching(); 