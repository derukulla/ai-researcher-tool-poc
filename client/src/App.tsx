import React, { useState } from 'react';
import {
  Container,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Typography,
  Button
} from '@mui/material';
import { researcherService } from './services/api';
import { Researcher } from './types';
import { 
  Header, 
  FilterPanel, 
  NotificationSnackbar,
  ModeSelector,
  ProfileEvaluator,
  ProfileSearchResults
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
  const [loading, setLoading] = useState(false);
  const [profileSearchResults, setProfileSearchResults] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' as 'success' | 'error' | 'info' 
  });



  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleProfileSearch = (searchResults: any) => {
    setProfileSearchResults(searchResults);
  };

  const handleLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  };



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
            <FilterPanel 
              researcherCount={profileSearchResults?.profiles?.length || 0}
              onSnackbar={showSnackbar}
              onFiltersChange={() => {}} // Not used in profile search mode
              onProfileSearch={handleProfileSearch}
              onLoadingChange={handleLoadingChange}
              searchMode="profile-search"
              profileSearchResults={profileSearchResults}
            />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" gutterBottom>
                  LinkedIn Profile Search
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Search and filter LinkedIn profiles using comprehensive AI-powered analysis
                </Typography>
                <ProfileSearchResults 
                  searchResults={profileSearchResults}
              loading={loading}
            />
              </Box>
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
