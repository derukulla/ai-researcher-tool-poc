import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent
} from '@mui/material';

interface ExperienceFilterProps {
  filters: {
    experienceBracket: string;
    minHIndex: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
}

const ExperienceFilter: React.FC<ExperienceFilterProps> = ({ filters, onFilterChange }) => {
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    onFilterChange('experienceBracket', event.target.value);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange('minHIndex', event.target.value);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="primary" gutterBottom>
        Experience & H-Index
      </Typography>
      
      {/* Experience Bracket */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Experience Bracket</InputLabel>
        <Select
          value={filters.experienceBracket}
          label="Experience Bracket"
          onChange={handleSelectChange}
        >
          <MenuItem value="">All Experience Levels</MenuItem>
          <MenuItem value="0-3">0–3 Years</MenuItem>
          <MenuItem value="3-6">3–6 Years</MenuItem>
          <MenuItem value="6-10">6–10 Years</MenuItem>
          <MenuItem value="10+">10+ Years</MenuItem>
        </Select>
      </FormControl>

      {/* H-Index */}
      <TextField
        label="Min H-Index"
        type="number"
        size="small"
        fullWidth
        value={filters.minHIndex}
        onChange={handleNumberChange}
        placeholder="e.g., 10"
        inputProps={{ min: 0 }}
        helperText="Minimum H-Index threshold"
      />
    </Box>
  );
};

export default ExperienceFilter; 