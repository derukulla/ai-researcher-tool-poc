import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

interface EducationFilterProps {
  filters: {
    degree: string;
    fieldOfStudy: string;
    instituteTier: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
}

const EducationFilter: React.FC<EducationFilterProps> = ({ filters, onFilterChange }) => {
  const handleChange = (event: SelectChangeEvent<string>, filterType: string) => {
    onFilterChange(filterType, event.target.value);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Education Filters
      </Typography>
      
      {/* Highest Degree */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Highest Degree</InputLabel>
        <Select
          value={filters.degree}
          label="Highest Degree"
          onChange={(e) => handleChange(e, 'degree')}
        >
          <MenuItem value="">All Degrees</MenuItem>
          <MenuItem value="PhD">PhD</MenuItem>
          <MenuItem value="Master's">Master's</MenuItem>
          <MenuItem value="Pursuing PhD">Pursuing PhD</MenuItem>
        </Select>
      </FormControl>

      {/* Field of Study */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Field of Study</InputLabel>
        <Select
          value={filters.fieldOfStudy}
          label="Field of Study"
          onChange={(e) => handleChange(e, 'fieldOfStudy')}
        >
          <MenuItem value="">All Fields</MenuItem>
          <MenuItem value="AI">AI</MenuItem>
          <MenuItem value="Computer Science">Computer Science</MenuItem>
          <MenuItem value="Machine Learning">Machine Learning</MenuItem>
          <MenuItem value="Computer Vision">Computer Vision</MenuItem>
          <MenuItem value="NLP">NLP</MenuItem>
          <MenuItem value="Related Fields">Related Fields</MenuItem>
        </Select>
      </FormControl>

      {/* Institute Tier */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Institute Tier</InputLabel>
        <Select
          value={filters.instituteTier}
          label="Institute Tier"
          onChange={(e) => handleChange(e, 'instituteTier')}
        >
          <MenuItem value="">All Institutes</MenuItem>
          <MenuItem value="Top Institute (QS <300)">Top Institute (QS &lt;300)</MenuItem>
          <MenuItem value="Other Institute (QS >300)">Other Institute (QS &gt;300)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default EducationFilter; 