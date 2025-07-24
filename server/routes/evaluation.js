const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { parseEducation } = require('../utils/aiProfileParser');
const { parsePublications } = require('../utils/publicationsParser');
const { parsePatents } = require('../utils/patentParser');
const { parseWorkExperience } = require('../utils/workExperienceParser');
const { parseGitHub } = require('../utils/githubParser');
const { calculateTotalScore } = require('../utils/scoringEngine');
const { formatLinkedInProfile, createProfileSummary, getProfileStats } = require('../utils/linkedinFormatter');
const { getCachedProfile, setCachedProfile } = require('../utils/linkedinCache');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * Read file content based on file type
 */
async function readFileContent(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else {
      // For .txt, .doc, .docx files, read as text
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read ${ext} file: ${error.message}`);
  }
}

/**
 * Run complete evaluation pipeline for uploaded CV
 */
async function evaluateCV(filePath, originalName, weights = null) {
  console.log(`🔍 EVALUATING CV: ${originalName}`);
  
  const results = {
    fileName: originalName,
    filePath: filePath,
    parsing: {},
    scoring: null,
    errors: []
  };

  try {
    // Read file content
    const fileContent = await readFileContent(filePath, originalName);
    console.log(`📝 File content length: ${fileContent.length} characters`);

    let researcherName = 'Unknown Researcher';

    // Step 1: Parse Education
    console.log('📚 Step 1: Parsing Education...');
    try {
      const education = await parseEducation(fileContent);
      results.parsing.education = education;
      if (education.name) {
        researcherName = education.name;
      }
      console.log(`✅ Education parsed: ${education.degree} from ${education.institute}`);
    } catch (error) {
      console.error('❌ Education parsing failed:', error.message);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: null };
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
      console.error('🔍 Checking for critical error patterns in:', error.message);
      
      // Check if it's a critical error (rate limit, network, etc.) that should be returned to frontend
      const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                             error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                             error.message.includes('SERPAPI_SERVER_ERROR') ||
                             error.message.includes('SERPAPI_NETWORK_ERROR') ||
                             error.message.includes('rate limit') || 
                             error.message.includes('quota exceeded') || 
                             error.message.includes('service temporarily unavailable') ||
                             error.message.includes('Unable to connect');
      
      if (isCriticalError) {
        console.error('🚨 CRITICAL ERROR DETECTED - Returning immediately to frontend');
        
        // For critical errors, return error response immediately
        return {
          fileName: fileName,
          profileName: results.profileName,
          parsing: results.parsing,
          scoring: null,
          errors: [...results.errors, `Publications: ${error.message}`],
          criticalError: true,
          criticalErrorType: error.message.includes('SERPAPI_RATE_LIMIT') || error.message.includes('rate limit') ? 'rate_limit' : 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || error.message.includes('quota exceeded') ? 'quota_exceeded' :
                           error.message.includes('SERPAPI_NETWORK_ERROR') || error.message.includes('network') ? 'network' : 'server'
        };
      }
      
      console.error('📝 Non-critical error - continuing with fallback values');
      
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
      console.error('🔍 Checking for critical error patterns in:', error.message);
      
      // Check if it's a critical error (rate limit, network, etc.) that should be returned to frontend
      const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                             error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                             error.message.includes('SERPAPI_SERVER_ERROR') ||
                             error.message.includes('SERPAPI_NETWORK_ERROR') ||
                             error.message.includes('rate limit') || 
                             error.message.includes('quota exceeded') || 
                             error.message.includes('service temporarily unavailable') ||
                             error.message.includes('Unable to connect');
      
      if (isCriticalError) {
        console.error('🚨 CRITICAL ERROR DETECTED - Returning immediately to frontend');
        
        // For critical errors, return error response immediately
        return {
          fileName: fileName,
          profileName: results.profileName,
          parsing: results.parsing,
          scoring: null,
          errors: [...results.errors, `Patents: ${error.message}`],
          criticalError: true,
          criticalErrorType: error.message.includes('SERPAPI_RATE_LIMIT') || error.message.includes('rate limit') ? 'rate_limit' : 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || error.message.includes('quota exceeded') ? 'quota_exceeded' :
                           error.message.includes('SERPAPI_NETWORK_ERROR') || error.message.includes('network') ? 'network' : 'server'
        };
      }
      
      console.error('📝 Non-critical error - continuing with fallback values');
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
      console.log(`✅ GitHub parsed: ${github.githubUsername || 'No profile found'}`);
    } catch (error) {
      console.error('❌ GitHub parsing failed:', error.message);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = { githubUsername: null, repoVolume: 0, popularity: 0 };
    }

    // Step 5: Parse Work Experience
    console.log('💼 Step 5: Parsing Work Experience...');
    try {
      const workExperience = await parseWorkExperience({
        name: researcherName,
        profileData: fileContent,
        publications: results.parsing.publications.articles,
        info: results.parsing.publications.author,
        github: results.parsing.github
      });
      results.parsing.workExperience = workExperience;
      console.log(`✅ Work experience parsed: top AI orgs: ${workExperience.topAIOrganizations}`);
    } catch (error) {
      console.error('❌ Work experience parsing failed:', error.message);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = { topAIOrganizations: false, impactQuality: 1, mentorshipRole: false };
    }

    // Step 6: Calculate Total Score
    console.log('🎯 Step 6: Calculating Total Score...');
    try {
      const totalScore = await calculateTotalScore(results.parsing, weights);
      results.scoring = totalScore;
      console.log(`✅ Total Score: ${totalScore.totalScore}/${totalScore.maxPossibleScore}`);
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

/**
 * Run complete evaluation pipeline for LinkedIn profile
 */
async function evaluateLinkedInProfile(linkedinId, weights = null) {
  console.log(`🔍 EVALUATING LINKEDIN PROFILE: ${linkedinId}`);
  
  const results = {
    linkedinId: linkedinId,
    profileName: null,
    parsing: {},
    scoring: null,
    errors: []
  };

  try {
    // Fetch LinkedIn profile
    const profileResult = await fetchLinkedInProfile(linkedinId);
    
    if (!profileResult.success) {
      results.errors.push(`Profile fetch: ${profileResult.error}`);
      return results;
    }

    const rawProfileData = profileResult.data;
    
    // Format LinkedIn profile to extract only relevant fields
    console.log('🔧 Formatting LinkedIn profile data...');
    const formattedProfile = formatLinkedInProfile(rawProfileData);
    const profileText = formattedProfile;
    results.profileName = formattedProfile.full_name || 'Unknown';
    let researcherName = formattedProfile.full_name || 'Unknown Researcher';
    

    // Step 1: Parse Education
    console.log('📚 Step 1: Parsing Education...');
    try {
      const education = await parseEducation(profileText);
      results.parsing.education = education;
      if (education.name && education.name !== 'Unknown') {
        researcherName = education.name;
      }
      console.log(`✅ Education parsed: ${education.degree || 'N/A'} from ${education.institute || 'N/A'}`);
    } catch (error) {
      console.error('❌ Education parsing failed:', error.message);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: researcherName };
    }

    // Step 2: Parse Publications
    console.log('📄 Step 2: Parsing Publications...');
    try {
      const publications = await parsePublications({
        name: researcherName,
        education: results.parsing.education,
        profileData: profileText
      });
      results.parsing.publications = publications;
      console.log(`✅ Publications parsed: ${publications.numberOfPublications} papers`);
    } catch (error) {
      console.error('❌ Publications parsing failed:', error.message);
      console.error('🔍 Checking for critical error patterns in:', error.message);
      
      // Check if it's a critical error (rate limit, network, etc.) that should be returned to frontend
      const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                             error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                             error.message.includes('SERPAPI_SERVER_ERROR') ||
                             error.message.includes('SERPAPI_NETWORK_ERROR') ||
                             error.message.includes('rate limit') || 
                             error.message.includes('quota exceeded') || 
                             error.message.includes('service temporarily unavailable') ||
                             error.message.includes('Unable to connect');
      
      if (isCriticalError) {
        console.error('🚨 CRITICAL ERROR DETECTED - Returning immediately to frontend');
        
        // For critical errors, return error response immediately
        return {
          linkedinId: linkedinId,
          profileName: results.profileName,
          parsing: results.parsing,
          scoring: null,
          errors: [...results.errors, `Publications: ${error.message}`],
          criticalError: true,
          criticalErrorType: error.message.includes('SERPAPI_RATE_LIMIT') || error.message.includes('rate limit') ? 'rate_limit' : 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || error.message.includes('quota exceeded') ? 'quota_exceeded' :
                           error.message.includes('SERPAPI_NETWORK_ERROR') || error.message.includes('network') ? 'network' : 'server'
        };
      }
      
      console.error('📝 Non-critical error - continuing with fallback values');
      
      results.errors.push(`Publications: ${error.message}`);
      results.parsing.publications = { numberOfPublications: 0, citations: 0, hIndex: 0 };
    }

    // Step 3: Parse Patents
    console.log('🔬 Step 3: Parsing Patents...');
    try {
      const patents = await parsePatents({
        name: researcherName,
        education: results.parsing.education,
        profileData: profileText
      });
      results.parsing.patents = patents;
      console.log(`✅ Patents parsed: ${patents.grantedFirstInventor} granted (first)`);
    } catch (error) {
      console.error('❌ Patents parsing failed:', error.message);
      console.error('🔍 Checking for critical error patterns in:', error.message);
      
      // Check if it's a critical error (rate limit, network, etc.) that should be returned to frontend
      const isCriticalError = error.message.includes('SERPAPI_RATE_LIMIT') || 
                             error.message.includes('SERPAPI_QUOTA_EXCEEDED') || 
                             error.message.includes('SERPAPI_SERVER_ERROR') ||
                             error.message.includes('SERPAPI_NETWORK_ERROR') ||
                             error.message.includes('rate limit') || 
                             error.message.includes('quota exceeded') || 
                             error.message.includes('service temporarily unavailable') ||
                             error.message.includes('Unable to connect');
      
      if (isCriticalError) {
        console.error('🚨 CRITICAL ERROR DETECTED - Returning immediately to frontend');
        
        // For critical errors, return error response immediately
        return {
          linkedinId: linkedinId,
          profileName: results.profileName,
          parsing: results.parsing,
          scoring: null,
          errors: [...results.errors, `Patents: ${error.message}`],
          criticalError: true,
          criticalErrorType: error.message.includes('SERPAPI_RATE_LIMIT') || error.message.includes('rate limit') ? 'rate_limit' : 
                           error.message.includes('SERPAPI_QUOTA_EXCEEDED') || error.message.includes('quota exceeded') ? 'quota_exceeded' :
                           error.message.includes('SERPAPI_NETWORK_ERROR') || error.message.includes('network') ? 'network' : 'server'
        };
      }
      
      console.error('📝 Non-critical error - continuing with fallback values');
      
      results.errors.push(`Patents: ${error.message}`);
      results.parsing.patents = { grantedFirstInventor: 0, grantedCoInventor: 0, filedPatent: 0 };
    }

    // Step 4: Parse GitHub
    console.log('💻 Step 4: Parsing GitHub...');
    try {
      const gitHubInput = {
        name: researcherName,
        education: results.parsing.education,
        profileData: profileText
      };
      
      // Add GitHub username from LinkedIn profile if available
      if (formattedProfile.github_username) {
        gitHubInput.githubUsername = formattedProfile.github_username;
        console.log(`🔗 Using GitHub username from LinkedIn: ${formattedProfile.github_username}`);
      }
      
      const github = await parseGitHub(gitHubInput);
      results.parsing.github = github;
      console.log(`✅ GitHub parsed: ${github.githubUsername || 'No profile found'}`);
    } catch (error) {
      console.error('❌ GitHub parsing failed:', error.message);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = { githubUsername: null, repoVolume: 0, popularity: 0 };
    }

    // Step 5: Parse Work Experience
    console.log('💼 Step 5: Parsing Work Experience...');
    try {
      const workExperience = await parseWorkExperience({
        name: researcherName,
        profileData: profileText,
        publications: results.parsing.publications.articles,
        info: results.parsing.publications.author,
        github: results.parsing.github
      });
      results.parsing.workExperience = workExperience;
      console.log(`✅ Work experience parsed: top AI orgs: ${workExperience.topAIOrganizations}`);
    } catch (error) {
      console.error('❌ Work experience parsing failed:', error.message);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = { topAIOrganizations: false, impactQuality: 1, mentorshipRole: false };
    }

    // Step 6: Calculate Total Score
    console.log('🎯 Step 6: Calculating Total Score...');
    try {
      const totalScore = await calculateTotalScore(results.parsing, weights);
      results.scoring = totalScore;
      console.log(`✅ Total Score: ${totalScore.totalScore}/${totalScore.maxPossibleScore}`);
    } catch (error) {
      console.error('❌ Scoring failed:', error.message);
      results.errors.push(`Scoring: ${error.message}`);
      results.scoring = { totalScore: 0, maxPossibleScore: 100, percentage: 0 };
    }

    return results;

  } catch (error) {
    console.error('❌ Fatal error during LinkedIn evaluation:', error);
    results.errors.push(`Fatal: ${error.message}`);
    return results;
  }
}

// People Data Labs API configuration
const { PDL_API_KEY } = require('../config/apiKeys');
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5/person/enrich';

/**
 * Fetch LinkedIn profile data using People Data Labs API with caching
 * @param {string} linkedinId - LinkedIn ID (without linkedin.com/in/)
 * @returns {Promise<object>} Profile data from PDL API or cache
 */
async function fetchLinkedInProfile(linkedinId) {
  console.log(`🔍 Fetching LinkedIn profile: ${linkedinId}`);
  
  // Check cache first
  const cachedProfile = getCachedProfile(linkedinId);
  if (cachedProfile) {
    console.log(`💾 Using cached LinkedIn profile: ${linkedinId}`);
    return {
      linkedinId,
      success: true,
      data: cachedProfile.data,
      error: null,
      fromCache: true
    };
  }
  
  try {
    const response = await axios.get(PDL_BASE_URL, {
      params: {
        profile: `linkedin.com/in/${linkedinId}`
      },
      headers: {
        'X-Api-Key': PDL_API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    if (response.data && response.data.status === 200) {
      console.log(`✅ Successfully fetched profile for: ${linkedinId}`);
      
      // Cache the successful result
      setCachedProfile(linkedinId, {
        rawData: response.data,
        data: response.data.data,
        fetchedAt: new Date().toISOString()
      });
      
      return {
        linkedinId,
        success: true,
        data: response.data.data,
        error: null,
        fromCache: false
      };
    } else {
      console.log(`⚠️ Profile not found for: ${linkedinId}`);
      return {
        linkedinId,
        success: false,
        data: null,
        error: 'Profile not found',
        fromCache: false
      };
    }
  } catch (error) {
    console.error(`❌ Error fetching profile for ${linkedinId}:`, error.message);
    
    // If API fails but we have a cached version, use it as fallback
    if (error.response?.status === 402 || error.response?.status === 429) {
      console.log(`🔄 API limit reached, checking for any cached version...`);
      const cachedProfile = getCachedProfile(linkedinId);
      if (cachedProfile) {
        console.log(`💾 Using cached LinkedIn profile as fallback: ${linkedinId}`);
        return {
          linkedinId,
          success: true,
          data: cachedProfile.data,
          error: null,
          fromCache: true,
          fallback: true
        };
      }
    }
    
    return {
      linkedinId,
      success: false,
      data: null,
      error: error.message,
      fromCache: false
    };
  }
}

/**
 * Convert PDL profile data to text format for processing
 * @param {object} profileData - Raw profile data from PDL API
 * @returns {string} Formatted profile text
 */
function formatProfileForProcessing(profileData) {
  if (!profileData) return '';
  
  let profileText = '';
  
  // Basic information
  if (profileData.full_name) {
    profileText += `Name: ${profileData.full_name}\n`;
  }
  
  if (profileData.headline) {
    profileText += `Headline: ${profileData.headline}\n`;
  }
  
  if (profileData.summary) {
    profileText += `Summary: ${profileData.summary}\n`;
  }
  
  // Education
  if (profileData.education && profileData.education.length > 0) {
    profileText += '\nEducation:\n';
    profileData.education.forEach(edu => {
      if (edu.school) {
        profileText += `- ${edu.school}`;
        if (edu.degree) profileText += ` - ${edu.degree}`;
        if (edu.field_of_study) profileText += ` in ${edu.field_of_study}`;
        if (edu.start_date) profileText += ` (${edu.start_date}`;
        if (edu.end_date) profileText += ` - ${edu.end_date})`;
        profileText += '\n';
      }
    });
  }
  
  // Experience
  if (profileData.experience && profileData.experience.length > 0) {
    profileText += '\nWork Experience:\n';
    profileData.experience.forEach(exp => {
      if (exp.company) {
        profileText += `- ${exp.title || 'Position'} at ${exp.company}`;
        if (exp.start_date) profileText += ` (${exp.start_date}`;
        if (exp.end_date) profileText += ` - ${exp.end_date})`;
        profileText += '\n';
        if (exp.summary) profileText += `  ${exp.summary}\n`;
      }
    });
  }
  
  // Skills
  if (profileData.skills && profileData.skills.length > 0) {
    profileText += '\nSkills:\n';
    profileData.skills.forEach(skill => {
      profileText += `- ${skill}\n`;
    });
  }
  
  // Interests
  if (profileData.interests && profileData.interests.length > 0) {
    profileText += '\nInterests:\n';
    profileData.interests.forEach(interest => {
      profileText += `- ${interest}\n`;
    });
  }
  
  return profileText;
}

// Routes

/**
 * POST /api/evaluation/cv
 * Upload and evaluate CV file
 */
router.post('/cv', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No CV file uploaded' 
      });
    }

    console.log(`📁 Received CV file: ${req.file.originalname}`);
    
    // Extract weights if provided
    let weights = null;
    if (req.body.weights) {
      try {
        weights = JSON.parse(req.body.weights);
        console.log('🎯 Using custom weights:', weights);
      } catch (error) {
        console.error('❌ Invalid weights format:', error.message);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid weights format' 
        });
      }
    }
    
    const results = await evaluateCV(req.file.path, req.file.originalname, weights);
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

    // Check if there was a critical error (rate limit, network, etc.)
    if (results.criticalError) {
      let statusCode = 500;
      let errorType = 'server';
      
      if (results.criticalErrorType === 'rate_limit') {
        statusCode = 429;
        errorType = 'rate_limit';
      } else if (results.criticalErrorType === 'quota_exceeded') {
        statusCode = 429;
        errorType = 'quota_exceeded';
      } else if (results.criticalErrorType === 'network') {
        statusCode = 503;
        errorType = 'network';
      }
      
      return res.status(statusCode).json({
        success: false,
        message: results.errors[results.errors.length - 1] || 'Evaluation failed due to external service error',
        error: results.errors[results.errors.length - 1],
        errorType: errorType,
        retryAfter: statusCode === 429 ? 3600 : 300, // 1 hour for rate limits, 5 min for others
        ...results
      });
    }

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ CV evaluation error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'CV evaluation failed',
      error: error.message
    });
  }
});

/**
 * POST /api/evaluation/linkedin
 * Evaluate LinkedIn profile
 */
router.post('/linkedin', async (req, res) => {
  try {
    const { linkedinId, weights } = req.body;
    
    if (!linkedinId || typeof linkedinId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn ID is required'
      });
    }

    console.log(`🔗 Evaluating LinkedIn profile: ${linkedinId}`);
    
    if (weights) {
      console.log('🎯 Using custom weights:', weights);
    }
    
    const results = await evaluateLinkedInProfile(linkedinId.trim(), weights);
    
    // Check if there was a critical error (rate limit, network, etc.)
    if (results.criticalError) {
      let statusCode = 500;
      let errorType = 'server';
      
      if (results.criticalErrorType === 'rate_limit') {
        statusCode = 429;
        errorType = 'rate_limit';
      } else if (results.criticalErrorType === 'quota_exceeded') {
        statusCode = 429;
        errorType = 'quota_exceeded';
      } else if (results.criticalErrorType === 'network') {
        statusCode = 503;
        errorType = 'network';
      }
      
      return res.status(statusCode).json({
        success: false,
        message: results.errors[results.errors.length - 1] || 'Evaluation failed due to external service error',
        error: results.errors[results.errors.length - 1],
        errorType: errorType,
        retryAfter: statusCode === 429 ? 3600 : 300, // 1 hour for rate limits, 5 min for others
        ...results
      });
    }
    
    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ LinkedIn evaluation error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'LinkedIn evaluation failed',
      error: error.message
    });
  }
});

module.exports = router;

// Export the evaluateLinkedInProfile function for direct use
module.exports.evaluateLinkedInProfile = evaluateLinkedInProfile; 