const { parsePublications } = require('./utils/publicationsParser');

async function testSerpAPIPublications() {
  console.log('🧪 Testing SerpAPI Google Scholar Publications Parser');
  console.log('=' .repeat(60));
  
  const testProfile = {
    name: 'Geoffrey Hinton',
    affiliation: 'University of Toronto',
    field: 'AI'
  };
  
  try {
    console.log('🔍 Testing with profile:', testProfile);
    
    const result = await parsePublications(testProfile);
    
    console.log('\n✅ Results:');
    console.log('📊 Publications:', result.numberOfPublications);
    console.log('📈 Citations:', result.citations);
    console.log('🏆 H-Index:', result.hIndex);
    console.log('⏱️ Experience:', result.experienceBracket);
    console.log('🎯 Confidence:', result.matchConfidence);
    console.log('📝 Method:', result.extractionMethod);
    
    console.log('\n🏷️ Venue Quality:');
    console.log('  Top AI Conferences:', result.venueQuality.hasTopAIConference);
    console.log('  Other AI Conferences:', result.venueQuality.hasOtherAIConference);
    console.log('  Reputable Journals:', result.venueQuality.hasReputableJournal);
    console.log('  Other Peer-Reviewed:', result.venueQuality.hasOtherPeerReviewed);
    console.log('  Summary:', result.venueQuality.summary);
    
    console.log('\n📄 Sample Publications:');
    if (result.detailedPublications.recentPublications) {
      result.detailedPublications.recentPublications.slice(0, 3).forEach((pub, index) => {
        console.log(`  ${index + 1}. ${pub.title} (${pub.publication}, ${pub.year})`);
      });
    }
    
    console.log('\n🔍 Enhanced Profile Details:');
    if (result.detailedPublications.enhancedProfile) {
      const profile = result.detailedPublications.enhancedProfile;
      console.log(`  Name: ${profile.name}`);
      console.log(`  Affiliation: ${profile.affiliation || 'Not specified'}`);
      console.log(`  Research Interests: ${profile.interests.join(', ') || 'Not specified'}`);
      console.log(`  Profiles Compared: ${result.profilesCompared}`);
      console.log(`  Match Reason: ${result.matchReason}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSerpAPIPublications(); 