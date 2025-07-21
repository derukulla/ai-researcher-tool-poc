const express = require('express');
const router = express.Router();
const { 
  calculateTotalScore, 
  DEFAULT_WEIGHTS, 
  TOP_AI_CONFERENCES, 
  TOP_AI_JOURNALS, 
  TOP_AI_ORGANIZATIONS 
} = require('../utils/scoringEngine');

// POST /api/scoring/calculate - Calculate score for a researcher
router.post('/calculate', (req, res) => {
  try {
    const researcher = req.body;
    
    // Validate required fields
    if (!researcher.education || !researcher.patents || !researcher.publications || 
        !researcher.workExperience || !researcher.hIndex || !researcher.experienceBracket) {
      return res.status(400).json({ 
        error: 'Missing required fields. Please provide education, patents, publications, workExperience, hIndex, and experienceBracket.' 
      });
    }

    const scoreResult = calculateTotalScore(researcher);
    
    res.json({
      researcher: {
        name: researcher.name || 'Unknown',
        id: researcher.id
      },
      scoring: scoreResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({ error: 'Failed to calculate score' });
  }
});

// POST /api/scoring/batch - Calculate scores for multiple researchers
router.post('/batch', (req, res) => {
  try {
    const researchers = req.body.researchers;
    
    if (!Array.isArray(researchers)) {
      return res.status(400).json({ error: 'Please provide an array of researchers' });
    }

    const results = researchers.map(researcher => {
      try {
        const scoreResult = calculateTotalScore(researcher);
        return {
          researcher: {
            name: researcher.name || 'Unknown',
            id: researcher.id
          },
          scoring: scoreResult,
          success: true
        };
      } catch (error) {
        return {
          researcher: {
            name: researcher.name || 'Unknown',
            id: researcher.id
          },
          error: error.message,
          success: false
        };
      }
    });

    res.json({
      results,
      summary: {
        total: researchers.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating batch scores:', error);
    res.status(500).json({ error: 'Failed to calculate batch scores' });
  }
});

// GET /api/scoring/weights - Get scoring weights
router.get('/weights', (req, res) => {
  res.json({
    weights: DEFAULT_WEIGHTS,
    description: {
      education: 'Education background and qualifications',
      patents: 'Patent portfolio and contributions',
      publications: 'Publications and citations (including H-index)',
      workExperience: 'Work experience and technical skills'
    }
  });
});

// GET /api/scoring/criteria - Get scoring criteria and reference data
router.get('/criteria', (req, res) => {
  res.json({
    weights: DEFAULT_WEIGHTS,
    maxScores: {
      education: 10,
      patents: 10,
      publications: 10,
      workExperience: 10
    },
    referenceData: {
      topAIConferences: TOP_AI_CONFERENCES,
      topAIJournals: TOP_AI_JOURNALS,
      topAIOrganizations: TOP_AI_ORGANIZATIONS
    },
    experienceBrackets: ['0-3', '3-6', '6-10', '10+'],
    degrees: ['PhD', 'Master\'s', 'Pursuing PhD', 'Bachelor\'s'],
    fieldsOfStudy: ['AI', 'Computer Science', 'Related Fields'],
    instituteTiers: ['Top Institute (QS <300)', 'Other Institute (QS >300)'],
    dlFrameworks: ['TensorFlow', 'PyTorch', 'Keras', 'JAX', 'Caffe', 'MXNet'],
    programmingLanguages: ['Python', 'C++', 'Java', 'R', 'MATLAB', 'JavaScript']
  });
});

// GET /api/scoring/stats - Get scoring statistics
router.get('/stats', (req, res) => {
  res.json({
    scoringSystem: {
      totalWeight: Object.values(DEFAULT_WEIGHTS).reduce((sum, weight) => sum + weight, 0),
      maxPossibleScore: 10,
      gradingScale: {
        'A+': '8.5-10.0',
        'A': '8.0-8.4',
        'A-': '7.5-7.9',
        'B+': '7.0-7.4',
        'B': '6.5-6.9',
        'B-': '6.0-6.4',
        'C+': '5.5-5.9',
        'C': '5.0-5.4',
        'D': '0-4.9'
      }
    },
    componentBreakdown: {
      education: {
        weight: DEFAULT_WEIGHTS.education,
        weightedMaxScore: DEFAULT_WEIGHTS.education * 10,
        factors: ['Degree Level', 'Field of Study', 'Institute Ranking']
      },
      patents: {
        weight: DEFAULT_WEIGHTS.patents,
        weightedMaxScore: DEFAULT_WEIGHTS.patents * 10,
        factors: ['First Inventor Status', 'Co-Inventor Status', 'Filed Patents', 'Significant Contribution']
      },
      publications: {
        weight: DEFAULT_WEIGHTS.publications,
        weightedMaxScore: DEFAULT_WEIGHTS.publications * 10,
        factors: ['Top AI Conferences', 'Other Conferences', 'Journals', 'Citations', 'H-Index']
      },
      workExperience: {
        weight: DEFAULT_WEIGHTS.workExperience,
        weightedMaxScore: DEFAULT_WEIGHTS.workExperience * 10,
        factors: ['Top AI Organizations', 'Impact Quality', 'Mentorship', 'Technical Skills']
      }
    }
  });
});

module.exports = router; 