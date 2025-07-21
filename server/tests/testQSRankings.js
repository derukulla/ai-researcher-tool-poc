const { getRankingsStats, getUniversityRank, classifyInstituteTier } = require('./utils/qsRankings');
const { parseEducation } = require('./utils/profileParser');

function testQSRankings() {
  console.log('=== QS Rankings Integration Test ===\n');

  // Test 1: Get basic stats
  console.log('1. QS Rankings Stats:');
  const stats = getRankingsStats();
  console.log(stats);
  console.log('\n');

  // Test 2: Test individual university lookups
  console.log('2. Individual University Lookups:');
  const testUniversities = [
    'Stanford University',
    'MIT',
    'Harvard University',
    'Carnegie Mellon University',
    'University of Toronto',
    'University of Washington',
    'IIT Bombay',
    'Indian Institute of Science',
    'University of Oxford',
    'Cambridge University',
    'Unknown University'
  ];

  testUniversities.forEach(uni => {
    const rank = getUniversityRank(uni);
    console.log(`${uni}: ${rank ? `Rank ${rank.rank} (${rank.name})` : 'Not found'}`);
  });
  console.log('\n');

  // Test 3: Test tier classification
  console.log('3. Institute Tier Classification:');
  testUniversities.forEach(uni => {
    const classification = classifyInstituteTier(uni);
    console.log(`${uni}: ${classification.tier} ${classification.found ? `(Rank: ${classification.rank})` : '(Not found)'}`);
  });
  console.log('\n');

  // Test 4: Test with education parser
  console.log('4. Education Parser with QS Rankings:');
  const testProfiles = [
    'PhD in Computer Science from Stanford University',
    'Master of Science from MIT',
    'Bachelor of Technology from IIT Bombay',
    'Currently pursuing PhD at University of Toronto',
    'MS in Data Science from University of Washington'
  ];

  testProfiles.forEach(profile => {
    const education = parseEducation(profile);
    console.log(`Profile: "${profile}"`);
    console.log(`  Institute: ${education.institute}`);
    console.log(`  Tier: ${education.instituteTier}`);
    if (education.qsRank) {
      console.log(`  QS Rank: ${education.qsRank} (${education.qsRankOriginal})`);
      console.log(`  Matched: ${education.qsMatchedName}`);
    }
    console.log('');
  });
}

// Run the test
if (require.main === module) {
  testQSRankings();
}

module.exports = { testQSRankings }; 