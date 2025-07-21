import React from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Stack 
} from '@mui/material';
import ResearcherCard from './ResearcherCard';
import { Researcher } from '../types';

interface ResearcherListProps {
  researchers: Researcher[];
  loading: boolean;
}

const ResearcherList: React.FC<ResearcherListProps> = ({ researchers, loading }) => {
  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Researchers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Showing {researchers.length} researchers with automated scoring
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {researchers.map((researcher) => (
            <ResearcherCard key={researcher.id} researcher={researcher} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ResearcherList; 