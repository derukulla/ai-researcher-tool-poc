import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Stack, 
  Button 
} from '@mui/material';
import * as XLSX from 'xlsx';
import { researcherService, profileSearchService } from '../services/api';
import EducationFilter from './EducationFilter';
import PatentsFilter from './PatentsFilter';
import PublicationsFilter from './PublicationsFilter';
import ExperienceFilter from './ExperienceFilter';

interface FilterPanelProps {
  researcherCount: number;
  onSnackbar: (message: string, severity: 'success' | 'error' | 'info') => void;
  onFiltersChange: (filters: any) => void;
  onProfileSearch?: (searchResults: any) => void;
  searchMode?: 'researchers' | 'profile-search';
  onLoadingChange?: (loading: boolean) => void;
  profileSearchResults?: any;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  researcherCount, 
  onSnackbar, 
  onFiltersChange, 
  onProfileSearch,
  searchMode = 'researchers',
  onLoadingChange,
  profileSearchResults
}) => {
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

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    // Don't call onFiltersChange here - wait for submit
  };

  const applyFilters = async () => {
    try {
      setAppliedFilters(filters);
      
      if (searchMode === 'profile-search' && onProfileSearch) {
        // Clean up filters - remove empty strings and convert numeric strings to numbers
        const cleanedFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => {
            if (typeof value === 'boolean') {
              return value === true; // Only include true boolean values
            }
            if (typeof value === 'string') {
              return value !== ''; // Exclude empty strings
            }
            return false;
          }).map(([key, value]) => {
            // Convert numeric strings to numbers for API
            if (['minPublications', 'minCitations', 'minHIndex'].includes(key) && typeof value === 'string') {
              return [key, parseInt(value)];
            }
            return [key, value];
          })
        );
        
        // Use profile search API
        onSnackbar('Searching LinkedIn profiles...', 'info');
        onLoadingChange?.(true); // Set loading to true when search starts
        
        const searchResults = await profileSearchService.search(cleanedFilters, {
          maxProfiles: 20,
          maxSearchResults: 50
        });
        
        onLoadingChange?.(false); // Set loading to false when search completes
        onProfileSearch(searchResults);
        onSnackbar(`Profile search completed! Found ${searchResults.profiles?.length || 0} profiles`, 'success');
      } else {
        // Use regular researchers API
        onFiltersChange(filters);
        onSnackbar('Filters applied successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Filter application error:', error);
      onLoadingChange?.(false); // Set loading to false on error
      onSnackbar(error.response?.data?.error || 'Failed to apply filters', 'error');
    }
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
    setAppliedFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onSnackbar('All filters cleared!', 'info');
  };

  const hasChanges = () => {
    return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
  };

  const exportProfileSearchExcel = () => {
    if (!profileSearchResults?.profiles || profileSearchResults.profiles.length === 0) {
      onSnackbar('No profile search results to export', 'error');
      return;
    }

    const profiles = profileSearchResults.profiles;
    
    // Create comprehensive Excel data
    const excelData = profiles.map((profile: any) => {
      const parsing = profile.parsing || {};
      const education = parsing.education || {};
      const publications = parsing.publications || {};
      const patents = parsing.patents || {};
      const github = parsing.github || {};
      const workExp = parsing.workExperience || {};
      
      return {
        // Basic Info
        'Name': profile.profileName || '',
        'LinkedIn Username': profile.username || '',
        'LinkedIn URL': profile.url || '',
        'Title': profile.title || '',
        'Passed Filters': (profile.passedFilters || []).join(', '),
        
        // Education
        'Education Degree': education.degree || '',
        'Education Institute': education.institute || '',
        'Education Field of Study': education.fieldOfStudy || '',
        'Education Institute Tier': education.instituteTier || '',
        'Education Score': profile.scoring?.breakdown?.education?.raw || 0,
        
        // Publications
        'Publications Count': publications.numberOfPublications || 0,
        'Total Citations': publications.citations || 0,
        'H-Index': publications.hIndex || 0,
        'Experience Bracket': publications.experienceBracket || '',
        'Top AI Conferences': publications.venueQuality?.hasTopAIConference ? 'Yes' : 'No',
        'Other AI Conferences': publications.venueQuality?.hasOtherAIConference ? 'Yes' : 'No',
        'Reputable Journals': publications.venueQuality?.hasReputableJournal ? 'Yes' : 'No',
        'Other Peer Reviewed': publications.venueQuality?.hasOtherPeerReviewed ? 'Yes' : 'No',
        'Publications Profiles Compared': publications.profilesCompared || 0,

        'Publications Total Score': profile.scoring?.breakdown?.publications?.raw || 0,
        
        // Patents
        'Patents Granted (First Inventor)': patents.grantedFirstInventor ? 'Yes' : 'No',
        'Patents Granted (Co-Inventor)': ( patents.grantedFirstInventor || patents.grantedCoInventor) ? 'Yes' : 'No' ,
        'Patents Filed': ( patents.grantedFirstInventor || patents.grantedCoInventor || patents.filedPatent) ? 'Yes' : 'No' ,
        'Patents Total Score': profile.scoring?.breakdown?.patents?.raw || 0,
        
        // GitHub
        'GitHub Username': github.githubUsername || '',
        'GitHub Profile URL': github.profileUrl || '',
        'GitHub Name': github.fullName || '',
        'GitHub Company': github.company || '',
        'GitHub Location': github.location || '',
        'GitHub Bio': github.bio || '',
        'GitHub Public Repos': github.publicRepos || 0,
        'GitHub Followers': github.followers || 0,
        'GitHub Created At': github.createdAt || '',
        'GitHub Repo Volume': github.analysis?.repoVolume || 0,
        'GitHub Repo Initiative': github.analysis?.repoInitiative || 0,
        'GitHub Recent Activity': github.analysis?.recentActivity || 0,
        'GitHub Popularity': github.analysis?.popularity || 0,
        'GitHub AI Relevance': github.analysis?.aiRelevance ? 'Yes' : 'No',
        'GitHub Score': profile.scoring?.breakdown?.github?.raw || 0,
        
        // Work Experience
        'Top AI Organizations': workExp.topAIOrganizations ? 'Yes' : 'No',
        'Impact Quality': workExp.impactQuality || 1,
        'Mentorship Role': workExp.mentorshipRole ? 'Yes' : 'No',
        'DL Frameworks Experience': workExp.dlFrameworks ? 'Yes' : 'No',
        'Years of Experience': workExp.yearsOfExperience || 0,
        'Work Experience Reasoning': workExp.reasoning || '',
        'Work Experience Score': profile.scoring?.breakdown?.workExperience?.raw || 0,
        
        // Total Scores (from scoring breakdown)
        'Total Score': profile.scoring?.totalScore || 0,
        'Total Score Percentage': profile.scoring?.percentage || 0,
        'Grade': profile.scoring?.grade || '',
        'Max Possible Score': profile.scoring?.maxPossibleScore || 10,
        
        // Raw Scores
        'Education Score Raw': profile.scoring?.breakdown?.education?.raw || 0,
        'Publications Score Raw': profile.scoring?.breakdown?.publications?.raw || 0,
        'Patents Score Raw': profile.scoring?.breakdown?.patents?.raw || 0,
        'GitHub Score Raw': profile.scoring?.breakdown?.github?.raw || 0,
        'Work Experience Score Raw': profile.scoring?.breakdown?.workExperience?.raw || 0,
        
        // Weighted Scores
        'Education Score Weighted': profile.scoring?.breakdown?.education?.weighted || 0,
        'Publications Score Weighted': profile.scoring?.breakdown?.publications?.weighted || 0,
        'Patents Score Weighted': profile.scoring?.breakdown?.patents?.weighted || 0,
        'GitHub Score Weighted': profile.scoring?.breakdown?.github?.weighted || 0,
        'Work Experience Score Weighted': profile.scoring?.breakdown?.workExperience?.weighted || 0,
        
        // Weights Used
        'Education Weight': profile.scoring?.breakdown?.education?.weight || 0,
        'Publications Weight': profile.scoring?.breakdown?.publications?.weight || 0,
        'Patents Weight': profile.scoring?.breakdown?.patents?.weight || 0,
        'GitHub Weight': profile.scoring?.breakdown?.github?.weight || 0,
        'Work Experience Weight': profile.scoring?.breakdown?.workExperience?.weight || 0
      };
    });

    // Create worksheet from JSON data
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Profile Search Results');
    
    // Set column widths for better readability (68 columns total)
    const columnWidths = [
      // Basic Info (5 columns)
      { wch: 20 }, // 1. Name
      { wch: 15 }, // 2. LinkedIn Username
      { wch: 30 }, // 3. LinkedIn URL
      { wch: 25 }, // 4. Title
      { wch: 20 }, // 5. Passed Filters
      
      // Education (5 columns)
      { wch: 15 }, // 6. Education Degree
      { wch: 25 }, // 7. Education Institute
      { wch: 20 }, // 8. Education Field of Study
      { wch: 15 }, // 9. Education Institute Tier
      { wch: 12 }, // 10. Education Score
      
      // Publications (13 columns)
      { wch: 12 }, // 11. Publications Count
      { wch: 12 }, // 12. Total Citations
      { wch: 10 }, // 13. H-Index
      { wch: 15 }, // 14. Experience Bracket
      { wch: 15 }, // 15. Top AI Conferences
      { wch: 18 }, // 16. Other AI Conferences
      { wch: 18 }, // 17. Reputable Journals
      { wch: 18 }, // 18. Other Peer Reviewed
      { wch: 15 }, // 19. Publications Confidence
      { wch: 20 }, // 20. Publications Profiles Compared
      { wch: 30 }, // 21. recentPublications
      { wch: 25 }, // 22. researchAreas
      { wch: 15 }, // 23. Publications Total Score
      
      // Patents (4 columns)
      { wch: 20 }, // 24. Patents Granted (First Inventor)
      { wch: 18 }, // 25. Patents Granted (Co-Inventor)
      { wch: 12 }, // 26. Patents Filed
      { wch: 15 }, // 27. Patents Total Score
      
      // GitHub (15 columns)
      { wch: 15 }, // 28. GitHub Username
      { wch: 30 }, // 29. GitHub Profile URL
      { wch: 20 }, // 30. GitHub Name
      { wch: 20 }, // 31. GitHub Company
      { wch: 15 }, // 32. GitHub Location
      { wch: 30 }, // 33. GitHub Bio
      { wch: 12 }, // 34. GitHub Public Repos
      { wch: 12 }, // 35. GitHub Followers
      { wch: 15 }, // 36. GitHub Created At
      { wch: 12 }, // 37. GitHub Repo Volume
      { wch: 15 }, // 38. GitHub Repo Initiative
      { wch: 15 }, // 39. GitHub Recent Activity
      { wch: 12 }, // 40. GitHub Popularity
      { wch: 15 }, // 41. GitHub AI Relevance
      { wch: 12 }, // 42. GitHub Score
      
      // Work Experience (7 columns)
      { wch: 15 }, // 43. Top AI Organizations
      { wch: 12 }, // 44. Impact Quality
      { wch: 15 }, // 45. Mentorship Role
      { wch: 18 }, // 46. DL Frameworks Experience
      { wch: 15 }, // 47. Years of Experience
      { wch: 40 }, // 48. Work Experience Reasoning
      { wch: 18 }, // 49. Work Experience Score
      
      // Total Score Section (4 columns)
      { wch: 12 }, // 50. Total Score
      { wch: 15 }, // 51. Total Score Percentage
      { wch: 10 }, // 52. Grade
      { wch: 15 }, // 53. Max Possible Score
      
      // Raw Scores (5 columns)
      { wch: 15 }, // 54. Education Score Raw
      { wch: 18 }, // 55. Publications Score Raw
      { wch: 12 }, // 56. Patents Score Raw
      { wch: 12 }, // 57. GitHub Score Raw
      { wch: 18 }, // 58. Work Experience Score Raw
      
      // Weighted Scores (5 columns)
      { wch: 18 }, // 59. Education Score Weighted
      { wch: 20 }, // 60. Publications Score Weighted
      { wch: 15 }, // 61. Patents Score Weighted
      { wch: 15 }, // 62. GitHub Score Weighted
      { wch: 20 }, // 63. Work Experience Score Weighted
      
      // Weights Used (5 columns)
      { wch: 15 }, // 64. Education Weight
      { wch: 18 }, // 65. Publications Weight
      { wch: 12 }, // 66. Patents Weight
      { wch: 12 }, // 67. GitHub Weight
      { wch: 18 }  // 68. Work Experience Weight
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Generate Excel file and download
    const fileName = `profile_search_results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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

        {/* Filter Actions */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Filter Actions
          </Typography>
          <Stack spacing={1.5}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={applyFilters}
              disabled={!hasChanges()}
              color="primary"
            >
              Apply Filters
            </Button>
            
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={clearFilters}
              color="secondary"
            >
              Clear All Filters
            </Button>
          </Stack>
          
          {hasChanges() && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              You have unsaved filter changes
            </Typography>
          )}
        </Box>

        {/* Quick Actions */}
          <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Quick Actions
          </Typography>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={async () => {
                try {
                  if (searchMode === 'profile-search') {
                    exportProfileSearchExcel();
                    onSnackbar('Profile search results exported successfully!', 'success');
                  } else {
                    await researcherService.exportCSV();
                    onSnackbar('CSV exported successfully!', 'success');
                  }
                } catch (error) {
                  onSnackbar('Failed to export CSV', 'error');
                }
              }}
            >
              {searchMode === 'profile-search' ? 'Export Excel' : 'Export CSV'}
            </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default FilterPanel; 