import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Container,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Slider,
  Collapse,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Grid,
  IconButton
} from '@mui/material';
import {
  Upload as UploadIcon,
  LinkedIn as LinkedInIcon,
  ArrowBack as BackIcon,
  Assessment as ScoreIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Article as ArticleIcon,
  Work as WorkIcon,
  Code as CodeIcon,
  Lightbulb as PatentIcon
} from '@mui/icons-material';
import { evaluationService } from '../services/api';
import { getErrorMessage, parseApiError, getErrorSeverity } from '../utils/errorHandler';

interface ProfileEvaluatorProps {
  onBack: () => void;
}

interface EnhancedErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

const EnhancedErrorDisplay: React.FC<EnhancedErrorDisplayProps> = ({ error, onRetry }) => {
  // Create a mock error object to parse
  const mockError = { message: error };
  const parsedError = parseApiError(mockError);
  const severity = getErrorSeverity(parsedError);
  
  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getTitle = () => {
    switch (parsedError.type) {
      case 'rate_limit':
        return 'Rate Limit Exceeded';
      case 'network':
        return 'Connection Issue';
      case 'validation':
        return 'Invalid Input';
      case 'not_found':
        return 'Not Found';
      case 'timeout':
        return 'Request Timeout';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  };

  return (
    <Alert 
      severity={severity} 
      sx={{ mt: 3 }}
      icon={getIcon()}
      action={
        parsedError.retryable && (
          <Button 
            color="inherit" 
            size="small" 
            onClick={onRetry}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>{getTitle()}</AlertTitle>
      {error}
    </Alert>
  );
};

interface EvaluationResult {
  fileName?: string;
  linkedinId?: string;
  profileName?: string;
  parsing: {
    education?: any;
    publications?: any;
    patents?: any;
    github?: any;
    workExperience?: any;
  };
  scoring?: {
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    grade?: string;
    breakdown?: any;
  };
  errors?: string[];
}

const getScoreGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

const ProfileEvaluator: React.FC<ProfileEvaluatorProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [linkedinId, setLinkedinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scoreExpanded, setScoreExpanded] = useState(false);
  
  // Weights configuration (matching backend defaults)
  const [weights, setWeights] = useState({
    education: 25,      // 25%
    patents: 13,        // 13%
    publications: 30,   // 30%
    workExperience: 30, // 30%
    github: 2           // 2%
  });
  const [useCustomWeights, setUseCustomWeights] = useState(false);

  const handleWeightChange = (category: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [category]: Math.max(0, Math.min(100, value)) // Clamp between 0-100
    }));
  };

  const resetWeights = () => {
    setWeights({
      education: 25,
      patents: 13,
      publications: 30,
      workExperience: 30,
      github: 2
    });
  };

  const getTotalWeight = () => {
    return Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  };

  const getWeightsForAPI = () => {
    if (!useCustomWeights) return undefined;
    
    // Convert percentages to decimals for API
    return {
      education: weights.education / 100,
      patents: weights.patents / 100,
      publications: weights.publications / 100,
      workExperience: weights.workExperience / 100,
      github: weights.github / 100
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleCVEvaluation = async () => {
    if (!file) {
      setError('Please select a CV file');
      return;
    }

    // Validate weights if using custom weights
    if (useCustomWeights) {
      const totalWeight = getTotalWeight();
      if (Math.abs(totalWeight - 100) > 1) {
        setError(`Weights must sum to 100% (currently ${totalWeight}%)`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const customWeights = getWeightsForAPI();
      const response = await evaluationService.evaluateCV(file, customWeights);
      setResult(response);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('CV evaluation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInEvaluation = async () => {
    if (!linkedinId.trim()) {
      setError('Please enter a LinkedIn profile ID');
      return;
    }

    // Validate weights if using custom weights
    if (useCustomWeights) {
      const totalWeight = getTotalWeight();
      if (Math.abs(totalWeight - 100) > 1) {
        setError(`Weights must sum to 100% (currently ${totalWeight}%)`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const customWeights = getWeightsForAPI();
      const response = await evaluationService.evaluateLinkedIn(linkedinId.trim(), customWeights);
      setResult(response);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('LinkedIn evaluation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!result) return null;

    const { parsing, scoring, errors } = result;

    return (
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ScoreIcon color="primary" />
            <Typography variant="h5">Evaluation Results</Typography>
          </Box>

          {/* Profile Info */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {result.fileName && (
                <Chip label={`File: ${result.fileName}`} variant="outlined" />
              )}
              {result.linkedinId && (
                <Chip label={`LinkedIn: ${result.linkedinId}`} variant="outlined" />
              )}
              {parsing.education && parsing.education.name && (
                <Chip label={`Name: ${parsing.education.name}`} variant="outlined" />
              )}
            </Box>
          </Box>

          {/* Score */}
          {scoring && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>Overall Score</Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="h4" color="primary">
                  {scoring.totalScore}/{scoring.maxPossibleScore}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  ({scoring.percentage.toFixed(1)}%)
                </Typography>
                <Chip 
                  label={scoring.grade || getScoreGrade(scoring.percentage)} 
                  color={
                    scoring.percentage >= 80 ? 'success' : 
                    scoring.percentage >= 60 ? 'warning' : 'error'
                  } 
                  variant="outlined" 
                />
              </Box>
              
              {/* Score Breakdown Accordion */}
              <Accordion 
                expanded={scoreExpanded} 
                onChange={(_, isExpanded) => setScoreExpanded(isExpanded)}
                sx={{ boxShadow: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" color="primary">
                    View Score Breakdown & Justification
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {scoring.breakdown && (
                    <Box>
                      {/* Education */}
                      {scoring.breakdown.education && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <SchoolIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold">
                              Education ({(scoring.breakdown.education.weight * 100).toFixed(0)}% weight)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Raw Score: {scoring.breakdown.education.raw}/10 → Weighted: {scoring.breakdown.education.weighted}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(scoring.breakdown.education.raw / 10) * 100} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Paper>
                      )}
                      
                      {/* Publications */}
                      {scoring.breakdown.publications && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <ArticleIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold">
                              Publications ({(scoring.breakdown.publications.weight * 100).toFixed(0)}% weight)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Raw Score: {scoring.breakdown.publications.raw}/10 → Weighted: {scoring.breakdown.publications.weighted}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(scoring.breakdown.publications.raw / 10) * 100} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Paper>
                      )}
                      
                      {/* Patents */}
                      {scoring.breakdown.patents && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <PatentIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold">
                              Patents ({(scoring.breakdown.patents.weight * 100).toFixed(0)}% weight)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Raw Score: {scoring.breakdown.patents.raw}/10 → Weighted: {scoring.breakdown.patents.weighted}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(scoring.breakdown.patents.raw / 10) * 100} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Paper>
                      )}
                      
                      {/* Work Experience */}
                      {scoring.breakdown.workExperience && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <WorkIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold">
                              Work Experience ({(scoring.breakdown.workExperience.weight * 100).toFixed(0)}% weight)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Raw Score: {scoring.breakdown.workExperience.raw}/10 → Weighted: {scoring.breakdown.workExperience.weighted}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(scoring.breakdown.workExperience.raw / 10) * 100} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Paper>
                      )}
                      
                      {/* GitHub */}
                      {scoring.breakdown.github && scoring.breakdown.github.weight > 0 && (
                        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <CodeIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" fontWeight="bold">
                              GitHub ({(scoring.breakdown.github.weight * 100).toFixed(0)}% weight)
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Raw: {scoring.breakdown.github.raw}/16 → Normalized: {scoring.breakdown.github.normalized}/10 → Weighted: {scoring.breakdown.github.weighted}
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={(scoring.breakdown.github.normalized / 10) * 100} 
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Paper>
                      )}
                      
                      {/* Calculation Summary */}
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          💡 Score Calculation:
                        </Typography>
                        <Typography variant="body2">
                          Final Score = {scoring.breakdown.education?.weighted || 0} + {scoring.breakdown.publications?.weighted || 0} + {scoring.breakdown.patents?.weighted || 0} + {scoring.breakdown.workExperience?.weighted || 0}{scoring.breakdown.github?.weight > 0 ? ` + ${scoring.breakdown.github.weighted}` : ''} = {scoring.totalScore}/10
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Parsing Results */}
          <Typography variant="h6" gutterBottom>Detailed Analysis</Typography>
          
          {parsing.education && (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">Education</Typography>
              <Typography variant="body2">
                {parsing.education.degree} in {parsing.education.fieldOfStudy} from {parsing.education.institute}
              </Typography>
            </Box>
          )}

          {parsing.publications && (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">Publications</Typography>
              <Typography variant="body2">
                {parsing.publications.numberOfPublications} publications, {parsing.publications.citations} citations, H-index: {parsing.publications.hIndex}
              </Typography>
            </Box>
          )}

          {parsing.patents && (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">Patents</Typography>
              <Typography variant="body2">
                {parsing.patents.grantedFirstInventor} granted (first inventor), {parsing.patents.grantedCoInventor} granted (co-inventor), {parsing.patents.filedPatent} filed
              </Typography>
            </Box>
          )}

          {parsing.workExperience && (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">Work Experience</Typography>
              <Typography variant="body2">
                Top AI Organizations: {parsing.workExperience.topAIOrganizations ? 'Yes' : 'No'}, 
                Impact Quality: {parsing.workExperience.impactQuality}/4, 
                Mentorship Role: {parsing.workExperience.mentorshipRole ? 'Yes' : 'No'}, 
                DL Frameworks: {parsing.workExperience.dlFrameworks ? 'Yes' : 'No'}
              </Typography>
            </Box>
          )}

          {parsing.github && (
            <Box mb={2}>
              <Typography variant="subtitle1" fontWeight="bold">GitHub</Typography>
              <Typography variant="body2">
                {parsing.github.githubUsername ? 
                  `@${parsing.github.githubUsername}, ${parsing.github.analysis.repoVolume} repos, ${parsing.github.analysis.popularity} stars` : 
                  'No GitHub profile found'
                }
              </Typography>
            </Box>
          )}

          {/* Errors */}
          {errors && errors.length > 0 && (
            <Box mt={3}>
              <Alert severity="warning">
                <Typography variant="subtitle2">Issues encountered:</Typography>
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            </Box>
          )}
        </Paper>

        <Button
          variant="outlined"
          onClick={() => {
            setResult(null);
            setFile(null);
            setLinkedinId('');
            setError(null);
          }}
        >
          Evaluate Another Profile
        </Button>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Button
          startIcon={<BackIcon />}
          onClick={onBack}
          variant="outlined"
        >
          Back to Menu
        </Button>
        <Typography variant="h4" component="h1">
          Profile Evaluation
        </Typography>
      </Box>

      {!result ? (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
              <Tab icon={<UploadIcon />} label="Upload CV" />
              <Tab icon={<LinkedInIcon />} label="LinkedIn Profile" />
            </Tabs>

            {/* Weights Configuration */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <SettingsIcon color="action" />
                  <Typography variant="h6">Scoring Weights</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useCustomWeights}
                        onChange={(e) => setUseCustomWeights(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Use Custom Weights"
                  />
                </Box>

                <Collapse in={useCustomWeights}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Customize the importance of each evaluation category. Weights must sum to 100%.
                  </Typography>

                  <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={2}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Education ({weights.education}%)
                      </Typography>
                      <Slider
                        value={weights.education}
                        onChange={(_, value) => handleWeightChange('education', value as number)}
                        min={0}
                        max={50}
                        step={1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 25, label: '25%' },
                          { value: 50, label: '50%' }
                        ]}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Patents ({weights.patents}%)
                      </Typography>
                      <Slider
                        value={weights.patents}
                        onChange={(_, value) => handleWeightChange('patents', value as number)}
                        min={0}
                        max={30}
                        step={1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 15, label: '15%' },
                          { value: 30, label: '30%' }
                        ]}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Publications ({weights.publications}%)
                      </Typography>
                      <Slider
                        value={weights.publications}
                        onChange={(_, value) => handleWeightChange('publications', value as number)}
                        min={0}
                        max={50}
                        step={1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 30, label: '30%' },
                          { value: 50, label: '50%' }
                        ]}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Work Experience ({weights.workExperience}%)
                      </Typography>
                      <Slider
                        value={weights.workExperience}
                        onChange={(_, value) => handleWeightChange('workExperience', value as number)}
                        min={0}
                        max={50}
                        step={1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 30, label: '30%' },
                          { value: 50, label: '50%' }
                        ]}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        GitHub ({weights.github}%)
                      </Typography>
                      <Slider
                        value={weights.github}
                        onChange={(_, value) => handleWeightChange('github', value as number)}
                        min={0}
                        max={20}
                        step={1}
                        marks={[
                          { value: 0, label: '0%' },
                          { value: 10, label: '10%' },
                          { value: 20, label: '20%' }
                        ]}
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box display="flex" alignItems="center" gap={2} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">
                        Total: {getTotalWeight()}%
                      </Typography>
                      <Chip 
                        label={getTotalWeight() === 100 ? "Valid" : "Must equal 100%"} 
                        color={getTotalWeight() === 100 ? "success" : "error"}
                        size="small"
                      />
                      <Button
                        size="small"
                        onClick={resetWeights}
                        variant="outlined"
                      >
                        Reset to Default
                      </Button>
                    </Box>
                  </Box>
                </Collapse>

                {!useCustomWeights && (
                  <Typography variant="body2" color="text.secondary">
                    Using default weights: Education 25%, Patents 13%, Publications 30%, Work Experience 30%, GitHub 2%
                  </Typography>
                )}
              </CardContent>
            </Card>

            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Upload CV File
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Supported formats: PDF, DOC, DOCX, TXT
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <input
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    id="cv-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="cv-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      sx={{ mb: 2 }}
                    >
                      Choose File
                    </Button>
                  </label>
                  {file && (
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Selected: {file.name}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  onClick={handleCVEvaluation}
                  disabled={!file || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <ScoreIcon />}
                >
                  {loading ? 'Evaluating...' : 'Evaluate CV'}
                </Button>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  LinkedIn Profile Evaluation
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Enter the LinkedIn profile ID (e.g., "johndoe" from linkedin.com/in/johndoe)
                </Typography>
                
                <TextField
                  fullWidth
                  label="LinkedIn Profile ID"
                  value={linkedinId}
                  onChange={(e) => setLinkedinId(e.target.value)}
                  placeholder="e.g., johndoe"
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  onClick={handleLinkedInEvaluation}
                  disabled={!linkedinId.trim() || loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <ScoreIcon />}
                >
                  {loading ? 'Evaluating...' : 'Evaluate LinkedIn Profile'}
                </Button>
                

              </Box>
            )}

            {error && (
              <EnhancedErrorDisplay error={error} onRetry={activeTab === 0 ? handleCVEvaluation : handleLinkedInEvaluation} />
            )}
          </CardContent>
        </Card>
      ) : (
        renderResults()
      )}
    </Container>
  );
};

export default ProfileEvaluator; 