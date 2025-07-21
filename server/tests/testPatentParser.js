// =============================================================================
// TEST SCRIPT FOR PATENT PARSER
// =============================================================================
// This script tests the SerpAPI + Ollama patent parser with caching
// Run with: node testPatentParser.js

const { parsePatents } = require('./utils/patentParser');
const { getCacheStats } = require('./utils/patentCache');

/**
 * Test the patent parser with different profile types
 */
async function testPatentParser() {
  console.log('🧪 Testing Patent Parser with SerpAPI + Ollama + Caching');
  console.log('=' .repeat(80));
  
  // Show initial cache stats
  const initialStats = getCacheStats();
  if (initialStats && initialStats.totalFiles > 0) {
    console.log(`💾 Cache Status: ${initialStats.totalFiles} files, ${initialStats.totalSizeKB} KB`);
  }
  
  const testProfiles = [
    // Test Case 1: Known researcher with patents
    {
      name: 'Geoffrey Hinton',
      education: {
        institute: 'University of Toronto',
        degree: 'PhD',
        fieldOfStudy: 'AI'
      },
      description: 'Test Case 1: Well-known AI researcher (likely has patents)'
    },

    // Test Case 2: Text profile format
    {
      profile: `Dr. Yann LeCun - AI Research Scientist
      Currently at Meta AI and NYU
      Research focus: Deep Learning, Computer Vision, Neural Networks`,
      description: 'Test Case 2: Text profile format'
    },

    // Test Case 3: Profile with specific name
    {
      name: 'Bapiraju Surampudi',
      education: {
        institute: 'Unknown',
        degree: 'PhD',
      },
      description: 'Test Case 3: Specific researcher name from API example'
    },

    // Test Case 4: Common name (likely no patents)
    {
      name: 'John Smith',
      education: {
        institute: 'Stanford University',
        degree: 'PhD',
        fieldOfStudy: 'Computer Science'
      },
      description: 'Test Case 4: Common name (testing no-match scenario)'
    }
  ];

  for (let i = 0; i < testProfiles.length; i++) {
    const testCase = testProfiles[i];
    console.log(`\n🔍 ${testCase.description}`);
    console.log('-'.repeat(60));
    
    const testProfile = testCase.profile || testCase;
    console.log('📝 Input Profile:', typeof testProfile === 'string' ? 
      testProfile.substring(0, 100) + '...' : 
      JSON.stringify(testProfile, null, 2));
    
    try {
      const startTime = Date.now();
      const result = await parsePatents(testProfile);
      const endTime = Date.now();
      
      // =====================================================================
      // PATENT ANALYSIS RESULTS
      // =====================================================================
      console.log('\n📊 PATENT ANALYSIS RESULTS:');
      console.log('  ✅ Granted (First Inventor):', result.grantedFirstInventor);
      console.log('  ✅ Granted (Co-Inventor):', result.grantedCoInventor);
      console.log('  ✅ Filed Patent:', result.filedPatent);
      console.log('  ✅ Significant Contribution:', result.significantContribution);
      
      // =====================================================================
      // DETAILED PATENT BREAKDOWN
      // =====================================================================
      if (result.patentDetails) {
        console.log('\n📈 DETAILED BREAKDOWN:');
        console.log('  🔍 Profile Matches Found:', result.patentDetails.profileMatchesFound);
        console.log('  🥇 Has Granted (First Inventor):', result.patentDetails.hasGrantedFirstInventor);
        console.log('  🥈 Has Granted (Co-Inventor):', result.patentDetails.hasGrantedCoInventor);
        console.log('  📄 Has Filed Patents:', result.patentDetails.hasFiledPatent);
        
        // Show sample patents
        if (result.patentDetails.samplePatents && result.patentDetails.samplePatents.length > 0) {
          console.log('\n📑 SAMPLE MATCHING PATENTS:');
          result.patentDetails.samplePatents.slice(0, 3).forEach((patent, idx) => {
            console.log(`  ${idx + 1}. ${patent.title}`);
            console.log(`     Classification: ${patent.classification}`);
            console.log(`     Reasoning: ${patent.reasoning}`);
          });
        }
      }
      
      // =====================================================================
      // SCORING SYSTEM COMPATIBILITY
      // =====================================================================
      console.log('\n🎯 SCORING SYSTEM COMPATIBILITY:');
      const { calculatePatentsScore } = require('./utils/scoringEngine');
      
      const patentData = {
        grantedFirstInventor: result.grantedFirstInventor,
        grantedCoInventor: result.grantedCoInventor,
        filedPatent: result.filedPatent,
        significantContribution: result.significantContribution
      };
      
      const patentScore = calculatePatentsScore(patentData);
      console.log('  📊 Patent Score:', patentScore, '/10');
      
      // Show scoring breakdown
      if (result.grantedFirstInventor) {
        console.log('  🏆 Granted (First Inventor): 10 points');
      } else if (result.grantedCoInventor) {
        console.log('  🥈 Granted (Co-Inventor): 5 points');
      } else if (result.filedPatent) {
        console.log('  📄 Filed Patent: 2 points');
      } else {
        console.log('  ❌ No Patents: 0 points');
      }
      
      if (result.significantContribution && patentScore > 0) {
        console.log('  ⭐ Significant Contribution Bonus: +2 points (capped at 10)');
      }
      
      // =====================================================================
      // EXTRACTION METADATA
      // =====================================================================
      console.log('\n🔍 EXTRACTION METADATA:');
      console.log('  🤖 Method:', result.extractionMethod);
      console.log('  🎯 Analysis Confidence:', result.analysisConfidence || 'N/A');
      console.log('  🔍 Searched Name:', result.searchedName || 'N/A');
      console.log('  ⏱️ Processing Time:', `${endTime - startTime}ms`);
      console.log('  📅 Extraction Date:', result.extractionDate);
      
      if (result.error) {
        console.log('  ❌ Error:', result.error);
      }
      
      // Show cache usage for this test
      const currentStats = getCacheStats();
      if (currentStats && currentStats.totalFiles > 0) {
        console.log(`  💾 Cache Files: ${currentStats.totalFiles} (${currentStats.totalSizeKB} KB)`);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    console.log('=' .repeat(80));
    
    // Add delay between tests to avoid rate limiting
    if (i < testProfiles.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Patent Parser Test Completed!');
  console.log('📝 Summary: Tests validate SerpAPI integration, Ollama patent analysis, and caching system');
  
  // Show final cache stats
  const finalStats = getCacheStats();
  if (finalStats && finalStats.totalFiles > 0) {
    console.log(`💾 Final Cache: ${finalStats.totalFiles} files, ${finalStats.totalSizeKB} KB`);
    console.log(`💡 Tip: Run this test again to see cache hits and faster performance!`);
  }
}

/**
 * Test complete API integration with all components
 */
async function testCompleteIntegration() {
  console.log('\n🚀 Testing Complete Integration (Education + Publications + Patents)');
  console.log('=' .repeat(80));
  
  const testProfile = {
    name: 'Dr. Geoffrey Hinton',
    education: 'PhD in Computer Science from University of Edinburgh',
    experience: 'Professor Emeritus at University of Toronto, VP and Engineering Fellow at Google',
    background: 'Pioneer in deep learning and neural networks, known for backpropagation algorithm'
  };
  
  console.log('📝 Test Profile:');
  console.log(JSON.stringify(testProfile, null, 2));
  
  try {
    console.log('\n🔍 Step 1: Education Extraction...');
    const { parseEducation } = require('./utils/aiProfileParser');
    const education = await parseEducation(testProfile);
    
    console.log('✅ Education Results:');
    console.log('  Name:', education.name);
    console.log('  Degree:', education.degree);
    console.log('  Institute:', education.institute);
    console.log('  Field:', education.fieldOfStudy);
    
    console.log('\n🔍 Step 2: Publications Extraction...');
    const { parsePublications } = require('./utils/publicationsParser');
    const publications = await parsePublications(testProfile);
    
    console.log('✅ Publications Results:');
    console.log('  Papers:', publications.numberOfPublications);
    console.log('  Citations:', publications.citations);
    console.log('  H-Index:', publications.hIndex);
    console.log('  Experience Bracket:', publications.experienceBracket);
    
    console.log('\n🔍 Step 3: Patents Extraction...');
    const patents = await parsePatents(testProfile);
    
    console.log('✅ Patents Results:');
    console.log('  Granted (First):', patents.grantedFirstInventor);
    console.log('  Granted (Co):', patents.grantedCoInventor);
    console.log('  Filed:', patents.filedPatent);
    console.log('  Significant:', patents.significantContribution);
    
    console.log('\n🔍 Step 4: Complete Scoring...');
    const { calculateTotalScore } = require('./utils/scoringEngine');
    
    const completeProfile = {
      name: education.name,
      education: {
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        instituteTier: education.instituteTier
      },
      publications: {
        topAIConferences: publications.topAIConferences || [],
        otherAIConferences: publications.otherAIConferences || [],
        reputableJournals: publications.reputableJournals || [],
        numberOfPublications: publications.numberOfPublications || 0,
        citations: publications.citations || 0
      },
      patents: {
        grantedFirstInventor: patents.grantedFirstInventor,
        grantedCoInventor: patents.grantedCoInventor,
        filedPatent: patents.filedPatent,
        significantContribution: patents.significantContribution
      },
      hIndex: publications.hIndex || 0,
      experienceBracket: publications.experienceBracket || '10+',
      workExperience: {
        topAIOrganizations: ['Google'],
        impactQuality: 4,
        mentorshipRole: true,
        dlFrameworks: ['TensorFlow'],
        programmingLanguages: ['Python']
      }
    };
    
    const scoringResult = calculateTotalScore(completeProfile);
    
    console.log('✅ Final Scoring Results:');
    console.log('  Total Score:', scoringResult.totalScore, '/10');
    console.log('  Grade:', scoringResult.grade);
    console.log('  Education:', scoringResult.breakdown.education.raw, '→', scoringResult.breakdown.education.weighted);
    console.log('  Publications:', scoringResult.breakdown.publications.raw, '→', scoringResult.breakdown.publications.weighted);
    console.log('  Patents:', scoringResult.breakdown.patents.raw, '→', scoringResult.breakdown.patents.weighted);
    console.log('  Experience:', scoringResult.breakdown.workExperience.raw, '→', scoringResult.breakdown.workExperience.weighted);
    
    console.log('\n🎉 Complete Integration Test Successful!');
    
  } catch (error) {
    console.error('❌ Complete Integration Test Failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  testPatentParser()
    .then(() => testCompleteIntegration())
    .then(() => {
      console.log('\n✅ All patent parser tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testPatentParser }; 