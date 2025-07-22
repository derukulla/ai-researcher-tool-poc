/**
 * Test QS Ranking Institute Filter
 * Usage: node testQSRankingFilter.js
 */

// Change working directory to server for proper module resolution
process.chdir(require('path').join(__dirname, '../server'));

const { checkEducationFilter } = require('./utils/profileSearch');

/**
 * Test QS ranking based institute filtering
 */
function testQSRankingFilter() {
  console.log('🏫 Testing QS Ranking Institute Filter');
  console.log('='.repeat(50));
  
  // Test education profiles with different institute tiers
  const testEducationProfiles = [
    {
      name: 'Dr. John Doe',
      degree: 'PhD',
      fieldOfStudy: 'AI',
      institute: 'Stanford University',
      instituteTier: 'Top Institute (QS <300)',
      qsRanking: 3
    },
    {
      name: 'Dr. Jane Smith', 
      degree: 'PhD',
      fieldOfStudy: 'Computer Science',
      institute: 'MIT',
      instituteTier: 'Top Institute (QS <300)',
      qsRanking: 1
    },
    {
      name: 'Dr. Bob Wilson',
      degree: 'PhD', 
      fieldOfStudy: 'Machine Learning',
      institute: 'University of Texas',
      instituteTier: 'Other Institute (QS >300)',
      qsRanking: 500
    },
    {
      name: 'Dr. Alice Brown',
      degree: 'PhD',
      fieldOfStudy: 'AI',
      institute: 'Delhi Technological University',
      instituteTier: 'Other Institute (QS >300)',
      qsRanking: 800
    },
    {
      name: 'Dr. Charlie Green',
      degree: 'PhD',
      fieldOfStudy: 'Related Fields',
      institute: 'IISc Bangalore',
      instituteTier: 'Top Institute (QS <300)',
      qsRanking: 155
    }
  ];

  // Test different filter scenarios
  const testFilters = [
    {
      name: 'Filter for Top Institutes (QS <300)',
      filter: {
        education: {
          enabled: true,
          degree: 'PhD',
          fieldOfStudy: 'AI',
          instituteTier: 'Top Institute (QS <300)'
        }
      }
    },
    {
      name: 'Filter for Other Institutes (QS >300)',
      filter: {
        education: {
          enabled: true,
          degree: 'PhD', 
          fieldOfStudy: 'AI',
          instituteTier: 'Other Institute (QS >300)'
        }
      }
    },
    {
      name: 'Filter for Any Institute + AI Field',
      filter: {
        education: {
          enabled: true,
          degree: 'PhD',
          fieldOfStudy: 'AI'
          // No instituteTier filter
        }
      }
    },
    {
      name: 'Filter for Top Institutes + Any Field',
      filter: {
        education: {
          enabled: true,
          degree: 'PhD',
          instituteTier: 'Top Institute (QS <300)'
          // No fieldOfStudy filter
        }
      }
    }
  ];

  testFilters.forEach((testCase, index) => {
    console.log(`\n🔍 TEST ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(40));
    console.log('Filter criteria:', JSON.stringify(testCase.filter.education, null, 2));
    console.log('\nResults:');

    let passedCount = 0;
    
    testEducationProfiles.forEach(profile => {
      const passed = checkEducationFilter(profile, testCase.filter);
      const status = passed ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   ${status} ${profile.name}`);
      console.log(`        📚 ${profile.degree} in ${profile.fieldOfStudy}`);
      console.log(`        🏫 ${profile.institute} (${profile.instituteTier})`);
      console.log(`        📊 QS Ranking: ${profile.qsRanking}`);
      
      if (passed) passedCount++;
    });
    
    console.log(`\n📊 Summary: ${passedCount}/${testEducationProfiles.length} profiles passed the filter`);
  });

  // Demonstrate field matching logic
  console.log('\n' + '='.repeat(50));
  console.log('🔍 FIELD OF STUDY MATCHING EXAMPLES');
  console.log('-'.repeat(40));

  const fieldTestCases = [
    { filter: 'AI', education: 'Artificial Intelligence', shouldPass: true },
    { filter: 'AI', education: 'Machine Learning', shouldPass: true },
    { filter: 'AI', education: 'Deep Learning', shouldPass: true },
    { filter: 'AI', education: 'Computer Science', shouldPass: false },
    { filter: 'Computer Science', education: 'Computer Science', shouldPass: true },
    { filter: 'Computer Science', education: 'CS', shouldPass: true },
    { filter: 'Computer Science', education: 'Software Engineering', shouldPass: true },
    { filter: 'Related Fields', education: 'Data Science', shouldPass: true },
    { filter: 'Related Fields', education: 'Robotics', shouldPass: true },
    { filter: 'Related Fields', education: 'Mathematics', shouldPass: true }
  ];

  fieldTestCases.forEach(testCase => {
    const testProfile = {
      degree: 'PhD',
      fieldOfStudy: testCase.education,
      instituteTier: 'Top Institute (QS <300)'
    };
    
    const testFilter = {
      education: {
        enabled: true,
        fieldOfStudy: testCase.filter
      }
    };
    
    const result = checkEducationFilter(testProfile, testFilter);
    const status = result === testCase.shouldPass ? '✅' : '❌';
    const expected = testCase.shouldPass ? 'SHOULD PASS' : 'SHOULD FAIL';
    
    console.log(`   ${status} Filter: "${testCase.filter}" | Education: "${testCase.education}" | ${expected}`);
  });

  console.log('\n✅ QS Ranking Filter Test Complete!');
  console.log('\n💡 How to use in your code:');
  console.log('   const filters = {');
  console.log('     education: {');
  console.log('       enabled: true,');
  console.log('       degree: "PhD",');
  console.log('       fieldOfStudy: "AI",');
  console.log('       instituteTier: "Top Institute (QS <300)"  // or "Other Institute (QS >300)"');
  console.log('     }');
  console.log('   };');
}

// Run the test
testQSRankingFilter(); 