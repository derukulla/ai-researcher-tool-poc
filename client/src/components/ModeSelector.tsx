import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container
} from '@mui/material';
import {
  Assessment as ScoreIcon,
  People as ResearchersIcon,
  Upload as UploadIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';

interface ModeSelectorProps {
  onSelectMode: (mode: 'score' | 'researchers') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          AI Researcher Tool
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Choose how you'd like to use our AI-powered researcher evaluation system
        </Typography>
      </Box>

      <Box display="flex" gap={4} flexDirection={{ xs: 'column', md: 'row' }}>
        <Box flex={1}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
            onClick={() => onSelectMode('score')}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ScoreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom>
                Score CV/Profile
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Upload a CV or provide a LinkedIn profile to get an AI-powered evaluation and scoring
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                  <UploadIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Upload CV files (PDF, DOC, TXT)</Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                  <LinkedInIcon sx={{ fontSize: 20 }} />
                  <Typography variant="body2">Enter LinkedIn profile ID</Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                size="large"
                sx={{ mt: 3, minWidth: 200 }}
                onClick={() => onSelectMode('score')}
              >
                Start Evaluation
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box flex={1}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
            onClick={() => onSelectMode('researchers')}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ResearchersIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom>
                Get Top Researchers
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Browse and filter our database of AI researchers with advanced search capabilities
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  • Filter by education, publications, patents
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Sort by AI expertise and experience
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Export results to CSV
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                sx={{ mt: 3, minWidth: 200 }}
                onClick={() => onSelectMode('researchers')}
              >
                Browse Researchers
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default ModeSelector; 