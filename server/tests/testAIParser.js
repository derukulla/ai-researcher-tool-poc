// =============================================================================
// TEST SCRIPT FOR AI-POWERED PROFILE PARSER
// =============================================================================
// This script tests the new Gemini AI-based profile parser
// Run with: node testAIParser.js

const { testEducationExtraction } = require('./utils/aiProfileParser');

async function main() {
  console.log('🚀 Testing AI-Powered Profile Parser');
  console.log('====================================');
  
  try {
    await testEducationExtraction();
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('\n📝 Setup Instructions:');
      console.log('1. Get your Gemini API key from: https://makersuite.google.com/app/apikey');
      console.log('2. Add it to your .env file: GEMINI_API_KEY=your_api_key_here');
      console.log('3. Run the test again: node testAIParser.js');
    }
  }
}

main(); 