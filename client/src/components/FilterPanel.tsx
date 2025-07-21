import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Stack, 
  Chip, 
  Button 
} from '@mui/material';
import { researcherService } from '../services/api';
import EducationFilter from './EducationFilter';
import PatentsFilter from './PatentsFilter';
import PublicationsFilter from './PublicationsFilter';
import ExperienceFilter from './ExperienceFilter';

interface FilterPanelProps {
  researcherCount: number;
  onSnackbar: (message: string, severity: 'success' | 'error' | 'info') => void;
  onFiltersChange: (filters: any) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ researcherCount, onSnackbar, onFiltersChange }) => {
  const [filters, setFilters] = useState({
    // Education filters
    degree: '',
    fieldOfStudy: '',
    instituteTier: '',
    // Patents filters
    grantedFirstInventor: false,
    grantedCoInventor: false,
    filedPatent: false,
    significantContribution: false,
    // Publications filters
    hasTopAIConferences: false,
    hasOtherAIConferences: false,
    hasReputableJournals: false,
    hasOtherJournals: false,
    minPublications: '',
    minCitations: '',
    // Experience filters
    experienceBracket: '',
    minHIndex: ''
  });

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      // Education filters
      degree: '',
      fieldOfStudy: '',
      instituteTier: '',
      // Patents filters
      grantedFirstInventor: false,
      grantedCoInventor: false,
      filedPatent: false,
      significantContribution: false,
      // Publications filters
      hasTopAIConferences: false,
      hasOtherAIConferences: false,
      hasReputableJournals: false,
      hasOtherJournals: false,
      minPublications: '',
      minCitations: '',
      // Experience filters
      experienceBracket: '',
      minHIndex: ''
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Box sx={{ width: '300px', flexShrink: 0 }}>
      <Paper elevation={2} sx={{ p: 2, position: 'sticky', top: 24 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {researcherCount} results found
        </Typography>
        
        {/* Education Filters */}
        <EducationFilter 
          filters={{
            degree: filters.degree,
            fieldOfStudy: filters.fieldOfStudy,
            instituteTier: filters.instituteTier
          }}
          onFilterChange={handleFilterChange}
        />

        {/* Patents Filters */}
        <PatentsFilter 
          filters={{
            grantedFirstInventor: filters.grantedFirstInventor,
            grantedCoInventor: filters.grantedCoInventor,
            filedPatent: filters.filedPatent,
            significantContribution: filters.significantContribution
          }}
          onFilterChange={handleFilterChange}
        />

        {/* Publications Filters */}
        <PublicationsFilter 
          filters={{
            hasTopAIConferences: filters.hasTopAIConferences,
            hasOtherAIConferences: filters.hasOtherAIConferences,
            hasReputableJournals: filters.hasReputableJournals,
            hasOtherJournals: filters.hasOtherJournals,
            minPublications: filters.minPublications,
            minCitations: filters.minCitations
          }}
          onFilterChange={handleFilterChange}
        />

        {/* Experience Filters */}
        <ExperienceFilter 
          filters={{
            experienceBracket: filters.experienceBracket,
            minHIndex: filters.minHIndex
          }}
          onFilterChange={handleFilterChange}
        />

        {/* Quick Actions */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Quick Actions
          </Typography>
          <Stack spacing={1}>
            <Chip 
              label="Clear All Filters" 
              variant="outlined" 
              size="small" 
              onClick={clearFilters}
              color="secondary"
            />
          </Stack>
          
          <Box sx={{ mt: 3 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={async () => {
                try {
                  await researcherService.exportCSV();
                  onSnackbar('CSV exported successfully!', 'success');
                } catch (error) {
                  onSnackbar('Failed to export CSV', 'error');
                }
              }}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FilterPanel; 