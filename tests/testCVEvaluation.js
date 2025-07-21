/**
 * Terminal Test for CV File Evaluation
 * Usage: node testCVEvaluation.js <cv_file_path>
 */

const fs = require('fs');
const path = require('path');

// Require modules from server directory
const serverPath = path.join(__dirname, '../server');
const pdfParse = require(path.join(serverPath, 'node_modules/pdf-parse'));
const { parseEducation } = require(path.join(serverPath, 'utils/aiProfileParser'));
const { parsePublications } = require(path.join(serverPath, 'utils/publicationsParser'));
const { parsePatents } = require(path.join(serverPath, 'utils/patentParser'));
const { parseWorkExperience } = require(path.join(serverPath, 'utils/workExperienceParser'));
const { parseGitHub } = require(path.join(serverPath, 'utils/githubParser'));
const { calculateTotalScore } = require(path.join(serverPath, 'utils/scoringEngine'));

/**
 * Read file content based on file type
 */
async function readFileContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  } else if (ext === '.doc' || ext === '.docx') {
    // For now, just read as text (you might want to add proper DOC parsing)
    throw new Error('DOC/DOCX files not supported in terminal test. Please convert to PDF or TXT.');
  } else {
    throw new Error(`Unsupported file type: ${ext}. Supported types: .pdf, .txt`);
  }
}

/**
 * Run complete evaluation pipeline for CV file
 */
async function evaluateCV(filePath, fileName, weights = null) {
  console.log(`🔍 EVALUATING CV FILE: ${fileName}`);
  
  const results = {
    fileName: fileName,
    profileName: null,
    parsing: {},
    scoring: null,
    errors: []
  };

  try {
    // Read file content
    console.log('📄 Step 0: Reading CV file...');
    const fileContent = await readFileContent(filePath);
    console.log(`✅ File read successfully (${fileContent.length} characters)`);
    
    let researcherName = 'Unknown Researcher';

    // Step 1: Parse Education
    console.log('📚 Step 1: Parsing Education...');
    try {
      const education = await parseEducation(fileContent);
      results.parsing.education = education;
      if (education.name && education.name !== 'Unknown') {
        researcherName = education.name;
        results.profileName = education.name;
      }
      console.log(`✅ Education parsed: ${education.degree || 'N/A'} from ${education.institute || 'N/A'}`);
    } catch (error) {
      console.error('❌ Education parsing failed:', error.message);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: researcherName };
      
      // Check for critical error
      if (error.message.includes('SERPAPI_RATE_LIMIT') || 
          error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
          error.message.includes('SERPAPI_SERVER_ERROR') ||
          error.message.includes('SERPAPI_NETWORK_ERROR')) {
        return results; // Return immediately for critical errors
      }
    }

    // Step 2: Parse Publications
    console.log('📄 Step 2: Parsing Publications...');
    try {
      const publications = await parsePublications({
        name: researcherName,
        education: results.parsing.education,
        profileData: fileContent
      });
      results.parsing.publications = publications;
      console.log(`✅ Publications parsed: ${publications.numberOfPublications} papers`);
    } catch (error) {
      console.error('❌ Publications parsing failed:', error.message);
      
      // Check if it's a critical error
      if (error.message.includes('SERPAPI_RATE_LIMIT') || 
          error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
          error.message.includes('SERPAPI_SERVER_ERROR') ||
          error.message.includes('SERPAPI_NETWORK_ERROR')) {
        
        results.errors.push(`Publications: ${error.message}`);
        results.parsing.publications = { numberOfPublications: 0, citations: 0, hIndex: 0 };
        console.error('🚨 CRITICAL ERROR - Cannot continue due to rate limit');
        return results; // Return immediately for critical errors
      }
      
      results.errors.push(`Publications: ${error.message}`);
      results.parsing.publications = { numberOfPublications: 0, citations: 0, hIndex: 0 };
    }

    // Step 3: Parse Patents
    console.log('🔬 Step 3: Parsing Patents...');
    try {
      const patents = await parsePatents({
        name: researcherName,
        education: results.parsing.education,
        profileData: fileContent
      });
      results.parsing.patents = patents;
      console.log(`✅ Patents parsed: ${patents.grantedFirstInventor} granted (first)`);
    } catch (error) {
      console.error('❌ Patents parsing failed:', error.message);
      
      // Check if it's a critical error
      if (error.message.includes('SERPAPI_RATE_LIMIT') || 
          error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
          error.message.includes('SERPAPI_SERVER_ERROR') ||
          error.message.includes('SERPAPI_NETWORK_ERROR')) {
        
        results.errors.push(`Patents: ${error.message}`);
        results.parsing.patents = { grantedFirstInventor: 0, grantedCoInventor: 0, filedPatent: 0 };
        console.error('🚨 CRITICAL ERROR - Cannot continue due to rate limit');
        return results; // Return immediately for critical errors
      }
      
      results.errors.push(`Patents: ${error.message}`);
      results.parsing.patents = { grantedFirstInventor: 0, grantedCoInventor: 0, filedPatent: 0 };
    }

    // Step 4: Parse GitHub
    console.log('💻 Step 4: Parsing GitHub...');
    try {
      const github = await parseGitHub({
        name: researcherName,
        education: results.parsing.education,
        profileData: fileContent
      });
      results.parsing.github = github;
      console.log(`✅ GitHub parsed: ${github.githubUsername || 'No username found'}`);
    } catch (error) {
      console.error('❌ GitHub parsing failed:', error.message);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = { githubUsername: null, analysis: {} };
    }

    // Step 5: Parse Work Experience
    console.log('💼 Step 5: Parsing Work Experience...');
    try {
      const workExperience = await parseWorkExperience({
        name: researcherName,
        education: results.parsing.education,
        profileData: fileContent
      });
      results.parsing.workExperience = workExperience;
      console.log(`✅ Work Experience parsed: Impact Quality ${workExperience.impactQuality}/4`);
    } catch (error) {
      console.error('❌ Work Experience parsing failed:', error.message);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = { topAIOrganizations: false, impactQuality: 1, mentorshipRole: false };
    }

    // Step 6: Calculate Final Score
    console.log('🎯 Step 6: Calculating Final Score...');
    try {
      const scoring = await calculateTotalScore(results.parsing, weights);
      results.scoring = scoring;
      console.log(`✅ Scoring completed: ${scoring.totalScore}/${scoring.maxPossibleScore} (${scoring.percentage}%)`);
    } catch (error) {
      console.error('❌ Scoring failed:', error.message);
      results.errors.push(`Scoring: ${error.message}`);
      results.scoring = { totalScore: 0, maxPossibleScore: 100, percentage: 0 };
    }

    return results;

  } catch (error) {
    console.error('❌ Fatal error during CV evaluation:', error);
    results.errors.push(`Fatal: ${error.message}`);
    return results;
  }
}

async function testCVEvaluation() {
  // Get CV file path from command line arguments
  const cvFilePath = process.argv[2];
  
  if (!cvFilePath) {
    console.log('❌ Please provide a CV file path');
    console.log('Usage: node testCVEvaluation.js <cv_file_path>');
    console.log('Examples:');
    console.log('  node testCVEvaluation.js ./profiles/resume.pdf');
    console.log('  node testCVEvaluation.js /path/to/cv.txt');
    console.log('');
    console.log('Supported file types: .pdf, .txt');
    process.exit(1);
  }
  
  // Resolve file path - if relative, resolve from current working directory
  // if absolute, use as-is
  const resolvedPath = path.resolve(cvFilePath);
  
  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    console.log(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }
  
  const fileName = path.basename(resolvedPath);
  const fullPath = resolvedPath;
  
  console.log('🚀 Testing CV File Evaluation');
  console.log('=' .repeat(60));
  console.log(`📁 File: ${fileName}`);
  console.log(`📍 Path: ${fullPath}`);
  console.log('');
  
  try {
    // Test with default weights
    console.log('📊 Using default weights (Education: 25%, Patents: 13%, Publications: 30%, Work Experience: 30%, GitHub: 2%)');
    console.log('');
    
    const startTime = Date.now();
    const results = await evaluateCV(fullPath, fileName);
    const endTime = Date.now();
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('✅ EVALUATION COMPLETED');
    console.log(`⏱️  Time taken: ${(endTime - startTime) / 1000}s`);
    console.log('=' .repeat(60));
    
    // Display results
    console.log('\n👤 PROFILE INFORMATION:');
    console.log(`Name: ${results.profileName || 'Unknown'}`);
    console.log(`File: ${results.fileName}`);
    
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
      console.log(`  AI Relevance: ${edu.aiRelevance || 'N/A'}`);
    }
    
    // Publications
    if (results.parsing.publications) {
      const pub = results.parsing.publications;
      console.log(`\n📄 Publications:`);
      console.log(`  Number of Publications: ${pub.numberOfPublications || 0}`);
      console.log(`  Citations: ${pub.citations || 0}`);
      console.log(`  H-Index: ${pub.hIndex || 0}`);
      console.log(`  Experience Bracket: ${pub.experienceBracket || 'N/A'}`);
      console.log(`  Match Confidence: ${pub.matchConfidence || 'N/A'}`);
      if (pub.venueQuality) {
        console.log(`  Venue Quality: ${pub.venueQuality.summary || 'N/A'}`);
      }
    }
    
    // Patents
    if (results.parsing.patents) {
      const pat = results.parsing.patents;
      console.log(`\n🔬 Patents:`);
      console.log(`  First Inventor: ${pat.grantedFirstInventor || 0}`);
      console.log(`  Co-Inventor: ${pat.grantedCoInventor || 0}`);
      console.log(`  Filed Patents: ${pat.filedPatent || 0}`);
      console.log(`  Extraction Method: ${pat.extractionMethod || 'N/A'}`);
    }
    
    // GitHub
    if (results.parsing.github) {
      const gh = results.parsing.github;
      console.log(`\n💻 GitHub:`);
      console.log(`  Username: ${gh.githubUsername || 'N/A'}`);
      if (gh.analysis) {
        console.log(`  Repo Volume: ${gh.analysis.repoVolume || 0}`);
        console.log(`  Popularity: ${gh.analysis.popularity || 0}`);
        console.log(`  Commit Frequency: ${gh.analysis.commitFrequency || 'N/A'}`);
      }
    }
    
    // Work Experience
    if (results.parsing.workExperience) {
      const we = results.parsing.workExperience;
      console.log(`\n💼 Work Experience:`);
      console.log(`  Top AI Organizations: ${we.topAIOrganizations || false}`);
      console.log(`  Impact Quality: ${we.impactQuality || 1}/4`);
      console.log(`  Mentorship Role: ${we.mentorshipRole || false}`);
      console.log(`  DL Frameworks: ${we.dlFrameworks || false}`);
      console.log(`  Extraction Method: ${we.extractionMethod || 'N/A'}`);
    }
    
    // Scoring
    if (results.scoring) {
      const score = results.scoring;
      console.log('\n🎯 FINAL SCORING:');
      console.log(`Total Score: ${score.totalScore}/${score.maxPossibleScore} (${score.percentage}%)`);
      console.log(`Grade: ${score.grade || 'N/A'}`);
      
      if (score.breakdown) {
        console.log('\n📊 Score Breakdown:');
        Object.entries(score.breakdown).forEach(([component, data]) => {
          console.log(`  ${component.charAt(0).toUpperCase() + component.slice(1)}:`);
          console.log(`    Raw: ${data.raw}/10`);
          console.log(`    Weighted: ${data.weighted} (${(data.weight * 100).toFixed(0)}% weight)`);
        });
        
        console.log('\n📐 Calculation:');
        const calculation = Object.entries(score.breakdown)
          .map(([_, data]) => data.weighted)
          .join(' + ');
        console.log(`  ${calculation} = ${score.totalScore}/10`);
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
  testCVEvaluation();
}

module.exports = {
  testCVEvaluation,
  evaluateCV,
  readFileContent
}; 