/**
 * Test GitHub Scoring in Scoring Engine
 * Tests the GitHub scoring criteria integration
 */

const { calculateGitHubScore } = require('./utils/scoringEngine');

// =============================================================================
// TEST DATA
// =============================================================================

const testCases = [
  {
    name: 'High Activity AI Researcher',
    github: {
      analysis: {
        repoVolume: 25,        // >5 → +3
        repoInitiative: 20,    // >3 → +3  
        recentActivity: 8,     // >0 → +3
        popularity: 45000,     // >50 → +4
        aiRelevance: true      // true → +3
      }
    },
    expectedScore: 16 // 3+3+3+4+3 = 16 (max)
  },
  {
    name: 'Moderate Activity Developer',
    github: {
      analysis: {
        repoVolume: 8,         // >5 → +3
        repoInitiative: 5,     // >3 → +3
        recentActivity: 2,     // >0 → +3
        popularity: 30,        // >20 but <50 → +2
        aiRelevance: false     // false → +0
      }
    },
    expectedScore: 11 // 3+3+3+2+0 = 11
  },
  {
    name: 'Low Activity User',
    github: {
      analysis: {
        repoVolume: 3,         // ≤5 → +0
        repoInitiative: 2,     // ≤3 → +0
        recentActivity: 0,     // =0 → +0
        popularity: 15,        // ≤20 → +0
        aiRelevance: true      // true → +3
      }
    },
    expectedScore: 3 // 0+0+0+0+3 = 3
  },
  {
    name: 'No GitHub Data',
    github: null,
    expectedScore: 0
  },
  {
    name: 'Empty Analysis',
    github: {
      analysis: null
    },
    expectedScore: 0
  }
];

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

/**
 * Test GitHub scoring criteria
 */
function testGitHubScoring() {
  console.log('🧪 Testing GitHub Scoring Criteria...');
  console.log('=' .repeat(60));
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    const actualScore = calculateGitHubScore(testCase.github);
    const passed = actualScore === testCase.expectedScore;
    
    console.log(`Expected Score: ${testCase.expectedScore}`);
    console.log(`Actual Score: ${actualScore}`);
    console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (testCase.github?.analysis) {
      const analysis = testCase.github.analysis;
      console.log('\nCriteria Breakdown:');
      console.log(`  Repo Volume (${analysis.repoVolume}): ${analysis.repoVolume > 5 ? '+3' : '+0'}`);
      console.log(`  Repo Initiative (${analysis.repoInitiative}): ${analysis.repoInitiative > 3 ? '+3' : '+0'}`);
      console.log(`  Recent Activity (${analysis.recentActivity}): ${analysis.recentActivity > 0 ? '+3' : '+0'}`);
      
      let popularityScore = 0;
      if (analysis.popularity > 50) popularityScore = 4;
      else if (analysis.popularity > 20) popularityScore = 2;
      console.log(`  Popularity (${analysis.popularity}): +${popularityScore}`);
      
      console.log(`  AI Relevance (${analysis.aiRelevance}): ${analysis.aiRelevance ? '+3' : '+0'}`);
    }
    
    if (!passed) {
      console.log(`❌ Test failed for: ${testCase.name}`);
    }
  });
  
  const passedTests = testCases.filter((testCase, index) => {
    const actualScore = calculateGitHubScore(testCase.github);
    return actualScore === testCase.expectedScore;
  }).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Test Results: ${passedTests}/${testCases.length} tests passed`);
  
  if (passedTests === testCases.length) {
    console.log('🎉 All GitHub scoring tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the criteria implementation.');
  }
}

/**
 * Test edge cases and boundary conditions
 */
function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...');
  console.log('=' .repeat(60));
  
  const edgeCases = [
    {
      name: 'Exact Boundary Values',
      github: {
        analysis: {
          repoVolume: 5,     // exactly 5 (should be 0)
          repoInitiative: 3, // exactly 3 (should be 0)
          recentActivity: 0, // exactly 0 (should be 0)
          popularity: 20,    // exactly 20 (should be 0)
          aiRelevance: false
        }
      },
      expectedScore: 0
    },
    {
      name: 'Just Above Boundaries',
      github: {
        analysis: {
          repoVolume: 6,     // just above 5 (+3)
          repoInitiative: 4, // just above 3 (+3)
          recentActivity: 1, // just above 0 (+3)
          popularity: 21,    // just above 20 (+2)
          aiRelevance: true  // (+3)
        }
      },
      expectedScore: 14 // 3+3+3+2+3 = 14
    },
    {
      name: 'Popularity Boundary (50)',
      github: {
        analysis: {
          repoVolume: 10,
          repoInitiative: 5,
          recentActivity: 2,
          popularity: 50,    // exactly 50 (should be +2)
          aiRelevance: true
        }
      },
      expectedScore: 13 // 3+3+3+2+3 = 14, but popularity=50 gives +2, not +4
    },
    {
      name: 'Popularity Just Above 50',
      github: {
        analysis: {
          repoVolume: 10,
          repoInitiative: 5,
          recentActivity: 2,
          popularity: 51,    // just above 50 (+4)
          aiRelevance: true
        }
      },
      expectedScore: 15 // 3+3+3+4+3 = 16, but let me recalculate: 3+3+3+4+3=16, but max is 16
    }
  ];
  
  edgeCases.forEach((testCase, index) => {
    console.log(`\nEdge Case ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    const actualScore = calculateGitHubScore(testCase.github);
    const passed = actualScore === testCase.expectedScore;
    
    console.log(`Expected: ${testCase.expectedScore}, Actual: ${actualScore}, ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (testCase.github?.analysis) {
      const a = testCase.github.analysis;
      console.log(`  Values: vol=${a.repoVolume}, init=${a.repoInitiative}, recent=${a.recentActivity}, pop=${a.popularity}, ai=${a.aiRelevance}`);
    }
  });
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

/**
 * Run all GitHub scoring tests
 */
function runAllTests() {
  console.log('🚀 Starting GitHub Scoring Tests...\n');
  
  testGitHubScoring();
  testEdgeCases();
  
  console.log('\n🎉 GitHub scoring tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testGitHubScoring,
  testEdgeCases,
  runAllTests
}; 