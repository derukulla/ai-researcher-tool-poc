#!/usr/bin/env node

/**
 * Test file for LLM-based QS University Matching
 * This file tests the new LLM-based approach vs the old string matching
 */

const { 
  getTop300Universities, 
  checkUniversityWithLLM, 
  classifyInstituteTierWithLLM,
  getUniversityRank,
  classifyInstituteTier
} = require('./utils/qsRankings');

// Test cases with various university name formats
const testCases = [
  // Common abbreviations
  'MIT',
  'Stanford',
  'Harvard',
  'UC Berkeley',
  'CMU',
  
  // Full names
  'Massachusetts Institute of Technology',
  'Stanford University',
  'Harvard University',
  'University of California, Berkeley',
  'Carnegie Mellon University',
  
  // Variations and partial names
  'Berkeley',
  'Cal Berkeley',
  'Carnegie Mellon',
  'IIT Delhi',
  'Indian Institute of Technology Delhi',
  
  // International universities
  'University of Oxford',
  'Oxford University',
  'Cambridge',
  'University of Cambridge',
  'ETH Zurich',
  
  // Non-existent or non-top-300 universities
  'Random University',
  'XYZ Institute of Technology',
  'Unknown College',
  
  // Edge cases
  '',
  'University',
  'Institute'
];

/**
 * Compare old string matching vs new LLM matching
 */
async function compareMatchingMethods(universityName) {
  console.log(`\n🔍 Testing: "${universityName}"`);
  console.log('=' .repeat(50));
  
  // Old string matching method
  console.log('📊 OLD METHOD (String Matching):');
  const oldResult = classifyInstituteTier(universityName);
  console.log(`  Result: ${oldResult.tier}`);
  console.log(`  Found: ${oldResult.found}`);
  if (oldResult.found) {
    console.log(`  Rank: ${oldResult.rank}`);
    console.log(`  Matched Name: ${oldResult.matchedName}`);
  }
  
  // New LLM matching method
  console.log('\n🤖 NEW METHOD (LLM Matching):');
  try {
    const newResult = await classifyInstituteTierWithLLM(universityName);
    console.log(`  Result: ${newResult.tier}`);
    console.log(`  Found: ${newResult.found}`);
    console.log(`  Confidence: ${newResult.confidence}`);
    console.log(`  Reason: ${newResult.reason}`);
    if (newResult.found) {
      console.log(`  Rank: ${newResult.rank}`);
      console.log(`  Matched Name: ${newResult.matchedName}`);
    }
    
    // Compare results
    const agreement = oldResult.found === newResult.found;
    console.log(`\n📈 COMPARISON:`);
    console.log(`  Agreement: ${agreement ? '✅ MATCH' : '❌ DIFFERENT'}`);
    
    if (!agreement) {
      console.log(`  Old: ${oldResult.found ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`  New: ${newResult.found ? 'FOUND' : 'NOT FOUND'}`);
    }
    
    return { oldResult, newResult, agreement };
    
  } catch (error) {
    console.error(`❌ LLM matching failed: ${error.message}`);
    return { oldResult, newResult: null, agreement: false };
  }
}

/**
 * Test the top 300 universities extraction
 */
function testTop300Extraction() {
  console.log('🏆 TESTING TOP 300 UNIVERSITIES EXTRACTION');
  console.log('=' .repeat(60));
  
  const top300 = getTop300Universities();
  
  console.log(`📚 Total universities extracted: ${top300.length}`);
  
  if (top300.length > 0) {
    console.log('\n🔝 Top 10 universities:');
    top300.slice(0, 10).forEach((uni, index) => {
      console.log(`  ${index + 1}. ${uni.name} (Rank: ${uni.rank})`);
    });
    
    console.log('\n🏁 Last 5 universities (around rank 300):');
    top300.slice(-5).forEach((uni, index) => {
      console.log(`  ${top300.length - 4 + index}. ${uni.name} (Rank: ${uni.rank})`);
    });
  }
  
  return top300.length;
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 QS RANKINGS LLM MATCHING TEST');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Extract top 300 universities
    const totalUnis = testTop300Extraction();
    
    if (totalUnis === 0) {
      console.log('❌ No universities found. Check QS rankings file.');
      return;
    }
    
    // Test 2: Compare matching methods
    console.log('\n\n🔍 COMPARING MATCHING METHODS');
    console.log('=' .repeat(60));
    
    const results = [];
    let agreements = 0;
    let improvements = 0;
    
    // Test a subset of cases for speed
    const testSubset = testCases.slice(0, 10);
    
    for (const testCase of testSubset) {
      const result = await compareMatchingMethods(testCase);
      results.push(result);
      
      if (result.agreement) {
        agreements++;
      }
      
      // Check if LLM found something that string matching missed
      if (!result.oldResult.found && result.newResult && result.newResult.found) {
        improvements++;
      }
      
      // Add delay to avoid overwhelming the LLM
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n\n📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total test cases: ${testSubset.length}`);
    console.log(`Agreements: ${agreements}/${testSubset.length} (${Math.round(agreements/testSubset.length*100)}%)`);
    console.log(`LLM improvements: ${improvements} cases`);
    
    if (improvements > 0) {
      console.log('\n✨ LLM found matches that string matching missed!');
    }
    
    console.log('\n🎉 Testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test specific university names
 */
async function testSpecificUniversities() {
  console.log('\n\n🎯 TESTING SPECIFIC CHALLENGING CASES');
  console.log('=' .repeat(60));
  
  const challengingCases = [
    'MIT', // Should match "Massachusetts Institute of Technology"
    'Cal Tech', // Should match "California Institute of Technology"
    'UC Berkeley', // Should match "University of California, Berkeley"
    'IIT Delhi', // Should match if in top 300
    'Oxford', // Should match "University of Oxford"
  ];
  
  for (const universityName of challengingCases) {
    console.log(`\n🔬 Testing challenging case: "${universityName}"`);
    
    try {
      const result = await checkUniversityWithLLM(universityName);
      
      console.log(`  Found: ${result.found}`);
      console.log(`  Confidence: ${result.confidence}`);
      console.log(`  Reason: ${result.reason}`);
      
      if (result.found) {
        console.log(`  Matched Name: ${result.matchedName}`);
        console.log(`  Rank: ${result.rank}`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(() => testSpecificUniversities())
    .then(() => {
      console.log('\n✅ All tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  compareMatchingMethods,
  testTop300Extraction,
  testSpecificUniversities
}; 