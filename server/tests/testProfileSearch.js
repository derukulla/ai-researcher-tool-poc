/**
 * Test Profile Search functionality
 */

const { profileSearch, buildLinkedInSearchQuery } = require('./utils/profileSearch');

async function testProfileSearch() {
  console.log('🧪 Testing Profile Search functionality...\n');
  
  // Test 1: Query building
  console.log('=== TEST 1: Query Building ===');
  const testFilters = {
    degree: 'PhD',
    fieldOfStudy: 'AI'
  };
  
  const query = buildLinkedInSearchQuery(testFilters);
  console.log('Test filters:', testFilters);
  console.log('Generated query:', query);
  console.log('✅ Query building test completed\n');
  
  // Test 2: Small scale profile search
  console.log('=== TEST 2: Profile Search ===');
  const searchFilters = {
    // Education filters
    degree: 'PhD',
    fieldOfStudy: 'AI',
    instituteTier: '',
    
    // Publications filters (relaxed for testing)
    hasTopAIConferences: false,
    hasOtherAIConferences: false,
    hasReputableJournals: false,
    hasOtherJournals: false,
    minPublications: '',
    minCitations: '',
    
    // Patents filters (relaxed for testing)
    grantedFirstInventor: false,
    grantedCoInventor: false,
    filedPatent: false,
    significantContribution: false,
    
    // Experience filters
    experienceBracket: '',
    minHIndex: ''
  };
  
  console.log('Search filters:', searchFilters);
  
  try {
    const result = await profileSearch(searchFilters, {
      maxProfiles: 5, // Small number for testing
      maxSearchResults: 20 // Small number for testing
    });
    
    console.log('\n=== SEARCH RESULTS ===');
    console.log('Success:', result.success);
    console.log('Profiles found:', result.profiles.length);
    console.log('Summary:', result.summary);
    
    if (result.profiles.length > 0) {
      console.log('\n=== SAMPLE PROFILE ===');
      const sampleProfile = result.profiles[0];
      console.log('Username:', sampleProfile.username);
      console.log('URL:', sampleProfile.url);
      console.log('Passed filters:', sampleProfile.passedFilters);
      console.log('Education:', sampleProfile.parsing.education?.degree, sampleProfile.parsing.education?.fieldOfStudy);
      
      if (sampleProfile.parsing.publications) {
        console.log('Publications:', sampleProfile.parsing.publications.numberOfPublications, 'papers,', sampleProfile.parsing.publications.citations, 'citations');
      }
    }
    
    console.log('\n✅ Profile search test completed successfully');
    
  } catch (error) {
    console.error('❌ Profile search test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test 3: Query variations
async function testQueryVariations() {
  console.log('\n=== TEST 3: Query Variations ===');
  
  const testCases = [
    { degree: 'PhD', fieldOfStudy: 'AI' },
    { degree: "Master's", fieldOfStudy: 'Computer Science' },
    { degree: 'Pursuing PhD', fieldOfStudy: 'Machine Learning' },
    { degree: '', fieldOfStudy: 'Computer Vision' },
    { degree: 'PhD', fieldOfStudy: '' }
  ];
  
  testCases.forEach((filters, index) => {
    const query = buildLinkedInSearchQuery(filters);
    console.log(`Test ${index + 1}:`, filters, '→', query);
  });
  
  console.log('✅ Query variations test completed\n');
}

// Run tests
async function runAllTests() {
  try {
    await testQueryVariations();
    await testProfileSearch();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n🎯 All tests completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testProfileSearch, testQueryVariations, runAllTests }; 