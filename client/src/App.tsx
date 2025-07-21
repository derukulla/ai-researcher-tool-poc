import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Collapse,
  Button,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon
} from '@mui/icons-material';
import { researcherService } from './services/api';
import { Researcher } from './types';
import { 
  Header, 
  FilterPanel, 
  ResearcherList, 
  NotificationSnackbar,
  ModeSelector,
  ProfileEvaluator
} from './components';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [mode, setMode] = useState<'menu' | 'score' | 'researchers'>('menu');
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' as 'success' | 'error' | 'info' 
  });

  // Weights configuration (matching backend defaults)
  const [weights, setWeights] = useState({
    education: 25,      // 25%
    patents: 15,        // 15%
    publications: 30,   // 30%
    workExperience: 30, // 30%
    github: 0           // 0%
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
      patents: 15,
      publications: 30,
      workExperience: 30,
      github: 0
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

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch researchers from API
  const fetchResearchers = async (filters = {}) => {
    try {
      setLoading(true);
      
      // Prepare weights for API
      const apiWeights = getWeightsForAPI();
      if (apiWeights) {
        console.log('🎯 Using custom weights:', apiWeights);
      }
      
      const response = await researcherService.getFiltered(filters, apiWeights);
      setResearchers(response.researchers);
    } catch (error) {
      console.error('Failed to fetch researchers:', error);
      showSnackbar('Failed to load researchers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'researchers') {
    fetchResearchers();
    }
  }, [mode]);

  const handleFiltersChange = (filters: any) => {
    // Filter out empty/false values, but keep boolean true values and valid numbers
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => {
        if (typeof value === 'boolean') {
          return value === true; // Only include true boolean values
        }
        if (typeof value === 'string') {
          // For numeric strings, convert to number and check if valid
          if (['minPublications', 'minCitations', 'minHIndex'].some(field => filters.hasOwnProperty(field))) {
            const numValue = parseInt(value as string);
            if (!isNaN(numValue) && numValue > 0) {
              return true; // Include valid positive numbers
            }
          }
          return value !== ''; // For other strings, exclude empty values
        }
        return false;
      })
    );
    
    // Convert numeric strings to numbers for API
    const processedFilters = Object.fromEntries(
      Object.entries(activeFilters).map(([key, value]) => {
        if (['minPublications', 'minCitations', 'minHIndex'].includes(key) && typeof value === 'string') {
          return [key, parseInt(value)];
        }
        return [key, value];
      })
    );
    
    fetchResearchers(processedFilters);
  };

  // Weights Configuration Component
  const WeightsPanel = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <SettingsIcon color="action" />
          <Typography variant="h6">Scoring Weights</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={useCustomWeights}
                onChange={(e) => {
                  setUseCustomWeights(e.target.checked);
                  // Refetch researchers when weights toggle changes
                  setTimeout(() => fetchResearchers(), 100);
                }}
                color="primary"
              />
            }
            label="Custom"
          />
        </Box>

        <Collapse in={useCustomWeights}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Customize scoring importance. Weights must sum to 100%.
          </Typography>

          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
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
                sx={{ mb: 1 }}
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
                sx={{ mb: 1 }}
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
                sx={{ mb: 1 }}
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
                sx={{ mb: 1 }}
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
                sx={{ mb: 1 }}
              />
            </Box>
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
              onClick={() => {
                resetWeights();
                setTimeout(() => fetchResearchers(), 100);
              }}
              variant="outlined"
            >
              Reset
            </Button>
            <Button
              size="small"
              onClick={() => {
                if (getTotalWeight() === 100) {
                  fetchResearchers();
                  showSnackbar('Scores updated with custom weights', 'success');
                } else {
                  showSnackbar('Weights must sum to 100%', 'error');
                }
              }}
              variant="contained"
              disabled={getTotalWeight() !== 100}
            >
              Apply Weights
            </Button>
          </Box>
        </Collapse>

        {!useCustomWeights && (
          <Typography variant="body2" color="text.secondary">
            Using default weights: Education 25%, Patents 15%, Publications 30%, Work Experience 30%, GitHub 0%
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (mode) {
      case 'menu':
        return <ModeSelector onSelectMode={setMode} />;
      
      case 'score':
        return <ProfileEvaluator onBack={() => setMode('menu')} />;
      
      case 'researchers':
  return (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setMode('menu')}
                sx={{ mb: 2 }}
              >
                ← Back to Menu
              </Button>
            </Box>
          <Box display="flex" gap={3}>
              <Box sx={{ width: 300, flexShrink: 0 }}>
                <WeightsPanel />
            <FilterPanel 
              researcherCount={researchers.length}
              onSnackbar={showSnackbar}
              onFiltersChange={handleFiltersChange}
            />
              </Box>
            <ResearcherList 
              researchers={researchers}
              loading={loading}
            />
          </Box>
        </Container>
        );
      
      default:
        return <ModeSelector onSelectMode={setMode} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
        {mode === 'researchers' && <Header />}
        {renderContent()}

        <NotificationSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
