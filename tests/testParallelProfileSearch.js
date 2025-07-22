/**
 * Test Parallel Profile Search
 * Usage: node testParallelProfileSearch.js
 */

// Change working directory to server for proper module resolution
process.chdir(require('path').join(__dirname, '../server'));

const { profileSearchParallel, profileSearch } = require('./utils/profileSearch');

/**
 * Test parallel vs sequential profile search
 */
async function testParallelVsSequential() {
  console.log('🚀 Testing Parallel vs Sequential Profile Search');
  console.log('='.repeat(60));
  
  // Test filters - education focused
  const testFilters = {
    education: {
      enabled: true,
      degree: 'PhD',
      fieldOfStudy: 'AI',
      institute: '' // Any institute
    },
    publications: {
      enabled: true,
      minPublications: 5,
      minCitations: 100
    },
    patents: {
      enabled: false
    },
    github: {
      enabled: false
    },
    experience: {
      enabled: false
    }
  };
  
  const options = {
    maxProfiles: 5,      // Limit to 5 profiles for testing
    maxSearchResults: 15 // Search 15 profiles max
  };
  
  console.log('🔍 Test Configuration:');
  console.log(`   Looking for: ${options.maxProfiles} PhD researchers in AI`);
  console.log(`   Search scope: ${options.maxSearchResults} LinkedIn profiles`);
  console.log(`   Filters: Education (PhD, AI), Publications (5+ papers, 100+ citations)`);
  console.log('\n');
  
  try {
    // Test 1: Parallel Processing
    console.log('⚡ TEST 1: PARALLEL PROCESSING');
    console.log('-'.repeat(40));
    const parallelStartTime = Date.now();
    
    const parallelResults = await profileSearchParallel(testFilters, options);
    
    const parallelTime = Date.now() - parallelStartTime;
    
    console.log('\n📊 PARALLEL RESULTS:');
    console.log(`   ✅ Success: ${parallelResults.success}`);
    console.log(`   👥 Profiles found: ${parallelResults.profiles.length}`);
    console.log(`   ⏱️ Total time: ${Math.round(parallelTime / 1000)}s`);
    console.log(`   🚀 Average per profile: ${Math.round(parallelTime / parallelResults.summary.profilesProcessed)}ms`);
    console.log(`   📈 Processing method: ${parallelResults.summary.processingMethod}`);
    
    if (parallelResults.summary.stageResults) {
      console.log(`   📋 Stage Results:`);
      console.log(`      - LinkedIn fetched: ${parallelResults.summary.stageResults.linkedInFetched}`);
      console.log(`      - Education passed: ${parallelResults.summary.stageResults.educationPassed}`);
      console.log(`      - Publications passed: ${parallelResults.summary.stageResults.publicationsPassed}`);
      console.log(`      - Final profiles: ${parallelResults.summary.stageResults.finalPassed}`);
    }
    
    // Show found profiles
    if (parallelResults.profiles.length > 0) {
      console.log('\n👥 Found Researchers (Parallel):');
      parallelResults.profiles.forEach((profile, index) => {
        const edu = profile.parsing.education;
        const pubs = profile.parsing.publications;
        console.log(`   ${index + 1}. ${profile.profileName}`);
        console.log(`      📚 ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institute}`);
        console.log(`      📄 ${pubs.numberOfPublications} papers, ${pubs.citations} citations, h-index: ${pubs.hIndex}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Test 2: Sequential Processing (for comparison)
    console.log('🐌 TEST 2: SEQUENTIAL PROCESSING (Comparison)');
    console.log('-'.repeat(40));
    const sequentialStartTime = Date.now();
    
    const sequentialResults = await profileSearch(testFilters, options);
    
    const sequentialTime = Date.now() - sequentialStartTime;
    
    console.log('\n📊 SEQUENTIAL RESULTS:');
    console.log(`   ✅ Success: ${sequentialResults.success}`);
    console.log(`   👥 Profiles found: ${sequentialResults.profiles.length}`);
    console.log(`   ⏱️ Total time: ${Math.round(sequentialTime / 1000)}s`);
    console.log(`   🐌 Average per profile: ${Math.round(sequentialTime / sequentialResults.summary.profilesProcessed)}ms`);
    console.log(`   📈 Processing method: ${sequentialResults.summary.processingMethod}`);
    
    // Performance Comparison
    console.log('\n' + '='.repeat(60));
    console.log('🏆 PERFORMANCE COMPARISON');
    console.log('-'.repeat(40));
    
    const speedImprovement = ((sequentialTime - parallelTime) / sequentialTime * 100).toFixed(1);
    const timesSaved = (sequentialTime / parallelTime).toFixed(1);
    
    console.log(`⚡ Parallel time: ${Math.round(parallelTime / 1000)}s`);
    console.log(`🐌 Sequential time: ${Math.round(sequentialTime / 1000)}s`);
    console.log(`🚀 Speed improvement: ${speedImprovement}% faster`);
    console.log(`⚡ Parallel is ${timesSaved}x faster than sequential`);
    console.log(`💾 Time saved: ${Math.round((sequentialTime - parallelTime) / 1000)}s`);
    
    if (parallelTime < sequentialTime) {
      console.log('\n🎉 PARALLEL PROCESSING WINS! 🎉');
      console.log('✅ Use profileSearchParallel() for faster multi-profile processing');
    } else {
      console.log('\n⚠️ Results may vary - parallel processing benefits increase with more profiles');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run the test
 */
console.log('🧪 Starting Parallel vs Sequential Profile Search Test...\n');

testParallelVsSequential()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 To use parallel processing in your code:');
    console.log('   const { profileSearchParallel } = require("./utils/profileSearch");');
    console.log('   const results = await profileSearchParallel(filters, options);');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 