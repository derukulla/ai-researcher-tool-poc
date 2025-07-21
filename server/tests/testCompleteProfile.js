/**
 * Complete Profile Test - All Parsers Integration
 * Tests the entire AI researcher evaluation pipeline
 */

const { parseEducation } = require('./utils/aiProfileParser');
const { parsePublications, getCacheStats, clearExpiredCache } = require('./utils/publicationsParser');
const { parsePatents } = require('./utils/patentParser');
const { parseWorkExperience } = require('./utils/workExperienceParser');
const { parseGitHub } = require('./utils/githubParser');
const { calculateTotalScore } = require('./utils/scoringEngine');

// =============================================================================
// TEST PROFILES
// =============================================================================

const testProfiles = [
  {
    name: "Dr. Andrej Karpathy",
    description: "AI researcher and educator",
    rawProfile: `
Dr. Andrej Karpathy - AI Researcher and Educator
- PhD in Computer Science, Stanford University (2016)
- MS in Computer Science, University of British Columbia (2011)
- BS in Computer Science and Physics, University of Toronto (2009)
- Director of AI, Tesla (2017-2022)
- Research Scientist, OpenAI (2015-2017)
- PhD Student, Stanford University (2011-2016)
- Computer Vision
- Deep Learning
- Neural Networks
- Generative Models
- Created CS231n: Convolutional Neural Networks for Visual Recognition course
- Developed ImageNet classification models
- Published extensively on deep learning and computer vision
- Popular AI educator with millions of YouTube views

LOCATION: San Francisco, CA
EMAIL: karpathy@cs.stanford.edu
    `,
    expectedGitHub: "karpathy"
  },
  {rawProfile: `
    "status":200,
    "likelihood":9,
    "data":{
       "id":"-F7bKnvQJwGpcC7j0l211g_0000",
       "full_name":"sundar pichai",
       "first_name":"sundar",
       "middle_initial":null,
       "middle_name":null,
       "last_initial":"p",
       "last_name":"pichai",
       "sex":null,
       "birth_year":false,
       "birth_date":false,
       "linkedin_url":"linkedin.com/in/sundarpichai",
       "linkedin_username":"sundarpichai",
       "linkedin_id":"5635",
       "facebook_url":"facebook.com/sundarpichai",
       "facebook_username":"sundarpichai",
       "facebook_id":null,
       "twitter_url":"twitter.com/sundarpichai",
       "twitter_username":"sundarpichai",
       "github_url":null,
       "github_username":null,
       "work_email":true,
       "personal_emails":false,
       "recommended_personal_email":false,
       "mobile_phone":false,
       "industry":"internet",
       "job_title":"chief executive officer",
       "job_title_role":"operations",
       "job_title_sub_role":"executive",
       "job_title_class":"general_and_administrative",
       "job_title_levels":[
          "cxo"
       ],
       "job_company_id":"aKCIYBNF9ey6o5CjHCCO4goHYKlf",
       "job_company_name":"google",
       "job_company_website":"google.com",
       "job_company_size":"10001+",
       "job_company_founded":1998,
       "job_company_industry":"internet",
       "job_company_linkedin_url":"linkedin.com/company/google",
       "job_company_linkedin_id":"1441",
       "job_company_facebook_url":"facebook.com/google",
       "job_company_twitter_url":"twitter.com/google",
       "job_company_location_name":"mountain view, california, united states",
       "job_company_location_locality":"mountain view",
       "job_company_location_metro":"san jose, california",
       "job_company_location_region":"california",
       "job_company_location_geo":"37.4,-122.08",
       "job_company_location_street_address":"1600 amphitheatre parkway",
       "job_company_location_address_line_2":null,
       "job_company_location_postal_code":"94043",
       "job_company_location_country":"united states",
       "job_company_location_continent":"north america",
       "job_last_changed":"2024-05-01",
       "job_last_verified":"2025-04-01",
       "job_start_date":"2015",
       "location_name":true,
       "location_locality":true,
       "location_metro":true,
       "location_region":true,
       "location_country":"united states",
       "location_continent":"north america",
       "location_street_address":false,
       "location_address_line_2":null,
       "location_postal_code":false,
       "location_geo":true,
       "location_last_updated":"2025-04-01",
       "phone_numbers":true,
       "emails":true,
       "interests":[
          
       ],
       "skills":[
          
       ],
       "location_names":true,
       "regions":true,
       "countries":[
          "united states"
       ],
       "street_addresses":false,
       "experience":[
          {
             "company":{
                "name":"google",
                "size":"10001+",
                "id":"aKCIYBNF9ey6o5CjHCCO4goHYKlf",
                "founded":1998,
                "industry":"internet",
                "location":{
                   "name":"mountain view, california, united states",
                   "locality":"mountain view",
                   "region":"california",
                   "metro":"san jose, california",
                   "country":"united states",
                   "continent":"north america",
                   "street_address":"1600 amphitheatre parkway",
                   "address_line_2":null,
                   "postal_code":"94043",
                   "geo":"37.4,-122.08"
                },
                "linkedin_url":"linkedin.com/company/google",
                "linkedin_id":"1441",
                "facebook_url":"facebook.com/google",
                "twitter_url":"twitter.com/google",
                "website":"google.com"
             },
             "location_names":[
                
             ],
             "end_date":null,
             "start_date":"2015",
             "title":{
                "name":"chief executive officer",
                "class":"general_and_administrative",
                "role":"operations",
                "sub_role":"executive",
                "levels":[
                   "cxo"
                ]
             },
             "is_primary":true
          },
          {
             "company":{
                "name":"google",
                "size":"10001+",
                "id":"aKCIYBNF9ey6o5CjHCCO4goHYKlf",
                "founded":1998,
                "industry":"internet",
                "location":{
                   "name":"mountain view, california, united states",
                   "locality":"mountain view",
                   "region":"california",
                   "metro":"san jose, california",
                   "country":"united states",
                   "continent":"north america",
                   "street_address":"1600 amphitheatre parkway",
                   "address_line_2":null,
                   "postal_code":"94043",
                   "geo":"37.4,-122.08"
                },
                "linkedin_url":"linkedin.com/company/google",
                "linkedin_id":"1441",
                "facebook_url":"facebook.com/google",
                "twitter_url":"twitter.com/google",
                "website":"google.com"
             },
             "location_names":[
                
             ],
             "end_date":"2015",
             "start_date":"2004-04",
             "title":{
                "name":"product management + leadership",
                "class":"research_and_development",
                "role":"product",
                "sub_role":"product_management",
                "levels":[
                   
                ]
             },
             "is_primary":false
          },
          {
             "company":{
                "name":"google",
                "size":"10001+",
                "id":"aKCIYBNF9ey6o5CjHCCO4goHYKlf",
                "founded":1998,
                "industry":"internet",
                "location":{
                   "name":"mountain view, california, united states",
                   "locality":"mountain view",
                   "region":"california",
                   "metro":"san jose, california",
                   "country":"united states",
                   "continent":"north america",
                   "street_address":"1600 amphitheatre parkway",
                   "address_line_2":null,
                   "postal_code":"94043",
                   "geo":"37.4,-122.08"
                },
                "linkedin_url":"linkedin.com/company/google",
                "linkedin_id":"1441",
                "facebook_url":"facebook.com/google",
                "twitter_url":"twitter.com/google",
                "website":"google.com"
             },
             "location_names":[
                
             ],
             "end_date":null,
             "start_date":null,
             "title":{
                "name":"vice president, product management",
                "class":"research_and_development",
                "role":"product",
                "sub_role":"product_management",
                "levels":[
                   "vp"
                ]
             },
             "is_primary":false
          }
       ],
       "education":[
          {
             "school":{
                "name":"indian institute of technology",
                "type":"post-secondary institution",
                "id":"8Ygu3ensZEOf9feOzWEgFQ_0",
                "location":{
                   "name":"hauz khas, delhi, india",
                   "locality":"hauz khas",
                   "region":"delhi",
                   "country":"india",
                   "continent":"asia"
                },
                "linkedin_url":"linkedin.com/school/indian-institute-of-technology",
                "facebook_url":null,
                "twitter_url":null,
                "linkedin_id":"15108155",
                "website":"iitd.ac.in",
                "domain":"iitd.ac.in"
             },
             "degrees":[
                
             ],
             "start_date":null,
             "end_date":null,
             "majors":[
                
             ],
             "minors":[
                
             ],
             "gpa":null
          },
          {
             "school":{
                "name":"indian institute of technology kharagpur",
                "type":"post-secondary institution",
                "id":"wc8l92OzPgUCdTWwiTm92w_0",
                "location":{
                   "name":"kharagpur, west bengal, india",
                   "locality":"kharagpur",
                   "region":"west bengal",
                   "country":"india",
                   "continent":"asia"
                },
                "linkedin_url":"linkedin.com/school/kharagpur-tribal-b.ed-traning-college",
                "facebook_url":"facebook.com/iit.kgp",
                "twitter_url":"twitter.com/iitkgp",
                "linkedin_id":"15117565",
                "website":"iitkgp.ac.in",
                "domain":"iitkgp.ac.in"
             },
             "degrees":[
                "bachelor of technology",
                "bachelors"
             ],
             "start_date":null,
             "end_date":null,
             "majors":[
                
             ],
             "minors":[
                
             ],
             "gpa":null
          },
          {
             "school":{
                "name":"indian institute of technology, kharagpur",
                "type":"post-secondary institution",
                "id":"I3rBUk-3oOGSSRQ0kLTDOA_0",
                "location":{
                   "name":"kharagpur technology, west bengal, india",
                   "locality":"kharagpur technology",
                   "region":"west bengal",
                   "country":"india",
                   "continent":"asia"
                },
                "linkedin_url":"linkedin.com/school/indian-institute-of-technology-kharagpur",
                "facebook_url":"facebook.com/iit.kgp",
                "twitter_url":"twitter.com/iitkgp",
                "linkedin_id":"157265",
                "website":"iitkgp.ac.in",
                "domain":"iitkgp.ac.in"
             },
             "degrees":[
                
             ],
             "start_date":null,
             "end_date":null,
             "majors":[
                
             ],
             "minors":[
                
             ],
             "gpa":null
          },
          {
             "school":{
                "name":"stanford university",
                "type":"post-secondary institution",
                "id":"FBcylwRgLy9jCN9yGBRDCw_0",
                "location":{
                   "name":"stanford, california, united states",
                   "locality":"stanford",
                   "region":"california",
                   "country":"united states",
                   "continent":"north america"
                },
                "linkedin_url":"linkedin.com/school/stanford-university",
                "facebook_url":"facebook.com/stanford",
                "twitter_url":"twitter.com/stanford",
                "linkedin_id":"1792",
                "website":"stanford.edu",
                "domain":"stanford.edu"
             },
             "degrees":[
                "masters",
                "master of science"
             ],
             "start_date":null,
             "end_date":null,
             "majors":[
                "engineering",
                "materials science"
             ],
             "minors":[
                
             ],
             "gpa":null
          },
          {
             "school":{
                "name":"the wharton school",
                "type":"post-secondary institution",
                "id":"1V2n-tIwQ3CyNonkyD9OSw_0",
                "location":{
                   "name":"philadelphia, pennsylvania, united states",
                   "locality":"philadelphia",
                   "region":"pennsylvania",
                   "country":"united states",
                   "continent":"north america"
                },
                "linkedin_url":"linkedin.com/school/the-wharton-school",
                "facebook_url":"facebook.com/univpennsylvania",
                "twitter_url":"twitter.com/penn",
                "linkedin_id":"5290",
                "website":"wharton.upenn.edu",
                "domain":"upenn.edu"
             },
             "degrees":[
                "masters",
                "master of business administration"
             ],
             "start_date":null,
             "end_date":null,
             "majors":[
                
             ],
             "minors":[
                
             ],
             "gpa":null
          }
       ],
       "profiles":[
          {
             "network":"linkedin",
             "id":"5635",
             "url":"linkedin.com/in/sundarpichai",
             "username":"sundarpichai"
          },
          {
             "network":"facebook",
             "id":null,
             "url":"facebook.com/sundarpichai",
             "username":"sundarpichai"
          },
          {
             "network":"twitter",
             "id":null,
             "url":"twitter.com/sundarpichai",
             "username":"sundarpichai"
          },
          {
             "network":"stackoverflow",
             "id":"301491",
             "url":"stackoverflow.com/users/301491",
             "username":null
          },
          {
             "network":"gravatar",
             "id":null,
             "url":"gravatar.com/sundar636s",
             "username":"sundar636s"
          },
          {
             "network":"youtube",
             "id":null,
             "url":"youtube.com/user/spypyp",
             "username":"spypyp"
          },
          {
             "network":"klout",
             "id":null,
             "url":"klout.com/sundarpichai",
             "username":"sundarpichai"
          },
          {
             "network":"foursquare",
             "id":null,
             "url":"foursquare.com/user/3935038",
             "username":"3935038"
          },
          {
             "network":"flickr",
             "id":null,
             "url":"flickr.com/people/sundarpichai",
             "username":"sundarpichai"
          },
          {
             "network":"aboutme",
             "id":null,
             "url":"about.me/sundarpichai",
             "username":"sundarpichai"
          },
          {
             "network":"linkedin",
             "id":null,
             "url":"linkedin.com/in/sundar-pichai-2962321a1",
             "username":"sundar-pichai-2962321a1"
          },
          {
             "network":"linkedin",
             "id":null,
             "url":"linkedin.com/in/sundar-pichai-3173",
             "username":"sundar-pichai-3173"
          },
          {
             "network":"linkedin",
             "id":null,
             "url":"linkedin.com/in/sundar-pichai-5150a91a0",
             "username":"sundar-pichai-5150a91a0"
          }
       ],
       "dataset_version":"30.2"
    }
 `},
 {
  rawProfile: `

   "status":200,
   "likelihood":9,
   "data":{
      "id":"UltWHodoY0qHJa6QTLAUWQ_0000",
      "full_name":"nicolas aziere",
      "first_name":"nicolas",
      "middle_initial":null,
      "middle_name":null,
      "last_initial":"a",
      "last_name":"aziere",
      "sex":"male",
      "birth_year":false,
      "birth_date":false,
      "linkedin_url":"linkedin.com/in/nicolas-aziere",
      "linkedin_username":"nicolas-aziere",
      "linkedin_id":"555225625",
      "facebook_url":null,
      "facebook_username":null,
      "facebook_id":null,
      "twitter_url":null,
      "twitter_username":null,
      "github_url":null,
      "github_username":null,
      "work_email":false,
      "personal_emails":false,
      "recommended_personal_email":false,
      "mobile_phone":true,
      "industry":"computer software",
      "job_title":"ai scientist",
      "job_title_role":"engineering",
      "job_title_sub_role":"data_science",
      "job_title_class":"research_and_development",
      "job_title_levels":[
         
      ],
      "job_company_id":"8C6SbqUBiDhQd2DMv7vmiwDmvMfC",
      "job_company_name":"vivodyne",
      "job_company_website":"vivodyne.com",
      "job_company_size":"11-50",
      "job_company_founded":null,
      "job_company_industry":"biotechnology",
      "job_company_linkedin_url":"linkedin.com/company/vivodyne",
      "job_company_linkedin_id":"83296134",
      "job_company_facebook_url":null,
      "job_company_twitter_url":null,
      "job_company_location_name":"philadelphia, pennsylvania, united states",
      "job_company_location_locality":"philadelphia",
      "job_company_location_metro":"philadelphia, pennsylvania",
      "job_company_location_region":"pennsylvania",
      "job_company_location_geo":"40.00,-75.13",
      "job_company_location_street_address":"601 walnut street",
      "job_company_location_address_line_2":"suite 775",
      "job_company_location_postal_code":null,
      "job_company_location_country":"united states",
      "job_company_location_continent":"north america",
      "job_last_changed":"2024-05-01",
      "job_last_verified":"2025-02-01",
      "job_start_date":"2024-04",
      "location_name":true,
      "location_locality":true,
      "location_metro":true,
      "location_region":true,
      "location_country":"united states",
      "location_continent":"north america",
      "location_street_address":false,
      "location_address_line_2":null,
      "location_postal_code":false,
      "location_geo":true,
      "location_last_updated":"2025-02-01",
      "phone_numbers":true,
      "emails":false,
      "interests":[
         
      ],
      "skills":[
         "3d modeling",
         "action segmentation",
         "artificial intelligence",
         "c (programming language)",
         "c++",
         "computer graphics",
         "computer science",
         "computer vision",
         "deep learning",
         "deep reinforcement learning",
         "digital image processing",
         "html",
         "java",
         "latex",
         "lua",
         "machine learning",
         "matlab",
         "neural networks",
         "numerical simulation",
         "opencv",
         "pattern recognition",
         "php",
         "programming",
         "python",
         "pytorch",
         "reinforcement learning",
         "scikit learn",
         "video analysis",
         "vision science"
      ],
      "location_names":true,
      "regions":true,
      "countries":[
         "united states"
      ],
      "street_addresses":false,
      "experience":[
         {
            "company":{
               "name":"vivodyne",
               "size":"11-50",
               "id":"8C6SbqUBiDhQd2DMv7vmiwDmvMfC",
               "founded":null,
               "industry":"biotechnology",
               "location":{
                  "name":"philadelphia, pennsylvania, united states",
                  "locality":"philadelphia",
                  "region":"pennsylvania",
                  "metro":"philadelphia, pennsylvania",
                  "country":"united states",
                  "continent":"north america",
                  "street_address":"601 walnut street",
                  "address_line_2":"suite 775",
                  "postal_code":null,
                  "geo":"40.00,-75.13"
               },
               "linkedin_url":"linkedin.com/company/vivodyne",
               "linkedin_id":"83296134",
               "facebook_url":null,
               "twitter_url":null,
               "website":"vivodyne.com"
            },
            "location_names":[
               "corvallis, oregon, united states"
            ],
            "end_date":null,
            "start_date":"2024-04",
            "title":{
               "name":"ai scientist",
               "class":"research_and_development",
               "role":"engineering",
               "sub_role":"data_science",
               "levels":[
                  
               ]
            },
            "is_primary":true
         },
         {
            "company":{
               "name":"diffine",
               "size":"11-50",
               "id":"pxvK9wWnOK6tVUHNtluxfwPMe54e",
               "founded":2018,
               "industry":"computer software",
               "location":{
                  "name":"san diego, california, united states",
                  "locality":"san diego",
                  "region":"california",
                  "metro":"san diego, california",
                  "country":"united states",
                  "continent":"north america",
                  "street_address":"3681 villa terrace",
                  "address_line_2":null,
                  "postal_code":"92104",
                  "geo":"32.71,-117.16"
               },
               "linkedin_url":"linkedin.com/company/diffine",
               "linkedin_id":"77725903",
               "facebook_url":null,
               "twitter_url":null,
               "website":"diffine.com"
            },
            "location_names":[
               
            ],
            "end_date":"2023-09",
            "start_date":"2023-06",
            "title":{
               "name":"research consultant",
               "class":"research_and_development",
               "role":"research",
               "sub_role":null,
               "levels":[
                  
               ]
            },
            "is_primary":false
         },
         {
            "company":{
               "name":"outward, inc.",
               "size":"51-200",
               "id":"nZ4ZXyYoN3Gmuc5ixsirgwyovKbs",
               "founded":2012,
               "industry":"computer software",
               "location":{
                  "name":"san jose, california, united states",
                  "locality":"san jose",
                  "region":"california",
                  "metro":"san jose, california",
                  "country":"united states",
                  "continent":"north america",
                  "street_address":"1980 zanker road 20",
                  "address_line_2":null,
                  "postal_code":"95112",
                  "geo":"37.26,-121.91"
               },
               "linkedin_url":"linkedin.com/company/outward-inc-",
               "linkedin_id":"3301285",
               "facebook_url":"facebook.com/outwardinc",
               "twitter_url":"twitter.com/outwardinc",
               "website":"outwardinc.com"
            },
            "location_names":[
               "san jose, california, united states"
            ],
            "end_date":"2020-09",
            "start_date":"2020-06",
            "title":{
               "name":"computer vision phd intern",
               "class":"research_and_development",
               "role":"research",
               "sub_role":"academic",
               "levels":[
                  "training"
               ]
            },
            "is_primary":false
         },
         {
            "company":{
               "name":"oregon state university",
               "size":"1001-5000",
               "id":"RTEDsPZUe4RbahnBcs3gEgl4iviS",
               "founded":1868,
               "industry":"higher education",
               "location":{
                  "name":"corvallis, oregon, united states",
                  "locality":"corvallis",
                  "region":"oregon",
                  "metro":"corvallis, oregon",
                  "country":"united states",
                  "continent":"north america",
                  "street_address":"1500 southwest jefferson",
                  "address_line_2":null,
                  "postal_code":"97331",
                  "geo":"44.56,-123.26"
               },
               "linkedin_url":"linkedin.com/company/oregon-state-university",
               "linkedin_id":"165337",
               "facebook_url":"facebook.com/osubeavers",
               "twitter_url":null,
               "website":"oregonstate.edu"
            },
            "location_names":[
               "corvallis, oregon, united states"
            ],
            "end_date":"2024-04",
            "start_date":"2018-01",
            "title":{
               "name":"phd candidate",
               "class":"research_and_development",
               "role":"research",
               "sub_role":"academic",
               "levels":[
                  
               ]
            },
            "is_primary":false
         },
         {
            "company":{
               "name":"airbus group innovations",
               "size":"10001+",
               "id":"jXM5PT8aiEOJq9KBLubaKgcrjva9",
               "founded":null,
               "industry":"airlines/aviation",
               "location":null,
               "linkedin_url":"linkedin.com/company/airbus-group-innovations",
               "linkedin_id":"5045421",
               "facebook_url":null,
               "twitter_url":null,
               "website":null
            },
            "location_names":[
               "suresnes, \u00eele-de-france, france"
            ],
            "end_date":"2017-12",
            "start_date":"2017-06",
            "title":{
               "name":"internship",
               "class":null,
               "role":null,
               "sub_role":null,
               "levels":[
                  
               ]
            },
            "is_primary":false
         },
         {
            "company":{
               "name":"lantiq",
               "size":"1-10",
               "id":"BrEHZXunFC8y2sL7RB7u5Ah18x4q",
               "founded":2009,
               "industry":"semiconductors",
               "location":{
                  "name":"united states",
                  "locality":null,
                  "region":null,
                  "metro":null,
                  "country":"united states",
                  "continent":"north america",
                  "street_address":null,
                  "address_line_2":null,
                  "postal_code":null,
                  "geo":null
               },
               "linkedin_url":"linkedin.com/company/lantiq",
               "linkedin_id":"624196",
               "facebook_url":null,
               "twitter_url":"twitter.com/lantiq",
               "website":"lantiq.com"
            },
            "location_names":[
               "neubiberg, bavaria, germany"
            ],
            "end_date":"2016-08",
            "start_date":"2015-08",
            "title":{
               "name":"intern",
               "class":null,
               "role":null,
               "sub_role":null,
               "levels":[
                  "training"
               ]
            },
            "is_primary":false
         },
         {
            "company":{
               "name":"efi automotive",
               "size":"1-10",
               "id":"lZoRJQggcBW65uA1RNBOCgI2Zkla",
               "founded":null,
               "industry":"automotive",
               "location":{
                  "name":"hobart, tasmania, australia",
                  "locality":"hobart",
                  "region":"tasmania",
                  "metro":null,
                  "country":"australia",
                  "continent":"oceania",
                  "street_address":"5 goulburn street",
                  "address_line_2":null,
                  "postal_code":"7000",
                  "geo":"-42.87,147.32"
               },
               "linkedin_url":"linkedin.com/company/efi-automotive",
               "linkedin_id":"7661077",
               "facebook_url":null,
               "twitter_url":null,
               "website":"efiautomotive.com.au"
            },
            "location_names":[
               "wuhan, hubei, china"
            ],
            "end_date":"2014-07",
            "start_date":"2014-06",
            "title":{
               "name":"intern",
               "class":null,
               "role":null,
               "sub_role":null,
               "levels":[
                  "training"
               ]
            },
            "is_primary":false
         }
      ],
      "education":[
         {
            "school":{
               "name":"oregon state university",
               "type":"post-secondary institution",
               "id":"El9jq5Vi-9uHYzng5SVa5g_0",
               "location":{
                  "name":"corvallis, oregon, united states",
                  "locality":"corvallis",
                  "region":"oregon",
                  "country":"united states",
                  "continent":"north america"
               },
               "linkedin_url":"linkedin.com/school/oregon-state-university",
               "facebook_url":"facebook.com/osubeavers",
               "twitter_url":"twitter.com/oregonstate",
               "linkedin_id":"165337",
               "website":"oregonstate.edu",
               "domain":"oregonstate.edu"
            },
            "degrees":[
               "doctorates",
               "doctor of philosophy"
            ],
            "start_date":"2016",
            "end_date":"2017",
            "majors":[
               "computer science"
            ],
            "minors":[
               
            ],
            "gpa":null
         },
         {
            "school":{
               "name":"cpe lyon",
               "type":"post-secondary institution",
               "id":"tH5CfSfWByBQC-cMqpssLw_0",
               "location":null,
               "linkedin_url":"linkedin.com/school/ecole-superieure-de-chimie-physique-electronique-de-lyon",
               "facebook_url":"facebook.com/cpelyon",
               "twitter_url":"twitter.com/cpelyon",
               "linkedin_id":"15093517",
               "website":"cpe.fr",
               "domain":"cpe.fr"
            },
            "degrees":[
               "master of engineering",
               "masters"
            ],
            "start_date":"2013",
            "end_date":"2018",
            "majors":[
               "mathematics",
               "computer science"
            ],
            "minors":[
               
            ],
            "gpa":null
         }
      ],
      "profiles":[
         {
            "network":"linkedin",
            "id":"555225625",
            "url":"linkedin.com/in/nicolas-aziere",
            "username":"nicolas-aziere"
         }
      ],
      "dataset_version":"30.2"
   `
 }

];

// =============================================================================
// COMPLETE PIPELINE TEST
// =============================================================================

/**
 * Run complete evaluation pipeline for a researcher
 * @param {object} profile - Researcher profile data
 * @returns {Promise<object>} Complete evaluation results
 */
async function runCompleteEvaluation(profile) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 EVALUATING: ${profile.name}`);
  console.log(`📝 Description: ${profile.description}`);
  console.log(`${'='.repeat(80)}`);

  const results = {
    profile: profile,
    parsing: {},
    scoring: null,
    errors: []
  };

  try {
    // Step 1: Parse Education
    console.log('\n📚 Step 1: Parsing Education...');
    let researcherName = profile.name; // fallback to profile name
    try {
      const education = await parseEducation(profile.rawProfile);
      results.parsing.education = education;
      // Extract the researcher name from education result
      if (education.name) {
        researcherName = education.name;
      }
      console.log(`✅ Education parsed: ${education.degree} from ${education.institute}`);
      console.log(`   📝 Researcher name extracted: ${researcherName}`);
    } catch (error) {
      console.error('❌ Education parsing failed:', error.message);
      results.errors.push(`Education: ${error.message}`);
      results.parsing.education = { degree: null, institute: null, fieldOfStudy: null, name: null };
    }

    // Step 2: Parse Publications (SerpAPI Google Scholar)
    console.log('\n📄 Step 2: Parsing Publications with SerpAPI Google Scholar...');
    try {
      const publicationsInput = {
        name: researcherName,
        rawProfile: profile.rawProfile
      };
      const publications = await parsePublications(publicationsInput);
      results.parsing.publications = publications;
      console.log(`✅ Publications parsed: ${publications.numberOfPublications} papers, ${publications.citations} citations, H-index ${publications.hIndex}`);
      console.log(`   📊 Experience: ${publications.experienceBracket}, Method: ${publications.extractionMethod}`);
      console.log(`   🎯 Match confidence: ${publications.matchConfidence}`);
      if (publications.venueQuality) {
        console.log(`   🏷️ Venue quality: ${publications.venueQuality.summary}`);
      }
    } catch (error) {
      console.error('❌ Publications parsing failed:', error.message);
      results.errors.push(`Publications: ${error.message}`);
      results.parsing.publications = {
        numberOfPublications: 0,
        citations: 0,
        hIndex: 0,
        experienceBracket: '0-3',
        venueQuality: {
          hasTopAIConference: false,
          hasOtherAIConference: false,
          hasReputableJournal: false,
          hasOtherPeerReviewed: false,
          summary: 'No publications found'
        },
        extractionMethod: 'fallback',
        matchConfidence: 'low'
      };
    }

    // Step 3: Parse Patents
    console.log('\n🔬 Step 3: Parsing Patents...');
    try {
      const patentsInput = {
        name: researcherName,
        rawProfile: profile.rawProfile
      };
      const patents = await parsePatents(patentsInput);
      results.parsing.patents = patents;
      console.log(`✅ Patents parsed: Granted first inventor: ${patents.grantedFirstInventor}`);
    } catch (error) {
      console.error('❌ Patents parsing failed:', error.message);
      results.errors.push(`Patents: ${error.message}`);
      results.parsing.patents = {
        grantedFirstInventor: false,
        grantedCoInventor: false,
        filedPatent: false,
        significantContribution: false
      };
    }

    // Step 4: Parse Work Experience
    console.log('\n💼 Step 4: Parsing Work Experience...');
    try {
      const workExperienceInput = {
        name: researcherName,
        rawProfile: profile.rawProfile
      };
      const workExperience = await parseWorkExperience(workExperienceInput);
      results.parsing.workExperience = workExperience;
      console.log(`✅ Work experience parsed: ${workExperience.topAIOrganizations.length} top AI orgs`);
    } catch (error) {
      console.error('❌ Work experience parsing failed:', error.message);
      results.errors.push(`Work Experience: ${error.message}`);
      results.parsing.workExperience = {
        topAIOrganizations: [],
        qualityImpactRelevancy: 0,
        mentorshipRoles: [],
        deepLearningFrameworks: []
      };
    }

    // Step 5: Parse GitHub
    console.log('\n💻 Step 5: Parsing GitHub Profile...');
    try {
      const githubInput = {
        name: researcherName,
        rawProfile: profile.rawProfile
      };
      const github = await parseGitHub(githubInput);
      results.parsing.github = github;
      console.log(`✅ GitHub parsed: ${github.githubUsername || 'Not found'}`);
      if (github.analysis) {
        console.log(`   📊 Analysis: ${github.analysis.repoVolume} repos, ${github.analysis.popularity} stars, AI: ${github.analysis.aiRelevance ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      console.error('❌ GitHub parsing failed:', error.message);
      results.errors.push(`GitHub: ${error.message}`);
      results.parsing.github = {
        githubUsername: null,
        analysis: {
          repoVolume: 0,
          repoInitiative: 0,
          recentActivity: 0,
          popularity: 0,
          aiRelevance: false
        }
      };
    }

    // Step 6: Calculate Total Score
    console.log('\n🏆 Step 6: Calculating Total Score...');
    try {
      const researcher = {
        education: results.parsing.education,
        publications: results.parsing.publications,
        patents: results.parsing.patents,
        workExperience: results.parsing.workExperience,
        github: results.parsing.github
      };
      
      // Log researcher data for debugging
      console.log("📋 Researcher data prepared for scoring:");
      console.log(`   Education: ${researcher.education.degree} from ${researcher.education.institute}`);
      console.log(`   Publications: ${researcher.publications.numberOfPublications} papers, ${researcher.publications.citations} citations`);
      console.log(`   Patents: ${researcher.patents.hasPatents ? 'Yes' : 'No'}`);
      console.log(`   Work Experience: ${researcher.workExperience.topAIOrganizations?.length || 0} top AI orgs`);
      console.log(`   GitHub: ${researcher.github.githubUsername || 'Not found'}`);

      const scoring = await calculateTotalScore(researcher);
      results.scoring = scoring;

      console.log(`✅ Total Score: ${scoring.totalScore}/${scoring.maxPossibleScore} (${scoring.percentage}%)`);
      console.log(`   Grade: ${scoring.grade}`);
      
    } catch (error) {
      console.error('❌ Scoring calculation failed:', error.message);
      results.errors.push(`Scoring: ${error.message}`);
    }

    // Step 7: Display Complete Results
    console.log('\n📊 COMPLETE EVALUATION RESULTS');
    console.log('-'.repeat(50));
    
    if (results.scoring) {
      console.log('\n🏆 FINAL SCORES:');
      console.log(`   Education: ${results.scoring.breakdown.education.raw}/10 (weighted: ${results.scoring.breakdown.education.weighted})`);
      console.log(`   Patents: ${results.scoring.breakdown.patents.raw}/10 (weighted: ${results.scoring.breakdown.patents.weighted})`);
      console.log(`   Publications: ${results.scoring.breakdown.publications.raw}/10 (weighted: ${results.scoring.breakdown.publications.weighted})`);
      console.log(`   Work Experience: ${results.scoring.breakdown.workExperience.raw}/10 (weighted: ${results.scoring.breakdown.workExperience.weighted})`);
      console.log(`   GitHub: ${results.scoring.breakdown.github.raw}/16 (weighted: ${results.scoring.breakdown.github.weighted})`);
      console.log(`   TOTAL: ${results.scoring.totalScore}/${results.scoring.maxPossibleScore} (${results.scoring.percentage}%)`);
      console.log(`   GRADE: ${results.scoring.grade}`);
    }

    if (results.errors.length > 0) {
      console.log('\n⚠️ ERRORS ENCOUNTERED:');
      results.errors.forEach(error => console.log(`   - ${error}`));
    }

    return results;

  } catch (error) {
    console.error('❌ Critical error in evaluation pipeline:', error);
    results.errors.push(`Critical: ${error.message}`);
    return results;
  }
}

/**
 * Test multiple profiles through complete pipeline
 */
async function testMultipleProfiles() {
  console.log('🚀 Starting Complete Profile Evaluation Tests...');
  console.log(`Testing ${testProfiles.length} researcher profiles through all parsers\n`);

  const allResults = [];

  for (let i = 0; i < testProfiles.length; i++) {
    const profile = testProfiles[i];
    console.log(`\n📋 Processing Profile ${i + 1}/${testProfiles.length}`);
    
    const results = await runCompleteEvaluation(profile);
    allResults.push(results);
    
    // Add delay between profiles to avoid SerpAPI rate limits
    if (i < testProfiles.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next profile (SerpAPI rate limiting)...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(80));

  allResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.profile.name}`);
    if (result.scoring) {
      console.log(`   Score: ${result.scoring.totalScore}/${result.scoring.maxPossibleScore} (${result.scoring.percentage}%) - ${result.scoring.grade}`);
      console.log(`   Publications: ${result.parsing.publications.numberOfPublications} papers, ${result.parsing.publications.citations} citations, H-index ${result.parsing.publications.hIndex}`);
      console.log(`   Match confidence: ${result.parsing.publications.matchConfidence}`);
      console.log(`   GitHub: ${result.parsing.github.githubUsername || 'Not found'}`);
    } else {
      console.log(`   Score: Failed to calculate`);
    }
    console.log(`   Errors: ${result.errors.length}`);
  });

  console.log('\n🎉 Complete profile evaluation tests finished!');
  return allResults;
}

/**
 * Test cache performance with repeated profile
 */
async function testCachePerformance() {
  console.log('\n🚀 Testing Cache Performance...');
  console.log('Testing the same profile twice to demonstrate caching benefits\n');
  
  const testProfile = testProfiles[0]; // Use first profile
  
  console.log('🔄 First run (should cache results):');
  const start1 = Date.now();
  const result1 = await runCompleteEvaluation(testProfile);
  const time1 = Date.now() - start1;
  
  console.log(`\n⏱️ First run completed in ${time1}ms`);
  
  console.log('\n🔄 Second run (should use cache):');
  const start2 = Date.now();
  const result2 = await runCompleteEvaluation(testProfile);
  const time2 = Date.now() - start2;
  
  console.log(`\n⏱️ Second run completed in ${time2}ms`);
  console.log(`🚀 Performance improvement: ${time1 - time2}ms (${Math.round(((time1 - time2) / time1) * 100)}% faster)`);
  
  // Compare results
  const match = result1.parsing.publications.numberOfPublications === result2.parsing.publications.numberOfPublications &&
                result1.parsing.publications.citations === result2.parsing.publications.citations &&
                result1.parsing.publications.hIndex === result2.parsing.publications.hIndex;
  
  console.log(`📊 Results consistency: ${match ? '✅ Identical' : '❌ Different'}`);
  
  console.log('\n📊 Final Cache Statistics:');
  const finalStats = getCacheStats();
  if (finalStats) {
    console.log(`   Total files: ${finalStats.totalFiles}`);
    console.log(`   Valid files: ${finalStats.validFiles}`);
    console.log(`   Cache size: ${finalStats.totalSizeKB} KB`);
  }
}

/**
 * Quick test with minimal profile
 */
async function testMinimalProfile() {
  console.log('\n🧪 Testing Minimal Profile...');
  
  const minimalProfile = {
    name: "John Smith",
    description: "AI Researcher",
    rawProfile: `
John Smith - AI Researcher

Education: PhD Computer Science, MIT
Experience: Research Scientist at Google AI
Research: Machine Learning, Computer Vision
    `
  };

  const results = await runCompleteEvaluation(minimalProfile);
  return results;
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

/**
 * Run all complete profile tests
 */
async function runAllTests() {
  console.log('🚀 Starting Complete Profile Integration Tests with SerpAPI...\n');
  
  // Display cache statistics
  console.log('📊 Publications Cache Statistics:');
  const cacheStats = getCacheStats();
  if (cacheStats) {
    console.log(`   Total files: ${cacheStats.totalFiles}`);
    console.log(`   Valid files: ${cacheStats.validFiles}`);
    console.log(`   Expired files: ${cacheStats.expiredFiles}`);
    console.log(`   Cache size: ${cacheStats.totalSizeKB} KB`);
    console.log(`   Cache directory: ${cacheStats.cacheDir}`);
  }
  
  // Clear expired cache
  console.log('\n🧹 Clearing expired cache...');
  clearExpiredCache();
  
  try {
    // Test famous AI researchers
    await testMultipleProfiles();
    
    // Test cache performance
    await testCachePerformance();
    
    // Test minimal profile
    // await testMinimalProfile();
    
    console.log('\n🎉 All complete profile tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runCompleteEvaluation,
  testMultipleProfiles,
  testMinimalProfile,
  runAllTests
}; 