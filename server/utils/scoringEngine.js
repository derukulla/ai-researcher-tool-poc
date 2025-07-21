/**
 * AI Researcher Scoring Engine
 * Calculates weighted scores based on education, patents, publications, and work experience
 */

const axios = require('axios');

// Default scoring weights (can be overridden in calculateTotalScore function)
const DEFAULT_WEIGHTS = {
  education: 0.25,      // 25%
  patents: 0.15,        // 15%
  publications: 0.30,   // 30%
  workExperience: 0.30, // 30%
  github: 0.00          // 0%
};

// H-Index scoring lookup table based on experience (updated system)
const H_INDEX_SCORING = {
  '0-3': { 1: 1, 2: 3, 4: 5 },     // 0-3 years: min H-index 1, 2, 4 for 1, 3, 5 points
  '3-6': { 3: 1, 6: 3, 12: 5 },    // 3-6 years: min H-index 3, 6, 12 for 1, 3, 5 points
  '6-10': { 6: 1, 12: 3, 24: 5 },  // 6-10 years: min H-index 6, 12, 24 for 1, 3, 5 points
  '10+': { 10: 1, 20: 3, 40: 5 }   // 10+ years: min H-index 10, 20, 40 for 1, 3, 5 points
};

// Top AI conferences and journals
const TOP_AI_CONFERENCES = [
  'CVPR', 'ECCV', 'NeurIPS', 'ICLR', 'AAAI', 'ICCV', 'ICML', 'SIGGRAPH'
];

const TOP_AI_JOURNALS = [
  'JMLR', 'PAMI', 'TACL', 'Nature AI', 'Science AI'
];

const TOP_AI_ORGANIZATIONS = [
  'Microsoft', 'Google', 'OpenAI', 'DeepMind', 'IISc', 'AI Startups'
];

/**
 * Evaluate field of study relevance to AI using Ollama
 * @param {string} fieldOfStudy - Field of study to evaluate
 * @returns {Promise<number>} Relevance score (0-3)
 */
async function evaluateFieldRelevanceWithAI(fieldOfStudy) {
  if (!fieldOfStudy || fieldOfStudy === 'Unknown' || fieldOfStudy === '') {
    return 1; // Default score for unknown fields
  }

  try {
    const prompt = `Evaluate the relevance of this field of study to AI/Machine Learning research and development.

FIELD OF STUDY: "${fieldOfStudy}"

SCORING CRITERIA:
- 3 points: Highly relevant fields that directly contribute to AI/ML
  Examples: Artificial Intelligence, Machine Learning, Computer Science, Data Science, 
  Electrical & Computer Engineering, Mathematics, Statistics, Computational Linguistics,
  Robotics, Computer Vision, Natural Language Processing, Neural Networks, etc.

- 2 points: Moderately relevant fields with significant overlap
  Examples: Electronics Engineering, Information Technology, Software Engineering,
  Physics, Applied Mathematics, Cognitive Science, Computational Biology, etc.

- 1 point: Somewhat relevant fields with some connection to AI
  Examples: Mechanical Engineering, Biomedical Engineering, Economics, Psychology,
  Operations Research, Industrial Engineering, etc.

- 0 points: Fields with minimal relevance to AI/ML
  Examples: Pure Arts, Literature, History, Geography, etc.

INSTRUCTIONS:
- Consider both direct relevance and potential for AI applications
- Be generous with interdisciplinary fields that can benefit from AI
- Consider modern AI applications across various domains
- Return ONLY a single number: 0, 1, 2, or 3

RESPONSE: Return only the number (0, 1, 2, or 3), nothing else.`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3:latest',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 10
      }
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseText = response.data.response.trim();
    const score = parseInt(responseText.match(/\d+/)?.[0] || '1');
    
    // Validate score is within expected range
    if (score >= 0 && score <= 3) {
      // console.log(`🎓 Field relevance AI evaluation: "${fieldOfStudy}" → ${score}/3 points`);
      return score;
    } else {
      // console.log(`⚠️ Invalid AI response for field "${fieldOfStudy}", using default score`);
      return 1;
    }

  } catch (error) {
    console.error(`❌ Error evaluating field relevance: ${error.message}`);
    // Fallback to rule-based scoring
    return evaluateFieldRelevanceFallback(fieldOfStudy);
  }
}

/**
 * Fallback rule-based field relevance evaluation
 * @param {string} fieldOfStudy - Field of study to evaluate
 * @returns {number} Relevance score (0-3)
 */
function evaluateFieldRelevanceFallback(fieldOfStudy) {
  if (!fieldOfStudy) return 1;
  
  const field = fieldOfStudy.toLowerCase();
  
  // Highly relevant fields (3 points)
  const highlyRelevant = [
    'ai', 'artificial intelligence', 'machine learning', 'computer science', 'data science',
    'electrical engineering', 'computer engineering', 'ece', 'mathematics', 'statistics',
    'computational linguistics', 'robotics', 'computer vision', 'natural language processing',
    'neural networks', 'deep learning', 'ml', 'cs'
  ];
  
  // Moderately relevant fields (2 points)
  const moderatelyRelevant = [
    'electronics', 'information technology', 'software engineering', 'physics',
    'applied mathematics', 'cognitive science', 'computational biology', 'bioinformatics',
    'it', 'software', 'electronics engineering'
  ];
  
  // Check for exact or partial matches
  for (const relevant of highlyRelevant) {
    if (field.includes(relevant) || relevant.includes(field)) {
      return 3;
    }
  }
  
  for (const relevant of moderatelyRelevant) {
    if (field.includes(relevant) || relevant.includes(field)) {
      return 2;
    }
  }
  
  // Default for engineering or technical fields
  if (field.includes('engineering') || field.includes('technology')) {
    return 1;
  }
  
  return 1; // Default score
}

/**
 * Calculate education score using LLM evaluation based on specific rules
 * @param {object} education - Education information
 * @returns {Promise<number>} Education score (0-10)
 */
async function calculateEducationScore(education) {
  const degree = education.degree || 'Unknown';
  const fieldOfStudy = education.fieldOfStudy || 'Unknown';
  const institute = education.institute || 'Unknown';
  const instituteTier = education.instituteTier || 'Unknown';

  try {
    const prompt = `You are an expert education evaluator. You must assign a score based on the EXACT scoring rules below. DO NOT deviate from these rules.

EDUCATION INFORMATION:
- Degree: "${degree}"
- Field of Study: "${fieldOfStudy}"
- Institute: "${institute}"
- Institute Tier: "${instituteTier}"

SCORING RULES (FOLLOW EXACTLY - NO EXCEPTIONS):

STEP 1: Check if field is AI/CS/Related
AI/CS/Related fields include: Artificial Intelligence, Machine Learning, Computer Science, Data Science, Electrical Engineering, Computer Engineering, Software Engineering, Mathematics, Statistics, Information Technology, Robotics, Computer Vision, NLP, etc.

STEP 2: Check if institute is Top Institute
Top Institute = Institute Tier contains "Top Institute" OR "QS <300"

STEP 3: Apply exact scoring:
1. PhD + AI/CS/Related + Top Institute = 10 points (MANDATORY)
2. PhD + AI/CS/Related + Other Institute = 7 points
3. Masters + AI/CS/Related + Top Institute = 5 points  
4. Pursuing PhD + Any field + Any Institute = 3 points
5. Masters + AI/CS/Related + Other Institute = 4 points
6. Bachelor + AI/CS/Related + Top Institute = 3 points
7. Bachelor + AI/CS/Related + Other Institute = 2 points

CURRENT CASE ANALYSIS:
- Degree: "${degree}" 
- Field: "${fieldOfStudy}" (AI/CS/Related: ${fieldOfStudy.toLowerCase().includes('computer science') || fieldOfStudy.toLowerCase().includes('artificial intelligence') || fieldOfStudy.toLowerCase().includes('machine learning') || fieldOfStudy.toLowerCase().includes('data science') || fieldOfStudy.toLowerCase().includes('electrical') || fieldOfStudy.toLowerCase().includes('software') ? 'YES' : 'CHECK_IF_TECHNICAL'})
- Institute: Top Institute status = ${instituteTier.includes('Top Institute') || instituteTier.includes('QS <300') ? 'YES' : 'NO'}

MANDATORY: If PhD + AI/CS/Related + Top Institute = MUST return 10
MANDATORY: Return ONLY the number (0-10), no explanations.`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3:latest',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 10
      }
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const responseText = response.data.response.trim();
    const score = parseInt(responseText.match(/\d+/)?.[0] || '0');
    
    // Validate score is within expected range
    if (score >= 0 && score <= 10) {
      console.log(`🎓 LLM Education Evaluation: ${degree} in ${fieldOfStudy} at ${institute} → ${score}/10 points`);
      return score;
    } else {
      console.log(`⚠️ Invalid LLM response for education evaluation, using fallback`);
      return calculateEducationScoreFallback(education);
    }

  } catch (error) {
    console.error(`❌ Error in LLM education evaluation: ${error.message}`);
    return calculateEducationScoreFallback(education);
  }
}

/**
 * Fallback education scoring when LLM fails
 * @param {object} education - Education information
 * @returns {number} Education score (0-10)
 */
function calculateEducationScoreFallback(education) {
  const degree = (education.degree || '').toLowerCase();
  const fieldOfStudy = (education.fieldOfStudy || '').toLowerCase();
  const instituteTier = education.instituteTier || '';
  
  const isTopInstitute = instituteTier.includes('Top Institute') || instituteTier.includes('QS <300');
  
  // Check if field is AI/CS/Related
  const aiCSFields = [
    'ai', 'artificial intelligence', 'machine learning', 'computer science', 'data science',
    'electrical engineering', 'computer engineering', 'software engineering',
    'mathematics', 'statistics', 'information technology', 'information science'
  ];
  const isAICSField = aiCSFields.some(field => fieldOfStudy.includes(field));
  
  let score = 0;
  
  if (degree.includes('phd') || degree.includes('doctor')) {
    if (!degree.includes('pursuing')) {
      // Completed PhD
      if (isAICSField) {
        score = isTopInstitute ? 10 : 7;
      } else {
        score = isTopInstitute ? 5 : 3;
      }
    } else {
      // Pursuing PhD
      score = 3;
    }
  } else if (degree.includes('master') || degree.includes('pursuing phd')) {
    if (isAICSField) {
      score = isTopInstitute ? 5 : 4;
    } else {
      score = isTopInstitute ? 3 : 2;
    }
  } else if (degree.includes('bachelor')) {
    if (isAICSField) {
      score = isTopInstitute ? 3 : 2;
    } else {
      score = 1;
    }
  } else {
    score = degree === 'unknown' ? 0 : 1;
  }
  
  console.log(`🎓 Fallback Education Score: ${score}/10`);
  return Math.min(score, 10);
}

/**
 * Calculate patents score (max 10 points)
 */
function calculatePatentsScore(patents) {
  let score = 0;
  
  if (patents.grantedFirstInventor) {
    score += 10; // Max points for first inventor
  } else if (patents.grantedCoInventor) {
    score += 5;
  } 
  if (patents.filedPatent) {
    score += 2;
  }
  
  return Math.min(score, 10);
}

/**
 * Calculate publications score (max 5 points) - Updated for boolean venue quality system
 */
function calculatePublicationsScore(publications) {
  let score = 0;
  
  // Check if we have the new venue quality system (boolean-based)
  if (publications.venueQuality) {
    const venueQuality = publications.venueQuality;
    
    // Top AI conferences - prioritized scoring
    if (venueQuality.hasTopAIConference) {
      if (publications.citations >= 30) {
        score += 5; // Max 5 points for top conferences with citations
      } else {
        score += 3; // 3 points for top conferences without high citations
      }
    }
    
    // Other AI conferences - only if no top conferences
    else if (venueQuality.hasOtherAIConference) {
      score += 2; // 2 points for other AI conferences
    }
    
    // Reputable journals - only if no conferences
    else if (venueQuality.hasReputableJournal) {
      score += 4; // 4 points for reputable journals
    }
    
    // If still no score and have other peer-reviewed publications, give 1 point
    else if (venueQuality.hasOtherPeerReviewed) {
      score += 1; // 1 point for other peer-reviewed publications
    }
  }
  
  // Fallback to legacy array-based system for backward compatibility
  else {
    // Top AI conferences - prioritized scoring
    if (publications.topAIConferences && publications.topAIConferences.length > 0) {
      const topConferenceCount = publications.topAIConferences.length;
      if (publications.citations >= 30) {
        score += Math.min(topConferenceCount * 5, 5); // Max 5 points for top conferences with citations
      } else {
        score += Math.min(topConferenceCount * 2, 3); // Reduced points without citations
      }
    }
    
    // Other AI conferences - only if no top conferences
    else if (publications.otherAIConferences && publications.otherAIConferences.length > 0) {
      score += Math.min(publications.otherAIConferences.length * 2, 2); // Max 2 points
    }
    
    // Reputable journals - only if no conferences
    else if (publications.reputableJournals && publications.reputableJournals.length > 0) {
      score += 4; // 4 points for reputable journals
    }
    
    // If still no score and have other publications, give 1 point
    else if (publications.otherPublications && publications.otherPublications.length > 0) {
      score += 1; // 1 point for other peer-reviewed publications (only if no higher tier publications)
    }
  }
  
  return Math.min(score, 5); // Cap at 5 points
}

/**
 * Calculate H-Index score based on experience bracket (updated system)
 * Returns 1, 3, or 5 points based on H-index thresholds
 */
function calculateHIndexScore(hIndex, experienceBracket) {
  const scoringTable = H_INDEX_SCORING[experienceBracket] || H_INDEX_SCORING['0-3'];
  
  // Check thresholds in descending order to get highest applicable score
  const thresholds = Object.keys(scoringTable).map(Number).sort((a, b) => b - a);
  
  for (const threshold of thresholds) {
    if (hIndex >= threshold) {
      return scoringTable[threshold];
    }
  }
  
  return 0; // No points if below minimum threshold
}

/**
 * Calculate work experience score (max 10 points)
 */
function calculateWorkExperienceScore(workExperience) {
  let score = 0;
  
  // Top AI organizations
  if (workExperience.topAIOrganizations ) {
    score += 2; // Max 2 points
  }
  
  // Impact and quality (recruiter assessed)
  if (workExperience.impactQuality) {
    score += Math.min(workExperience.impactQuality, 4); // Max 4 points
  }
  
  // Mentorship role
  if (workExperience.mentorshipRole) {
    score += 2;
  }
  
  // Deep learning frameworks
  if (workExperience.dlFrameworks) {
    score += 2; // Max 2 points
  }
  
  return Math.min(score, 10);
}

/**
 * Calculate GitHub contribution score
 * @param {object} github - GitHub profile analysis data
 * @returns {number} GitHub score (0-16)
 */
function calculateGitHubScore(github) {
  if (!github) {
    return 0;
  }
  
  // Handle both old and new GitHub data structures
  const analysis = github.analysis || github;
  
  if (!analysis) {
    return 0;
  }
  
  let score = 0;
  
  // Repo Volume: if > 5 repos -> +3 points
  if ((analysis.repoVolume || 0) > 5) {
    score += 3;
  }
  
  // Repo Initiative: if > 3 original repos -> +3 points
  if ((analysis.repoInitiative || 0) > 3) {
    score += 3;
  }
  
  // Recent Activity: if > 0 recent updates -> +3 points
  if ((analysis.recentActivity || 0) > 0) {
    score += 3;
  }
  
  // Popularity: stars-based scoring
  const popularity = analysis.popularity || 0;
  if (popularity > 50) {
    score += 4;
  } else if (popularity > 20) {
    score += 2;
  }
  
  // AI Relevance: if has AI repos -> +3 points
  if (analysis.aiRelevance) {
    score += 3;
  }
  
  return Math.min(score, 16); // Cap at 16 points max
}

/**
 * Main scoring function with configurable weights
 * @param {object} researcher - Researcher data
 * @param {object} weights - Optional weight configuration
 * @param {number} weights.education - Education weight (default: 0.25 = 25%)
 * @param {number} weights.patents - Patents weight (default: 0.15 = 15%)
 * @param {number} weights.publications - Publications weight (default: 0.30 = 30%)
 * @param {number} weights.workExperience - Work experience weight (default: 0.30 = 30%)
 * @param {number} weights.github - GitHub weight (default: 0.00 = 0%)
 * @returns {object} Scoring result with total score out of 10
 */
async function calculateTotalScore(researcher, weights = {}) {
  // Default weights (must sum to 1.0 for proper scoring)
  const defaultWeights = {
    education: 0.25,      // 25%
    patents: 0.13,        // 15%
    publications: 0.30,   // 30%
    workExperience: 0.30, // 30%
    github: 0.02          // 0%
  };
  
  // Merge provided weights with defaults
  const finalWeights = { ...defaultWeights, ...weights };
  
  // Validate that weights sum to 1.0 (100%)
  const weightSum = Object.values(finalWeights).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    console.warn(`⚠️ Warning: Weights sum to ${weightSum.toFixed(3)}, expected 1.0. Normalizing weights.`);
    // Normalize weights to sum to 1.0
    Object.keys(finalWeights).forEach(key => {
      finalWeights[key] = finalWeights[key] / weightSum;
    });
  }
  
  // Add safety checks to prevent undefined errors
  const education = researcher.education || {};
  const patents = researcher.patents || {};
  const publications = researcher.publications || {};
  const workExperience = researcher.workExperience || {};
  const github = researcher.github || {};
  
  // Calculate individual component scores (each out of 10)
  const educationScore = await calculateEducationScore(education);
  const patentsScore = calculatePatentsScore(patents);
  const publicationsScore = calculatePublicationsScore(publications);
  const hIndexScore = calculateHIndexScore(publications.hIndex || 0, publications.experienceBracket || '0-3');
  const workExperienceScore = calculateWorkExperienceScore(workExperience);
  const githubScore = calculateGitHubScore(github);
  
  // Combine publications and h-index scores (max 10)
  const combinedPublicationsScore = Math.min(publicationsScore + hIndexScore, 10);
  
  // Normalize GitHub score from 0-16 to 0-10 scale
  const normalizedGithubScore = Math.min((githubScore / 16) * 10, 10);
  
  // Calculate weighted scores (each component out of 10, then weighted)
  const componentScores = {
    education: Math.min(educationScore, 10),
    patents: Math.min(patentsScore, 10),
    publications: Math.min(combinedPublicationsScore, 10),
    workExperience: Math.min(workExperienceScore, 10),
    github: normalizedGithubScore
  };
  
  // Calculate final weighted total score out of 10
  const totalScore = (
    componentScores.education * finalWeights.education +
    componentScores.patents * finalWeights.patents +
    componentScores.publications * finalWeights.publications +
    componentScores.workExperience * finalWeights.workExperience +
    componentScores.github * finalWeights.github
  );
  
  return {
    totalScore: Math.round(totalScore * 10) / 10, // Round to 1 decimal place
    maxPossibleScore: 10, // Always out of 10
    percentage: totalScore > 0 ? Math.round((totalScore / 10) * 100 * 10) / 10 : 0,
    weights: finalWeights, // Include the weights used for transparency
    breakdown: {
      education: { 
        raw: educationScore, 
        weighted: Math.round(componentScores.education * finalWeights.education * 10) / 10,
        weight: finalWeights.education 
      },
      patents: { 
        raw: patentsScore, 
        weighted: Math.round(componentScores.patents * finalWeights.patents * 10) / 10,
        weight: finalWeights.patents 
      },
      publications: { 
        raw: combinedPublicationsScore, 
        weighted: Math.round(componentScores.publications * finalWeights.publications * 10) / 10,
        weight: finalWeights.publications 
      },
      workExperience: { 
        raw: workExperienceScore, 
        weighted: Math.round(componentScores.workExperience * finalWeights.workExperience * 10) / 10,
        weight: finalWeights.workExperience 
      },
      github: { 
        raw: githubScore, 
        normalized: Math.round(normalizedGithubScore * 10) / 10, // Show normalized score
        weighted: Math.round(normalizedGithubScore * finalWeights.github * 10) / 10,
        weight: finalWeights.github 
      }
    },
    grade: getGrade(totalScore) // Grade based on 0-10 scale
  };
}

/**
 * Get letter grade based on total score (out of 10)
 */
function getGrade(score) {
  if (score >= 8.5) return 'A+';
  if (score >= 8.0) return 'A';
  if (score >= 7.5) return 'A-';
  if (score >= 7.0) return 'B+';
  if (score >= 6.5) return 'B';
  if (score >= 6.0) return 'B-';
  if (score >= 5.5) return 'C+';
  if (score >= 5.0) return 'C';
  return 'D';
}

module.exports = {
  DEFAULT_WEIGHTS,
  calculateEducationScore,
  calculateEducationScoreFallback,
  calculatePatentsScore,
  calculatePublicationsScore,
  calculateHIndexScore,
  calculateWorkExperienceScore,
  calculateGitHubScore,
  calculateTotalScore,
  getGrade,
  evaluateFieldRelevanceWithAI,
  evaluateFieldRelevanceFallback
}; 