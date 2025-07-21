#!/usr/bin/env node

/**
 * Test file for HuggingFace ID / GitHub username extraction
 */

const { gethuggingid } = require('./utils/workExperienceParserV2');

// Test cases with various profile formats
const testProfiles = [
  // HuggingFace profile
  {
    name: "HuggingFace Profile Test",
    profile: `
      Dr. Sarah Chen - AI Research Scientist
      HuggingFace: https://huggingface.co/sarahchen
      Research focus: NLP and transformer models
      Published several models on Hugging Face platform
    `
  },
  
  // GitHub profile
  {
    name: "GitHub Profile Test", 
    profile: `
      John Doe - Machine Learning Engineer
      GitHub: github.com/johndoe
      Open source contributor with 50+ repositories
      Active in ML community
    `
  },
  
  // Both platforms
  {
    name: "Both Platforms Test",
    profile: `
      Alex Smith - AI Researcher
      GitHub: @alexsmith
      HuggingFace: huggingface.co/alex-smith
      Publications and code available on both platforms
    `
  },
  
  // JSON format profile
  {
    name: "JSON Profile Test",
    profile: {
      name: "Maria Garcia",
      bio: "AI Research at Meta",
      links: [
        "https://huggingface.co/maria-garcia",
        "Personal website: mariag.ai"
      ],
      experience: "5 years in NLP"
    }
  },
  
  // No social profiles - fallback to name
  {
    name: "No Social Profiles Test",
    profile: `
      Robert Wilson - Professor of Computer Science
      University of Stanford
      Research interests: Computer Vision, Deep Learning
      Email: rwilson@stanford.edu
    `
  },
  
  // JSON with name field - fallback test
  {
    name: "Fallback Name Test",
    profile: {
      name: "Dr. Emma Thompson",
      title: "Senior AI Researcher",
      institution: "MIT",
      email: "ethompson@mit.edu",
      research: "Natural Language Processing"
    }
  }
];

/**
 * Test the gethuggingid function with various profile formats
 */
async function runTests() {
  console.log('🧪 TESTING HUGGINGFACE ID / GITHUB USERNAME EXTRACTION');
  console.log('=' .repeat(70));
  
  try {
    for (let i = 0; i < testProfiles.length; i++) {
      const testCase = testProfiles[i];
      
      console.log(`\n🔍 Test ${i + 1}: ${testCase.name}`);
      console.log('-'.repeat(50));
      
      // Show input profile
      const profilePreview = typeof testCase.profile === 'string' 
        ? testCase.profile.substring(0, 100) + '...'
        : JSON.stringify(testCase.profile).substring(0, 100) + '...';
      console.log(`📄 Profile: ${profilePreview}`);
      
      try {
        const result = await gethuggingid(testCase.profile);
        
        console.log(`\n📊 Results:`);
        console.log(`  Found: ${result.found}`);
        if (result.found) {
          console.log(`  Platform: ${result.platform}`);
          console.log(`  Username: ${result.username}`);
          console.log(`  Confidence: ${result.confidence}`);
          console.log(`  Source: ${result.source_text?.substring(0, 80)}...`);
          console.log(`  Reasoning: ${result.reasoning}`);
        } else {
          console.log(`  Reasoning: ${result.reasoning}`);
        }
        console.log(`  Processing Time: ${result.processingTime}ms`);
        
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
      }
      
      // Add delay between tests to avoid overwhelming LLM
      if (i < testProfiles.length - 1) {
        console.log(`\n⏳ Waiting 2 seconds before next test...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n\n🎉 All tests completed!');
    console.log('\n📝 Usage Example:');
    console.log('```javascript');
    console.log('const { gethuggingid } = require("./utils/workExperienceParserV2");');
    console.log('');
    console.log('const result = await gethuggingid(profileData);');
    console.log('if (result.found) {');
    console.log('  console.log(`Found ${result.platform} ID: ${result.username}`);');
    console.log('}');
    console.log('```');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ Test suite completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testProfiles
}; 