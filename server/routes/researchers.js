const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { Parser } = require('json2csv');
const { calculateTotalScore } = require('../utils/scoringEngine');
const { parseEducation } = require('../utils/aiProfileParser');
const { parsePublications } = require('../utils/publicationsParser');

// Sample data file path
const DATA_FILE = path.join(__dirname, '../data/researchers.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load sample data
async function loadResearchers(weights = null) {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const rawData = JSON.parse(data);
    
    // Apply scoring to each researcher with custom weights if provided
    return rawData.map(researcher => {
      const scoringResult = calculateTotalScore(researcher, weights);
      return {
        ...researcher,
        score: scoringResult.totalScore,
        grade: scoringResult.grade,
        scoreBreakdown: scoringResult.breakdown
      };
    });
  } catch (error) {
    // Return sample data if file doesn't exist
    return getSampleData(weights);
  }
}

// Save researchers data
async function saveResearchers(researchers) {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(researchers, null, 2));
}

// Sample data
function getSampleData(weights = null) {
  const rawData = [
    {
      id: 1,
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@example.com',
      education: {
        degree: 'PhD',
        fieldOfStudy: 'AI',
        instituteTier: 'Top Institute (QS <300)',
        institute: 'Stanford University'
      },
      patents: {
        grantedFirstInventor: true,
        grantedCoInventor: false,
        filedPatent: false,
        significantContribution: true
      },
      publications: {
        topAIConferences: ['NeurIPS', 'ICLR'],
        otherAIConferences: ['AAAI'],
        reputableJournals: ['JMLR'],
        numberOfPublications: 15,
        citations: 450
      },
      hIndex: 12,
      experienceBracket: '3-6',
      workExperience: {
        topAIOrganizations: ['Google', 'OpenAI'],
        impactQuality: 4,
        mentorshipRole: true,
        dlFrameworks: ['TensorFlow', 'PyTorch'],
        programmingLanguages: ['Python', 'C++']
      }
    },
    {
      id: 2,
      name: 'Prof. Michael Rodriguez',
      email: 'michael.rodriguez@example.com',
      education: {
        degree: 'PhD',
        fieldOfStudy: 'Computer Science',
        instituteTier: 'Top Institute (QS <300)',
        institute: 'MIT'
      },
      patents: {
        grantedFirstInventor: false,
        grantedCoInventor: true,
        filedPatent: true,
        significantContribution: false
      },
      publications: {
        topAIConferences: ['CVPR', 'ICCV'],
        otherAIConferences: [],
        reputableJournals: ['PAMI'],
        numberOfPublications: 25,
        citations: 680
      },
      hIndex: 18,
      experienceBracket: '6-10',
      workExperience: {
        topAIOrganizations: ['Microsoft'],
        impactQuality: 3,
        mentorshipRole: true,
        dlFrameworks: ['PyTorch'],
        programmingLanguages: ['Python', 'R']
      }
    },
    {
      id: 3,
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@example.com',
      education: {
        degree: 'Pursuing PhD',
        fieldOfStudy: 'AI',
        instituteTier: 'Top Institute (QS <300)',
        institute: 'IISc Bangalore'
      },
      patents: {
        grantedFirstInventor: false,
        grantedCoInventor: false,
        filedPatent: true,
        significantContribution: true
      },
      publications: {
        topAIConferences: ['NeurIPS'],
        otherAIConferences: ['AAAI'],
        reputableJournals: [],
        numberOfPublications: 8,
        citations: 120
      },
      hIndex: 5,
      experienceBracket: '0-3',
      workExperience: {
        topAIOrganizations: ['IISc'],
        impactQuality: 2,
        mentorshipRole: false,
        dlFrameworks: ['TensorFlow', 'PyTorch'],
        programmingLanguages: ['Python']
      }
    },
    {
      id: 4,
      name: 'Dr. Alex Johnson',
      email: 'alex.johnson@example.com',
      education: {
        degree: 'PhD',
        fieldOfStudy: 'AI',
        instituteTier: 'Top Institute (QS <300)',
        institute: 'Carnegie Mellon University'
      },
      patents: {
        grantedFirstInventor: true,
        grantedCoInventor: true,
        filedPatent: false,
        significantContribution: true
      },
      publications: {
        topAIConferences: ['ICML', 'NeurIPS'],
        otherAIConferences: ['AAAI', 'IJCAI'],
        reputableJournals: ['JMLR', 'PAMI'],
        numberOfPublications: 20,
        citations: 520
      },
      hIndex: 14,
      experienceBracket: '3-6',
      workExperience: {
        topAIOrganizations: ['Facebook AI', 'DeepMind'],
        impactQuality: 4,
        mentorshipRole: true,
        dlFrameworks: ['PyTorch', 'JAX'],
        programmingLanguages: ['Python', 'C++', 'Julia']
      }
    },
    {
      id: 5,
      name: 'Dr. Maria Garcia',
      email: 'maria.garcia@example.com',
      education: {
        degree: 'PhD',
        fieldOfStudy: 'AI',
        instituteTier: 'Top Institute (QS <300)',
        institute: 'UC Berkeley'
      },
      patents: {
        grantedFirstInventor: false,
        grantedCoInventor: true,
        filedPatent: true,
        significantContribution: false
      },
      publications: {
        topAIConferences: ['CVPR', 'ICCV', 'ECCV'],
        otherAIConferences: ['AAAI'],
        reputableJournals: ['TPAMI'],
        numberOfPublications: 18,
        citations: 380
      },
      hIndex: 11,
      experienceBracket: '3-6',
      workExperience: {
        topAIOrganizations: ['NVIDIA', 'Adobe'],
        impactQuality: 3,
        mentorshipRole: true,
        dlFrameworks: ['TensorFlow', 'PyTorch'],
        programmingLanguages: ['Python', 'CUDA', 'C++']
      }
    },
    {
      id: 6,
      name: 'Dr. James Wilson',
      email: 'james.wilson@example.com',
      education: {
        degree: 'PhD',
        fieldOfStudy: 'AI',
        instituteTier: 'Top Institute (QS <300)',
        institute: 'University of Toronto'
      },
      patents: {
        grantedFirstInventor: true,
        grantedCoInventor: false,
        filedPatent: true,
        significantContribution: true
      },
      publications: {
        topAIConferences: ['ACL', 'EMNLP', 'NeurIPS'],
        otherAIConferences: ['AAAI', 'IJCAI'],
        reputableJournals: ['TACL', 'CL'],
        numberOfPublications: 22,
        citations: 410
      },
      hIndex: 13,
      experienceBracket: '6-10',
      workExperience: {
        topAIOrganizations: ['Google Research', 'Hugging Face'],
        impactQuality: 4,
        mentorshipRole: true,
        dlFrameworks: ['PyTorch', 'Transformers'],
        programmingLanguages: ['Python', 'JavaScript', 'Go']
      }
    },
    {
      id: 7,
      name: 'Dr. Emily Chen',
      email: 'emily.chen@example.com',
      education: {
        degree: 'Master\'s',
        fieldOfStudy: 'Computer Science',
        instituteTier: 'Other Institute (QS >300)',
        institute: 'University of Washington'
      },
      patents: {
        grantedFirstInventor: false,
        grantedCoInventor: false,
        filedPatent: true,
        significantContribution: false
      },
      publications: {
        topAIConferences: ['AAAI'],
        otherAIConferences: [],
        reputableJournals: [],
        numberOfPublications: 5,
        citations: 85
      },
      hIndex: 3,
      experienceBracket: '0-3',
      workExperience: {
        topAIOrganizations: [],
        impactQuality: 2,
        mentorshipRole: false,
        dlFrameworks: ['TensorFlow'],
        programmingLanguages: ['Python', 'Java']
      }
    },
    {
      id: 8,
      name: 'Dr. Robert Taylor',
      email: 'robert.taylor@example.com',
      education: {
        degree: 'PhD',
        fieldOfStudy: 'Related Fields',
        instituteTier: 'Other Institute (QS >300)',
        institute: 'Georgia Tech'
      },
      patents: {
        grantedFirstInventor: true,
        grantedCoInventor: false,
        filedPatent: false,
        significantContribution: true
      },
      publications: {
        topAIConferences: [],
        otherAIConferences: ['AAAI'],
        reputableJournals: ['IEEE'],
        numberOfPublications: 12,
        citations: 280
      },
      hIndex: 8,
      experienceBracket: '6-10',
      workExperience: {
        topAIOrganizations: ['IBM'],
        impactQuality: 3,
        mentorshipRole: true,
        dlFrameworks: ['TensorFlow', 'PyTorch'],
        programmingLanguages: ['Python', 'C++', 'R']
      }
    }
  ];

  // Apply scoring to each researcher
  return rawData.map(researcher => {
    const scoringResult = calculateTotalScore(researcher, weights);
    return {
      ...researcher,
      score: scoringResult.totalScore,
      grade: scoringResult.grade,
      scoreBreakdown: scoringResult.breakdown
    };
  });
}

// GET /api/researchers - Get all researchers with optional filtering
router.get('/', async (req, res) => {
  try {
    const weights = req.query.weights ? JSON.parse(req.query.weights) : null;
    const researchers = await loadResearchers(weights);
    let filteredResearchers = [...researchers];

    // Apply filters
    const {
      degree,
      fieldOfStudy,
      instituteTier,
      grantedFirstInventor,
      grantedCoInventor,
      filedPatent,
      significantContribution,
      hasTopAIConferences,
      hasOtherAIConferences,
      hasReputableJournals,
      hasOtherJournals,
      minPublications,
      minCitations,
      experienceBracket,
      minHIndex
    } = req.query;

    if (degree) {
      filteredResearchers = filteredResearchers.filter(r => r.education.degree === degree);
    }

    if (fieldOfStudy) {
      filteredResearchers = filteredResearchers.filter(r => r.education.fieldOfStudy === fieldOfStudy);
    }

    if (instituteTier) {
      filteredResearchers = filteredResearchers.filter(r => r.education.instituteTier === instituteTier);
    }

    // Patents filters
    if (grantedFirstInventor === 'true') {
      filteredResearchers = filteredResearchers.filter(r => r.patents.grantedFirstInventor === true);
    }

    if (grantedCoInventor === 'true') {
      filteredResearchers = filteredResearchers.filter(r => r.patents.grantedCoInventor === true);
    }

    if (filedPatent === 'true') {
      filteredResearchers = filteredResearchers.filter(r => r.patents.filedPatent === true);
    }

    if (significantContribution === 'true') {
      filteredResearchers = filteredResearchers.filter(r => r.patents.significantContribution === true);
    }

    // Publications filters
    if (hasTopAIConferences === 'true') {
      filteredResearchers = filteredResearchers.filter(r => 
        r.publications.topAIConferences && r.publications.topAIConferences.length > 0
      );
    }

    if (hasOtherAIConferences === 'true') {
      filteredResearchers = filteredResearchers.filter(r => 
        r.publications.otherAIConferences && r.publications.otherAIConferences.length > 0
      );
    }

    if (hasReputableJournals === 'true') {
      filteredResearchers = filteredResearchers.filter(r => 
        r.publications.reputableJournals && r.publications.reputableJournals.length > 0
      );
    }

    if (hasOtherJournals === 'true') {
      filteredResearchers = filteredResearchers.filter(r => 
        r.publications.otherJournals && r.publications.otherJournals.length > 0
      );
    }

    if (minPublications) {
      const minPubs = parseInt(minPublications);
      if (!isNaN(minPubs)) {
        filteredResearchers = filteredResearchers.filter(r => r.publications.numberOfPublications >= minPubs);
      }
    }

    if (minCitations) {
      const minCits = parseInt(minCitations);
      if (!isNaN(minCits)) {
        filteredResearchers = filteredResearchers.filter(r => r.publications.citations >= minCits);
      }
    }

    if (experienceBracket) {
      filteredResearchers = filteredResearchers.filter(r => r.experienceBracket === experienceBracket);
    }

    if (minHIndex) {
      const minH = parseInt(minHIndex);
      if (!isNaN(minH)) {
        filteredResearchers = filteredResearchers.filter(r => r.hIndex >= minH);
      }
    }

    res.json({
      researchers: filteredResearchers,
      total: filteredResearchers.length,
      filters: req.query
    });
  } catch (error) {
    console.error('Error fetching researchers:', error);
    res.status(500).json({ error: 'Failed to fetch researchers' });
  }
});

// GET /api/researchers/export/csv - Export researchers to CSV
router.get('/export/csv', async (req, res) => {
  try {
    const researchers = await loadResearchers();
    
    // Flatten the data for CSV export
    const flattenedData = researchers.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      degree: r.education.degree,
      fieldOfStudy: r.education.fieldOfStudy,
      instituteTier: r.education.instituteTier,
      institute: r.education.institute,
      score: r.score,
      grade: r.grade,
      grantedFirstInventor: r.patents.grantedFirstInventor,
      grantedCoInventor: r.patents.grantedCoInventor,
      filedPatent: r.patents.filedPatent,
      topAIConferences: r.publications.topAIConferences.join(', '),
      numberOfPublications: r.publications.numberOfPublications,
      citations: r.publications.citations,
      hIndex: r.hIndex,
      experienceBracket: r.experienceBracket,
      topAIOrganizations: r.workExperience.topAIOrganizations.join(', '),
      mentorshipRole: r.workExperience.mentorshipRole
    }));
    
    const parser = new Parser();
    const csv = parser.parse(flattenedData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=researchers.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// POST /api/researchers/parse-profile - Parse raw profile data
router.post('/parse-profile', async (req, res) => {
  try {
    const { profileData, dataType } = req.body;
    
    if (!profileData) {
      return res.status(400).json({ error: 'Profile data is required' });
    }

    console.log('Parsing profile data with AI...');
    console.log('Data type:', dataType);
    console.log('Profile data preview:', typeof profileData === 'string' ? 
      profileData.substring(0, 200) + '...' : 
      JSON.stringify(profileData).substring(0, 200) + '...');

    // Parse education using AI
    const education = await parseEducation(profileData);
    
    // Parse publications using Semantic Scholar + AI
    console.log('📚 Extracting publications and citations...');
    const publications = await parsePublications({
      name: education.name || extractName(profileData),
      education: education,
      profileData: profileData
    });
    
    // Create a comprehensive profile structure with AI-extracted data
    const parsedProfile = {
      id: Date.now(), // Temporary ID
      name: education.name || extractName(profileData), // Use AI-extracted name first, fallback to helper function
      email: extractEmail(profileData),
      education,
      publications: {
        topAIConferences: publications.topAIConferences || [],
        otherAIConferences: publications.otherAIConferences || [],
        reputableJournals: publications.reputableJournals || [],
        numberOfPublications: publications.numberOfPublications || 0,
        citations: publications.citations || 0
      },
      // TODO: Add parsers for other sections
      patents: {
        grantedFirstInventor: false,
        grantedCoInventor: false,
        filedPatent: false,
        significantContribution: false
      },
      hIndex: publications.hIndex || 0,
      experienceBracket: '0-3', // Default - TODO: Implement experience bracket detection
      workExperience: {
        topAIOrganizations: [],
        impactQuality: 1,
        mentorshipRole: false,
        dlFrameworks: [],
        programmingLanguages: []
      },
      
      // Additional detailed publication data (not used in scoring but useful for display)
      detailedPublications: publications.detailedPublications || {},
      publicationStats: publications.publicationStats || {},
      recentPapers: publications.recentPapers || [],
      topVenues: publications.topVenues || []
    };

    // Calculate score for the parsed profile
    const scoringResult = calculateTotalScore(parsedProfile);
    parsedProfile.score = scoringResult.totalScore;
    parsedProfile.grade = scoringResult.grade;
    parsedProfile.scoreBreakdown = scoringResult.breakdown;

    // Add extraction metadata
    parsedProfile.extractionMetadata = {
      educationExtraction: {
        method: 'ai-powered',
        confidence: education.confidence,
        extractionDate: new Date().toISOString()
      },
      publicationsExtraction: {
        method: publications.extractionMethod,
        confidence: publications.matchConfidence,
        semanticScholarId: publications.semanticScholarId,
        extractionDate: publications.extractionDate
      }
    };

    res.json({
      success: true,
      parsedProfile,
      message: 'Profile parsed successfully using AI. Name, education, and publications extracted.',
      note: 'Patents and work experience sections can be similarly extracted using AI.',
      extractionDetails: {
        nameSource: education.name ? 'AI-extracted' : 'fallback-extracted',
        educationMethod: education.extractionMethod || 'ai-powered',
        educationConfidence: education.aiConfidence || 'medium',
        publicationsMethod: publications.extractionMethod || 'semantic-scholar-ai',
        publicationsConfidence: publications.matchConfidence || 'none',
        publicationsFound: publications.totalPapers > 0
      }
    });

  } catch (error) {
    console.error('Error parsing profile:', error);
    res.status(500).json({ 
      error: 'Failed to parse profile data',
      details: error.message 
    });
  }
});

// Helper function to extract name from profile data
function extractName(profileData) {
  if (typeof profileData === 'object') {
    // Handle structured data
    if (profileData.name) return profileData.name;
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`;
    }
    if (profileData.personalInfo && profileData.personalInfo.name) {
      return profileData.personalInfo.name;
    }
    if (profileData.profile && profileData.profile.firstName && profileData.profile.lastName) {
      return `${profileData.profile.firstName} ${profileData.profile.lastName}`;
    }
  } else if (typeof profileData === 'string') {
    // Try to extract name from text
    const lines = profileData.split('\n');
    const firstLine = lines[0].trim();
    
    // Look for patterns like "Name: John Doe" or just "John Doe" at the beginning
    const nameMatch = firstLine.match(/^(?:Name:\s*)?([A-Za-z\s\.]+)(?:\s*-|$)/);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
  }
  
  return 'Unknown Name';
}

// Helper function to extract email from profile data
function extractEmail(profileData) {
  if (typeof profileData === 'object') {
    if (profileData.email) return profileData.email;
    if (profileData.personalInfo && profileData.personalInfo.email) {
      return profileData.personalInfo.email;
    }
    if (profileData.profile && profileData.profile.email) {
      return profileData.profile.email;
    }
  } else if (typeof profileData === 'string') {
    // Extract email using regex
    const emailMatch = profileData.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      return emailMatch[0];
    }
  }
  
  return 'unknown@example.com';
}

module.exports = router; 