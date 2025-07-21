/**
 * Terminal Test for LinkedIn Profile Evaluation
 * Usage: node testLinkedInEvaluation.js <linkedin_id_or_username>
 */

const path = require('path');

// Require modules from server directory
const serverPath = path.join(__dirname, '../server');
const { evaluateLinkedInProfile } = require(path.join(serverPath, 'routes/evaluation'));

async function testLinkedInEvaluation() {
  // Get LinkedIn ID from command line arguments
  const linkedinId = process.argv[2];
  
  if (!linkedinId) {
    console.log('❌ Please provide a LinkedIn ID or username');
    console.log('Usage: node testLinkedInEvaluation.js <linkedin_id_or_username>');
    console.log('Examples:');
    console.log('  node testLinkedInEvaluation.js parthapratimtalukdar');
    console.log('  node testLinkedInEvaluation.js 40340269');
    process.exit(1);
  }
  
  console.log('🚀 Testing LinkedIn Profile Evaluation');
  console.log('=' .repeat(60));
  console.log(`🔍 LinkedIn ID/Username: ${linkedinId}`);
  console.log('');
  
  try {
    // Test with default weights
    console.log('📊 Using default weights (Education: 25%, Patents: 13%, Publications: 30%, Work Experience: 30%, GitHub: 2%)');
    console.log('');
    
    const startTime = Date.now();
    const results = await evaluateLinkedInProfile(linkedinId);
    const endTime = Date.now();
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('✅ EVALUATION COMPLETED');
    console.log(`⏱️  Time taken: ${(endTime - startTime) / 1000}s`);
    console.log('=' .repeat(60));
    
    // Display results
    console.log('\n👤 PROFILE INFORMATION:');
    console.log(`Name: ${results.profileName}`);
    console.log(`LinkedIn ID: ${results.linkedinId}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📚 PARSING RESULTS:');
    
    // Education
    if (results.parsing.education) {
      const edu = results.parsing.education;
      console.log(`\n🎓 Education:`);
      console.log(`  Name: ${edu.name || 'N/A'}`);
      console.log(`  Degree: ${edu.degree || 'N/A'}`);
      console.log(`  Institute: ${edu.institute || 'N/A'}`);
      console.log(`  Field of Study: ${edu.fieldOfStudy || 'N/A'}`);
      console.log(`  Institute Tier: ${edu.instituteTier || 'N/A'}`);
    }
    
    // Publications
    if (results.parsing.publications) {
      const pub = results.parsing.publications;
      console.log(`\n📄 Publications:`);
      console.log(`  Number of Publications: ${pub.numberOfPublications || 0}`);
      console.log(`  Citations: ${pub.citations || 0}`);
      console.log(`  H-Index: ${pub.hIndex || 0}`);
      console.log(`  Experience Bracket: ${pub.experienceBracket || 'N/A'}`);
    }
    
    // Patents
    if (results.parsing.patents) {
      const pat = results.parsing.patents;
      console.log(`\n🔬 Patents:`);
      console.log(`  First Inventor: ${pat.grantedFirstInventor || 0}`);
      console.log(`  Co-Inventor: ${pat.grantedCoInventor || 0}`);
      console.log(`  Filed Patents: ${pat.filedPatent || 0}`);
    }
    
    // GitHub
    if (results.parsing.github) {
      const gh = results.parsing.github;
      console.log(`\n💻 GitHub:`);
      console.log(`  Username: ${gh.githubUsername || 'N/A'}`);
      console.log(`  Repo Volume: ${gh.repoVolume || 0}`);
      console.log(`  Popularity: ${gh.popularity || 0}`);
    }
    
    // Work Experience
    if (results.parsing.workExperience) {
      const we = results.parsing.workExperience;
      console.log(`\n💼 Work Experience:`);
      console.log(`  Top AI Organizations: ${we.topAIOrganizations || false}`);
      console.log(`  Impact Quality: ${we.impactQuality || 1}`);
      console.log(`  Mentorship Role: ${we.mentorshipRole || false}`);
    }
    
    // Scoring
    if (results.scoring) {
      const score = results.scoring;
      console.log('\n🎯 FINAL SCORING:');
      console.log(`Total Score: ${score.totalScore}/${score.maxPossibleScore} (${score.percentage}%)`);
      console.log(`Grade: ${score.grade}`);
      
      if (score.breakdown) {
        console.log('\n📊 Score Breakdown:');
        Object.entries(score.breakdown).forEach(([component, data]) => {
          console.log(`  ${component.charAt(0).toUpperCase() + component.slice(1)}:`);
          console.log(`    Raw: ${data.raw}/10`);
          console.log(`    Weighted: ${data.weighted} (${(data.weight * 100).toFixed(0)}% weight)`);
        });
      }
    }
    
    console.log('\n📋 FULL RESULTS (JSON):');
    console.log(results);
    
  } catch (error) {
    console.error('\n❌ EVALUATION FAILED:');
    console.error(error.message);
    console.error('\nFull error:', error);
  }
}

// Run the test if called directly
if (require.main === module) {
  testLinkedInEvaluation();
}

module.exports = {
  testLinkedInEvaluation
}; 