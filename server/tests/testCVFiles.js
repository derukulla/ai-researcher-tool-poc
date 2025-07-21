/**
 * CV Files Test - Complete Profile Evaluation
 * Reads CV files from a directory and runs the entire AI researcher evaluation pipeline
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { parseEducation } = require('./utils/aiProfileParser');
const { parsePublications } = require('./utils/publicationsParser');
const { parsePatents } = require('./utils/patentParser');
const { parseWorkExperience } = require('./utils/workExperienceParser');
const { parseGitHub } = require('./utils/githubParser');
const { calculateTotalScore } = require('./utils/scoringEngine');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Directory containing CV files (you can change this path)
const CV_DIRECTORY = path.join(__dirname, '../profiles');

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx'];

// =============================================================================
// FILE READING FUNCTIONS
// =============================================================================

/**
 * Read all CV files from the specified directory
 * @returns {Promise<Array>} Array of file objects with name and content
 */
async function readCVFiles() {
  console.log(`📁 Reading CV files from: ${CV_DIRECTORY}`);
  
  if (!fs.existsSync(CV_DIRECTORY)) {
    console.error(`❌ Directory not found: ${CV_DIRECTORY}`);
    console.log('💡 Please create the directory or update the CV_DIRECTORY path in this script');
    return [];
  }
  
  const files = fs.readdirSync(CV_DIRECTORY);
  const cvFiles = [];
  
  for (const file of files) {
    const filePath = path.join(CV_DIRECTORY, file);
    const ext = path.extname(file).toLowerCase();
    
    // Skip non-supported files
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.log(`⏭️  Skipping unsupported file: ${file}`);
      continue;
    }
    
    // Skip directories
    if (fs.statSync(filePath).isDirectory()) {
      continue;
    }
    
    try {
      let content = '';
      
      if (ext === '.txt' || ext === '.md') {
        // Read text files directly
        content = fs.readFileSync(filePath, 'utf8');
      } else if (ext === '.pdf') {
        // Parse PDF files properly
        console.log(`📄 Parsing PDF file: ${file}`);
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        content = pdfData.text;
      } else {
        // For other file types (.doc, .docx), we'll just read as text for now
        // In a real implementation, you'd want to use proper parsers for DOC/DOCX
        console.log(`⚠️  Reading ${ext} file as text (may not work properly): ${file}`);
        content = fs.readFileSync(filePath, 'utf8');
      }
      
      cvFiles.push({
        name: file,
        path: filePath,
        content: content,
        extension: ext
      });
      
      console.log(`✅ Successfully read: ${file} (${content.length} characters)`);
      
    } catch (error) {
      console.error(`❌ Error reading file ${file}:`, error.message);
    }
  }
  
  console.log(`📊 Found ${cvFiles.length} readable CV files`);
  return cvFiles;
}

// =============================================================================
// COMPLETE PIPELINE TEST
// =============================================================================

/**
 * Run complete evaluation pipeline for a CV file
 * @param {object} cvFile - CV file object with name and content
 * @returns {Promise<object>} Complete evaluation results
 */
async function evaluateCV(cvFile) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 EVALUATING CV: ${cvFile.name}`);
  console.log(`📄 File: ${cvFile.path}`);
  console.log(`📝 Content length: ${cvFile.content.length} characters`);
  console.log(`${'='.repeat(80)}`);

  const results = {
    fileName: cvFile.name,
    filePath: cvFile.path,
    parsing: {},
    scoring: null,
    errors: []
  };

  try {
    // Step 1: Parse Education
    console.log('\n📚 Step 1: Parsing Education...');
    let researcherName = 'Unknown Researcher'; // fallback
    try {
      const education = await parseEducation(cvFile.content);
      results.parsing.education = education;
      // Extract the researcher name from education result
      if (education.name) {
        researcherName = education.name;
      }
      console.log(`✅ Education parsed: ${education.degree} from ${education.institute}`);
      console.log(`   📝 Researcher name extracted: ${researcherName}`);
    } catch (error) {
      console.error('❌ Education parsing failed:', error.message);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: null };
    }

    // Step 2: Parse Publications
    console.log('\n📄 Step 2: Parsing Publications...');
    try {
      const publications = await parsePublications({
        name: researcherName,
        education: results.parsing.education,
        profileData: cvFile.content
      });
      results.parsing.publications = publications;
      console.log(`✅ Publications parsed: ${publications.numberOfPublications} papers, ${publications.citations} citations, H-index: ${publications.hIndex}`);
    } catch (error) {
      console.error('❌ Publications parsing failed:', error.message);
      results.errors.push(`Publications: ${error.message}`);
      results.parsing.publications = { numberOfPublications: 0, citations: 0, hIndex: 0 };
    }

    // Step 3: Parse Patents
    console.log('\n🔬 Step 3: Parsing Patents...');
    try {
      const patents = await parsePatents({
        name: researcherName,
        education: results.parsing.education,
        profileData: cvFile.content
      });
      results.parsing.patents = patents;
      console.log(`✅ Patents parsed: ${patents.grantedFirstInventor} granted (first), ${patents.grantedCoInventor} granted (co), ${patents.filedPatent} filed`);
    } catch (error) {
      console.error('❌ Patents parsing failed:', error.message);
      results.errors.push(`Patents: ${error.message}`);
      results.parsing.patents = { grantedFirstInventor: 0, grantedCoInventor: 0, filedPatent: 0 };
    }

    // Step 4: Parse GitHub
    console.log('\n💻 Step 4: Parsing GitHub...');
    try {
      const github = await parseGitHub({
        name: researcherName,
        education: results.parsing.education,
        profileData: cvFile.content
      });
      results.parsing.github = github;
      if (github.githubUsername) {
        console.log(`✅ GitHub parsed: @${github.githubUsername}, ${github.repoVolume} repos, ${github.popularity} stars`);
      } else {
        console.log(`✅ GitHub parsed: No GitHub profile found`);
      }
    } catch (error) {
      console.error('❌ GitHub parsing failed:', error.message);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = { githubUsername: null, repoVolume: 0, popularity: 0 };
    }

    // Step 5: Parse Work Experience
    console.log('\n💼 Step 5: Parsing Work Experience...');
    try {
      const workExperience = await parseWorkExperience({
        name: researcherName,
        profileData: cvFile.content,
        publications: results.parsing.publications.articles,
        info: results.parsing.publications.author,
        github: results.parsing.github
      });
      results.parsing.workExperience = workExperience;
      console.log(`✅ Work experience parsed: ${workExperience.topAIOrganizations.length} top AI orgs, impact quality: ${workExperience.impactQuality}`);
    } catch (error) {
      console.error('❌ Work experience parsing failed:', error.message);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = { topAIOrganizations: [], impactQuality: 1, mentorshipRole: false };
    }

    // Step 6: Calculate Total Score
    console.log('\n🎯 Step 6: Calculating Total Score...');
    console.log("RESULTS:",results.parsing);
    try {
      const totalScore = await calculateTotalScore(
        results.parsing
      );
      results.scoring = totalScore;
      console.log(`✅ Total Score: ${totalScore.totalScore}/${totalScore.maxPossibleScore} (${totalScore.percentage.toFixed(1)}%)`);
    } catch (error) {
      console.error('❌ Scoring failed:', error.message);
      results.errors.push(`Scoring: ${error.message}`);
      results.scoring = { totalScore: 0, maxPossibleScore: 100, percentage: 0 };
    }

    // Summary
    console.log(`\n📊 EVALUATION SUMMARY FOR: ${cvFile.name}`);
    console.log("SCORING:",results.scoring);
    if (results.errors.length > 0) {
      console.log(`⚠️  Errors encountered: ${results.errors.length}`);
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Fatal error during evaluation:', error);
    results.errors.push(`Fatal: ${error.message}`);
    return results;
  }
}

// =============================================================================
// MAIN TEST FUNCTION
// =============================================================================

/**
 * Main function to test all CV files
 */
async function testAllCVFiles() {
  console.log('🚀 Starting CV Files Evaluation Test');
  console.log('=' .repeat(80));
  
  // Read all CV files
  const cvFiles = await readCVFiles();
  
  if (cvFiles.length === 0) {
    console.log('❌ No CV files found to test');
    console.log('💡 Make sure you have CV files in the downloads/profiles directory');
    console.log(`📁 Expected directory: ${CV_DIRECTORY}`);
    return;
  }
  
  const allResults = [];
  
  // Process each CV file
  for (let i = 0; i < cvFiles.length; i++) {
    const cvFile = cvFiles[i];
    console.log(`\n🔄 Processing CV ${i + 1}/${cvFiles.length}: ${cvFile.name}`);
    
    try {
      console.log("CV FILE:",cvFile);
      const results = await evaluateCV(cvFile);
      allResults.push(results);
      
      // Add a delay between evaluations to avoid overwhelming APIs
      if (i < cvFiles.length - 1) {
        console.log('⏳ Waiting 5 seconds before next CV...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.error(`❌ Failed to evaluate ${cvFile.name}:`, error);
      allResults.push({
        fileName: cvFile.name,
        filePath: cvFile.path,
        parsing: {},
        scoring: null,
        errors: [`Fatal error: ${error.message}`]
      });
    }
  }
  
  // Final Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 FINAL SUMMARY - ALL CV FILES');
  console.log(`${'='.repeat(80)}`);
  
  allResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.fileName}`);
    console.log(`   Score: ${result.scoring?.totalScore || 0}/${result.scoring?.maxPossibleScore || 100} (${result.scoring?.percentage?.toFixed(1) || 0}%)`);
    console.log(`   Errors: ${result.errors.length}`);
    if (result.parsing.education?.name) {
      console.log(`   Researcher: ${result.parsing.education.name}`);
    }
  });
  
  // Sort by score
  const sortedResults = allResults
    .filter(r => r.scoring && r.scoring.totalScore > 0)
    .sort((a, b) => b.scoring.totalScore - a.scoring.totalScore);
  
  if (sortedResults.length > 0) {
    console.log(`\n🏆 TOP PERFORMERS:`);
    sortedResults.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.parsing.education?.name || result.fileName}: ${result.scoring.totalScore} points (${result.scoring.percentage.toFixed(1)}%)`);
    });
  }
  
  console.log(`\n✅ Evaluation completed for ${allResults.length} CV files`);
  console.log(`📊 Average score: ${(allResults.reduce((sum, r) => sum + (r.scoring?.totalScore || 0), 0) / allResults.length).toFixed(1)} points`);
}

// =============================================================================
// RUN THE TEST
// =============================================================================

if (require.main === module) {
  testAllCVFiles().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testAllCVFiles,
  evaluateCV,
  readCVFiles
}; 