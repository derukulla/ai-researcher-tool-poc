import React from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider
} from '@mui/material';

interface PublicationsFilterProps {
  filters: {
    hasTopAIConferences: boolean;
    hasOtherAIConferences: boolean;
    hasReputableJournals: boolean;
    hasOtherJournals: boolean;
    minPublications: string;
    minCitations: string;
  };
  onFilterChange: (filterType: string, value: boolean | string) => void;
}

const PublicationsFilter: React.FC<PublicationsFilterProps> = ({ filters, onFilterChange }) => {
  const handleCheckboxChange = (filterType: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(filterType, event.target.checked);
  };

  const handleNumberChange = (filterType: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(filterType, event.target.value);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Publications & Citations
      </Typography>
      
      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasTopAIConferences}
              onChange={handleCheckboxChange('hasTopAIConferences')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Published in Top AI Conferences
            </Typography>
          }
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
          CVPR, ECCV, NeurIPS, ICLR, AAAI, ICCV, ICML, SIGGRAPH
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasOtherAIConferences}
              onChange={handleCheckboxChange('hasOtherAIConferences')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Published in Other AI Conferences
            </Typography>
          }
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasReputableJournals}
              onChange={handleCheckboxChange('hasReputableJournals')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Published in Reputable AI Journals
            </Typography>
          }
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
          JMLR, PAMI, TACL, etc.
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.hasOtherJournals}
              onChange={handleCheckboxChange('hasOtherJournals')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Published in Other Peer-Reviewed Journals
            </Typography>
          }
        />
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      {/* Numeric Filters */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Min Publications"
          type="number"
          size="small"
          value={filters.minPublications}
          onChange={handleNumberChange('minPublications')}
          placeholder="e.g., 5"
          inputProps={{ min: 0 }}
        />
        
        <TextField
          label="Min Citations"
          type="number"
          size="small"
          value={filters.minCitations}
          onChange={handleNumberChange('minCitations')}
          placeholder="e.g., 100"
          inputProps={{ min: 0 }}
        />
      </Box>
    </Box>
  );
};

export default PublicationsFilter; 