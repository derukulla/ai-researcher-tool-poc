import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip 
} from '@mui/material';
import { Researcher } from '../types';

interface ResearcherCardProps {
  researcher: Researcher;
}

const ResearcherCard: React.FC<ResearcherCardProps> = ({ researcher }) => {
  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'default';
    if (grade.includes('A')) return 'success';
    if (grade.includes('B')) return 'info';
    if (grade.includes('C')) return 'warning';
    return 'error';
  };

  return (
    <Card elevation={2} sx={{ '&:hover': { elevation: 4 } }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Avatar */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}
          >
            {researcher.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
          </Box>

          {/* Main Content */}
          <Box flex={1}>
            <Typography variant="h6" component="h3">
              {researcher.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {researcher.email}
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
              {/* Education */}
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎓 Education
                </Typography>
                <Chip 
                  label={researcher.education.degree}
                  size="small"
                  color="primary"
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {researcher.education.fieldOfStudy}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {researcher.education.institute}
                </Typography>
              </Box>

              {/* Score */}
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📊 Score
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" color="primary">
                    {researcher.score || 0}
                  </Typography>
                  <Chip 
                    label={researcher.grade || 'N/A'}
                    size="small"
                    color={getGradeColor(researcher.grade) as any}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Out of 10 points
                </Typography>
              </Box>

              {/* Status */}
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📍 Status
                </Typography>
                <Chip 
                  label="Active Researcher" 
                  size="small" 
                  color="success"
                />
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Last updated: Today
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResearcherCard; 