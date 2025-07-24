import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Article as ArticleIcon,
  Lightbulb as PatentIcon,
  Code as CodeIcon,
  LinkedIn as LinkedInIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface ProfileSearchResultsProps {
  searchResults: any;
  loading: boolean;
}

const ProfileSearchResults: React.FC<ProfileSearchResultsProps> = ({ searchResults, loading }) => {
  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Searching LinkedIn Profiles...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a few minutes
        </Typography>
      </Box>
    );
  }

  if (!searchResults) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No search performed yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your filters and click "Apply Filters" to search LinkedIn profiles
        </Typography>
      </Box>
    );
  }

  const { success, profiles = [], summary, error } = searchResults;

  if (!success) {
    return (
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>Search Failed</Typography>
          <Typography variant="body2">{error || 'An unknown error occurred'}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Search Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          LinkedIn Profile Search Results
        </Typography>
        
        {summary && (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Found {profiles.length} profiles out of {summary.profilesProcessed} processed 
              ({summary.searchResults} initial search results)
            </Typography>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip 
                icon={<PersonIcon />}
                label={`${profiles.length} Profiles Found`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`${Math.round(summary.processingTime / 1000)}s Processing Time`} 
                variant="outlined" 
              />
              {summary.averageTimePerProfile && (
                <Chip 
                  label={`~${summary.averageTimePerProfile}ms per profile`} 
                  variant="outlined" 
                />
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Profile Results */}
      {profiles.length === 0 ? (
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>No Profiles Found</Typography>
          <Typography variant="body2">
            No LinkedIn profiles matched your filter criteria. Try adjusting your filters to be less restrictive.
          </Typography>
        </Alert>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {profiles.map((profile: any, index: number) => (
            <Box key={profile.username || index}>
              <ProfileCard profile={profile} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const ProfileCard: React.FC<{ profile: any }> = ({ profile }) => {
  const { username, profileName, url, parsing, passedFilters = [], errors = [] } = profile;

  // Debug: Log the publications data structure
  if (parsing.publications) {
    console.log(`📊 Publications data for ${username}:`, parsing.publications);
  }

  const getStatusIcon = (status: boolean) => status ? <CheckIcon /> : <ErrorIcon />;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom>
              {profileName || username || 'Unknown Profile'}
            </Typography>
            
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Chip 
                icon={<LinkedInIcon />}
                label={username} 
                variant="outlined" 
                size="small"
                component="a"
                href={url}
                target="_blank"
                clickable
              />
              <Chip 
                label={`${passedFilters.length} filters passed`}
                color={passedFilters.length > 0 ? 'success' : 'default'}
                size="small"
              />
              {errors.length > 0 && (
                <Chip 
                  icon={<WarningIcon />}
                  label={`${errors.length} errors`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Parsing Results */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Profile Analysis:
          </Typography>
          
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
            {/* Education */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(passedFilters.includes('education'))}
              <SchoolIcon color={passedFilters.includes('education') ? 'success' : 'disabled'} />
              <Box>
                <Typography variant="body2" fontWeight="medium">Education</Typography>
                {parsing.education && (
                  <Typography variant="caption" color="text.secondary">
                    {parsing.education.degree || 'N/A'} in {parsing.education.fieldOfStudy || 'N/A'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Publications */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(passedFilters.includes('publications'))}
              <ArticleIcon color={passedFilters.includes('publications') ? 'success' : 'disabled'} />
              <Box>
                                  <Typography variant="body2" fontWeight="medium">Publications</Typography>
                  {parsing.publications && (
                    <Typography variant="caption" color="text.secondary">
                      {parsing.publications.citations || 0} citations, H-index: {parsing.publications.hIndex || 0}
                    </Typography>
                  )}
              </Box>
            </Box>

            {/* Patents */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(passedFilters.includes('patents'))}
              <PatentIcon color={passedFilters.includes('patents') ? 'success' : 'disabled'} />
              <Box>
                <Typography variant="body2" fontWeight="medium">Patents</Typography>
                {parsing.patents && (
                  <Typography variant="caption" color="text.secondary">
                    {parsing.patents.grantedFirstInventor ? 'First inventor' : 'Co-inventor/None'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Work Experience */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(passedFilters.includes('workExperience'))}
              <WorkIcon color={passedFilters.includes('workExperience') ? 'success' : 'disabled'} />
              <Box>
                <Typography variant="body2" fontWeight="medium">Experience</Typography>
                {parsing.workExperience && (
                  <Typography variant="caption" color="text.secondary">
                    {parsing.workExperience.topAIOrganizations ? 'Top AI org' : 'Other orgs'}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* GitHub */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(passedFilters.includes('github'))}
              <CodeIcon color={passedFilters.includes('github') ? 'success' : 'disabled'} />
              <Box>
                <Typography variant="body2" fontWeight="medium">GitHub</Typography>
                {parsing.github && (
                  <Typography variant="caption" color="text.secondary">
                    {parsing.github.githubUsername || 'No profile found'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Errors */}
        {errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom>
              Processing Errors:
            </Typography>
            {errors.map((error: string, index: number) => (
              <Typography key={index} variant="caption" color="text.secondary" display="block">
                • {error}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSearchResults; 