/**
 * LinkedIn Profile Formatter
 * Extracts only relevant fields from LinkedIn API response for researcher evaluation
 */

/**
 * Format LinkedIn profile data to extract only relevant fields for evaluation
 * @param {object} rawLinkedInData - Full LinkedIn API response
 * @returns {object} Formatted profile with only relevant fields
 */
function formatLinkedInProfile(rawLinkedInData) {
  // Handle both direct data and nested data structure
  const data = rawLinkedInData.data || rawLinkedInData;
  
  if (!data) {
    throw new Error('No LinkedIn data provided');
  }

  return {
    // Basic identification
    id: data.id,
    full_name: data.full_name,
    first_name: data.first_name,
    last_name: data.last_name,
    facebook_url: data.facebook_url,
    twitter_url: data.twitter_url,
    
    // LinkedIn profile info
    linkedin_url: data.linkedin_url,
    linkedin_username: data.linkedin_username,
    linkedin_id: data.linkedin_id,
    
    // GitHub info (if available)
    github_url: data.github_url,
    github_username: data.github_username,
    
    // Current job info
    job_title: data.job_title,
    job_company_name: data.job_company_name,
    job_company_industry: data.job_company_industry,
    job_start_date: data.job_start_date,
    
    // Skills
    interests: data.interests || [],
    skills: data.skills || [],
    
    // Experience - simplified structure
    experience: (data.experience || []).map(exp => ({
      company_name: exp.company?.name,
      company_industry: exp.company?.industry,
      company_size: exp.company?.size,
      title: exp.title?.name,
      start_date: exp.start_date,
      end_date: exp.end_date,
      is_primary: exp.is_primary,
      location_names: exp.location_names || []
    })),
    
    // Education - simplified structure
    education: (data.education || []).map(edu => ({
      school_name: edu.school?.name,
      school_type: edu.school?.type,
      degrees: edu.degrees || [],
      majors: edu.majors || [],
      minors: edu.minors || [],
      start_date: edu.start_date,
      end_date: edu.end_date,
      gpa: edu.gpa
    })),
    
    // Location
    location_country: data.location_country,
    location_region: data.location_region,
    
    // Additional useful fields
    industry: data.industry,
    
    // Metadata
    dataset_version: data.dataset_version,
    job_last_verified: data.job_last_verified
  };
}


module.exports = {
  formatLinkedInProfile,
}; 