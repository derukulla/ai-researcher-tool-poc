import React from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';

interface PatentsFilterProps {
  filters: {
    grantedFirstInventor: boolean;
    grantedCoInventor: boolean;
    filedPatent: boolean;
    significantContribution: boolean;
  };
  onFilterChange: (filterType: string, value: boolean) => void;
}

const PatentsFilter: React.FC<PatentsFilterProps> = ({ filters, onFilterChange }) => {
  const handleChange = (filterType: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(filterType, event.target.checked);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Patents Filters
      </Typography>
      
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.grantedFirstInventor}
              onChange={handleChange('grantedFirstInventor')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Granted Patent as First Inventor (AI-related)
            </Typography>
          }
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.grantedCoInventor}
              onChange={handleChange('grantedCoInventor')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Granted Patent as Co-Inventor (AI-related)
            </Typography>
          }
        />
        
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.filedPatent}
              onChange={handleChange('filedPatent')}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              Filed Patent (AI-related)
            </Typography>
          }
        />
        
      </FormGroup>
    </Box>
  );
};

export default PatentsFilter; 