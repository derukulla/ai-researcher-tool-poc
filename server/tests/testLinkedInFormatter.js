/**
 * Test LinkedIn Formatter
 * Demonstrates how the formatter reduces the massive LinkedIn response to just relevant fields
 */

const { formatLinkedInProfile, createProfileSummary, getProfileStats } = require('./utils/linkedinFormatter');

// Sample LinkedIn data (based on the user's example - Partha Talukdar)
const sampleLinkedInData = {
  "status": 200,
  "likelihood": 9,
  "data": {
    "id": "KhgzL4LSEwEIlzyxFPaMrw_0000",
    "full_name": "partha talukdar",
    "first_name": "partha",
    "middle_initial": "p",
    "middle_name": "pratim",
    "last_initial": "t",
    "last_name": "talukdar",
    "sex": "male",
    "birth_year": false,
    "birth_date": false,
    "linkedin_url": "linkedin.com/in/parthapratimtalukdar",
    "linkedin_username": "parthapratimtalukdar",
    "linkedin_id": "40340269",
    "facebook_url": null,
    "facebook_username": null,
    "facebook_id": null,
    "twitter_url": null,
    "twitter_username": null,
    "github_url": "github.com/parthatalukdar",
    "github_username": "parthatalukdar",
    "work_email": false,
    "personal_emails": true,
    "recommended_personal_email": true,
    "mobile_phone": true,
    "industry": "research",
    "job_title": "research scientist and manager",
    "job_title_role": "research",
    "job_title_sub_role": null,
    "job_title_class": "research_and_development",
    "job_title_levels": ["manager"],
    "job_company_id": "StyaWCIGgDNCuBaCNAhGWwCKPEQb",
    "job_company_name": "google deepmind",
    "job_company_website": "deepmind.com",
    "job_company_size": "501-1000",
    "job_company_founded": 2010,
    "job_company_industry": "research",
    "job_company_linkedin_url": "linkedin.com/company/deepmind",
    "job_company_linkedin_id": "1594050",
    "job_company_facebook_url": null,
    "job_company_twitter_url": "twitter.com/deepmindai",
    "job_company_location_name": "united kingdom",
    "job_start_date": "2024-05",
    "location_name": true,
    "location_country": "india",
    "location_continent": "asia",
    "skills": [
      "algorithms",
      "artificial intelligence",
      "c++",
      "computational linguistics",
      "computer science",
      "data mining",
      "distributed systems",
      "information extraction",
      "java",
      "latex",
      "machine learning",
      "natural language processing",
      "pattern recognition",
      "programming",
      "python",
      "semantics",
      "text mining"
    ],
    "experience": [
      {
        "company": {
          "name": "google deepmind",
          "size": "501-1000",
          "id": "StyaWCIGgDNCuBaCNAhGWwCKPEQb",
          "founded": 2010,
          "industry": "research"
        },
        "end_date": null,
        "start_date": "2024-05",
        "title": {
          "name": "research scientist and manager",
          "class": "research_and_development",
          "role": "research",
          "sub_role": null,
          "levels": ["manager"]
        },
        "is_primary": true
      },
      {
        "company": {
          "name": "google",
          "size": "10001+",
          "industry": "internet"
        },
        "end_date": "2024-05",
        "start_date": "2020-04",
        "title": {
          "name": "research scientist and manager",
          "class": "research_and_development",
          "role": "research",
          "levels": ["manager"]
        },
        "is_primary": false
      },
      {
        "company": {
          "name": "indian institute of science",
          "size": "1001-5000",
          "industry": "research"
        },
        "end_date": null,
        "start_date": "2019-12",
        "title": {
          "name": "associate professor",
          "class": "services",
          "role": "education",
          "sub_role": "professor"
        },
        "is_primary": false
      }
    ],
    "education": [
      {
        "school": {
          "name": "university of pennsylvania",
          "type": "post-secondary institution"
        },
        "degrees": ["doctorates", "doctor of philosophy"],
        "start_date": "2004",
        "end_date": "2010",
        "majors": ["information science"],
        "minors": [],
        "gpa": null
      },
      {
        "school": {
          "name": "birla institute of technology and science, pilani",
          "type": "post-secondary institution"
        },
        "degrees": ["bachelors", "bachelor of engineering"],
        "start_date": "1999",
        "end_date": "2003",
        "majors": ["computer science"],
        "minors": [],
        "gpa": null
      }
    ]
  }
};

async function testLinkedInFormatter() {
  console.log('🧪 Testing LinkedIn Formatter');
  console.log('=' .repeat(50));
  
  // Show original data size
  const originalSize = JSON.stringify(sampleLinkedInData).length;
  console.log(`📊 Original LinkedIn data size: ${originalSize} characters`);
  
  try {
    // Format the profile
    console.log('\n🔧 Formatting profile...');
    const formattedProfile = formatLinkedInProfile(sampleLinkedInData);
    
    const formattedSize = JSON.stringify(formattedProfile).length;
    console.log(`📊 Formatted profile size: ${formattedSize} characters`);
    console.log(`📉 Size reduction: ${((originalSize - formattedSize) / originalSize * 100).toFixed(1)}%`);
    
    // Show formatted profile
    console.log('\n📋 Formatted Profile:');
    console.log(JSON.stringify(formattedProfile, null, 2));
    
    // Create profile summary
    console.log('\n📝 Profile Summary for AI Processing:');
    const summary = createProfileSummary(formattedProfile);
    console.log(summary);
    
    // Get profile stats
    console.log('\n📊 Profile Statistics:');
    const stats = getProfileStats(formattedProfile);
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ LinkedIn Formatter Test Completed Successfully!');
    
  } catch (error) {
    console.error('❌ Error testing LinkedIn formatter:', error);
  }
}

// Run the test
if (require.main === module) {
  testLinkedInFormatter();
}

module.exports = {
  testLinkedInFormatter
}; 