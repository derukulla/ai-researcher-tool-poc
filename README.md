# AI Researcher Evaluation Tool

A comprehensive system for evaluating AI researchers based on their education, publications, patents, work experience, and GitHub contributions.

## Features

- **Multi-source Analysis**: Evaluates CVs and LinkedIn profiles
- **Comprehensive Scoring**: Education, Publications, Patents, Work Experience, GitHub
- **Real-time Processing**: Live API integration with Google Scholar, Patents, GitHub
- **Smart Filtering**: Advanced filters for education, publications, patents, and more
- **QS Ranking Integration**: Filter researchers by university tiers (QS <300 vs QS >300)
- **Rate Limit Handling**: Robust error handling with user-friendly messages
- **Score Justification**: Detailed breakdown of how scores are calculated
- **Source Traceability**: Every data point shows which source it came from and reliability
- **Parallel Processing**: Lightning-fast multi-profile evaluation with concurrent parsing

> **🚀 For Power Users**: Run tests directly in terminal for **detailed logs, complete API responses, step-by-step processing**, and comprehensive debugging information not available in the web interface.

##  Architecture

```
├── client/          # React TypeScript frontend
├── server/          # Node.js Express backend
│   ├── routes/      # API endpoints
│   ├── utils/       # Core parsing and scoring logic
│   ├── cache/       # API response caching
│   └── tests/       # Server-side test scripts
├── tests/           # Main evaluation test scripts
└── profiles/        # Sample CV files
```

##  Quick Setup

### Prerequisites
- **Node.js** (v16+ recommended)
- **npm** or **yarn**

### Step 1: Clone & Install
```bash
# Clone the repository
git clone https://github.com/derukulla/ai-researcher-tool-poc.git
cd ai-researcher-tool-poc

# Install all dependencies (server + client)
npm run install-all
```

### Step 2: Configure API Keys
```bash
nano server/config/apiKeys.js  
```

**Update the following keys in `server/config/apiKeys.js`:**
```javascript
// Required API Keys - Replace with your actual keys
SERPAPI: {
  key: 'your_serpapi_key_here',           // For Google Scholar + Patents
},
PDL: {
  key: 'your_people_data_labs_key_here',  // For LinkedIn data  
},
GITHUB: {
  key: 'your_github_token_here',          // For GitHub analysis
},

// Optional
GEMINI: {
  key: 'your_gemini_key_here',            // For enhanced AI processing
}
```

### Step 3: Start the Application
```bash
# Option A: Start both server and client
npm run dev

# Option B: Start individually
npm run server    # Backend (http://localhost:5000)
npm run client    # Frontend (http://localhost:3000)
```

##  Usage

### Web Interface (Recommended)
1. Open http://localhost:3000
2. Upload CV or enter LinkedIn profile
3. View detailed evaluation results

### Terminal Testing (For Detailed Logs)
```bash
# Test CV evaluation
node tests/testCVEvaluation.js profiles/3.pdf

# Test LinkedIn evaluation  
node tests/testLinkedInEvaluation.js parthapratimtalukdar

# Or use npm scripts
npm run test-cv profiles/3.pdf
npm run test-linkedin parthapratimtalukdar
```
**Getting API Keys:**
- **SerpAPI**: Sign up at [serpapi.com](https://serpapi.com) (Google Scholar + Patents)
- **People Data Labs**: Get key at [peopledatalabs.com](https://www.peopledatalabs.com)
- **GitHub**: Create token at [github.com/settings/tokens](https://github.com/settings/tokens)
- **Gemini**: Get key at [ai.google.dev](https://ai.google.dev)

### Configuration

## Running the Application

> **📍 Quick Start for Detailed Analysis**: Want to see **everything**? Skip the web interface and run terminal tests directly:
> ```bash
> node tests/testCVEvaluation.js profiles/3.pdf
> node tests/testLinkedInEvaluation.js linkedinid
> ```
> This shows complete logs, API responses, parsing details, scoring breakdowns, and **source justification** for every data point!

### Method 1: Full Application (Recommended)

**Start the backend:**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Start the frontend:**
```bash
cd client
npm start
# Frontend runs on http://localhost:3000
```

**Access the application:**
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Tip**: When you start the server, you'll see a configuration status showing which API keys are configured:
> ```
> 🔑 API Keys Configuration Status:
> ✅ SERPAPI: Configured (Required)
> ✅ PDL: Configured (Required)  
> ✅ GITHUB: Configured (Required)
> ⚠️ GEMINI: Not configured (Optional)
> ✅ All required API keys are configured!
> ```

### Method 2: Terminal Testing

> **💡 Pro Tip**: Use terminal testing for **detailed logs, debugging, and comprehensive analysis**. Terminal output shows complete API responses, parsing details, scoring breakdowns, source justification, and step-by-step processing that's not visible in the web interface.

**Test LinkedIn Profile:**
```bash
node tests/testLinkedInEvaluation.js <linkedin_username>
```

**Test CV Upload:**
```bash
node tests/testCVEvaluation.js <path_to_cv_file>

# Examples (run from project root):
node tests/testCVEvaluation.js ../profiles/1.pdf
node tests/testCVEvaluation.js ../profiles/3.pdf
node tests/testCVEvaluation.js /absolute/path/to/resume.pdf
```

**Test Parallel Processing:**
```bash
# Compare parallel vs sequential performance
node tests/testParallelProfileSearch.js

# Or using npm script
npm run test-parallel
```

**Test QS Ranking Filters:**
```bash
# Test institute tier filtering (QS <300 vs QS >300)
node tests/testQSRankingFilter.js

# Or using npm script
npm run test-qs-filter
```

**What You Get in Terminal:**
- 🔍 **Detailed Parsing**: See exactly what data is extracted from each source
- 📊 **API Responses**: Full responses from Google Scholar, GitHub, Patents APIs  
- ⚙️ **Processing Steps**: Step-by-step evaluation pipeline
- 🐛 **Debug Info**: Error messages, cache status, API call details
- 📈 **Scoring Breakdown**: Detailed score calculations and weightings
- 🔑 **API Status**: Real-time API key validation and usage stats
- 📋 **Source Justification**: See which sources contributed to each data point and reliability scores
- ⚡ **Performance Metrics**: Compare parallel vs sequential processing speeds
- 🏫 **QS Ranking Analysis**: Institute tier filtering and university ranking insights

## ⚡ Parallel Processing Architecture

The system now supports **parallel processing** for dramatically faster multi-profile evaluation:

### **Sequential vs Parallel Processing:**

**🐌 Sequential (Original):**
```
Profile 1: Education → Publications → Patents → GitHub → Work Experience
Profile 2: Education → Publications → Patents → GitHub → Work Experience  
Profile 3: Education → Publications → Patents → GitHub → Work Experience
```

**⚡ Parallel (New):**
```
Stage 1: Education parsing for ALL profiles simultaneously
Stage 2: Filter → Publications parsing for remaining profiles in parallel
Stage 3: Filter → Patents parsing for remaining profiles in parallel  
Stage 4: Filter → GitHub parsing for remaining profiles in parallel
Stage 5: Filter → Work experience parsing for remaining profiles in parallel
```

### **Performance Benefits:**
- **3-5x faster** processing for multiple profiles
- **Intelligent batching** to respect API rate limits
- **Early filtering** reduces unnecessary API calls
- **Concurrent processing** maximizes throughput

### **Usage:**
```javascript
// Use parallel processing for multiple profiles
const { profileSearchParallel } = require('./utils/profileSearch');
const results = await profileSearchParallel(filters, options);

// Compare with sequential for single profiles
const { profileSearch } = require('./utils/profileSearch');
const results = await profileSearch(filters, options);
```

## 🏫 QS Ranking Institute Filtering

The system includes **QS World University Rankings** integration for institute-based filtering:

### **Institute Tiers:**
- **🏆 Top Institute (QS <300)**: Universities ranked in top 300 globally
- **🏛️ Other Institute (QS >300)**: Universities ranked 300+ or unranked

### **Filter Examples:**
```javascript
// Filter for top-tier university PhD researchers in AI
const filters = {
  education: {
    enabled: true,
    degree: "PhD",
    fieldOfStudy: "AI", 
    instituteTier: "Top Institute (QS <300)"
  }
};

// Filter for any university researchers in Computer Science
const filters = {
  education: {
    enabled: true,
    degree: "PhD",
    fieldOfStudy: "Computer Science"
    // No instituteTier = accept any university
  }
};

// Filter specifically for lower-tier universities  
const filters = {
  education: {
    enabled: true,
    instituteTier: "Other Institute (QS >300)"
  }
};
```

### **Field Matching Logic:**
- **"AI"** matches: Artificial Intelligence, Machine Learning, Deep Learning
- **"Computer Science"** matches: Computer Science, CS, Software Engineering
- **"Related Fields"** matches: Data Science, Robotics, Mathematics, Statistics

##  How It Works

### Evaluation Process

1. **Profile Parsing**
   - Extract name, education, experience from CV/LinkedIn
   - Parse degrees, institutions, field of study

2. **Publications Analysis** 
   - Search Google Scholar for researcher's publications
   - Calculate H-index, citation count, publication venues
   - Categorize venues (top AI conferences, journals, etc.)

3. **Patents Research**
   - Search patent databases for inventor patents
   - Identify first inventor vs co-inventor patents
   - Analyze AI-related patent contributions

4. **GitHub Analysis**
   - Find researcher's GitHub profile
   - Analyze repository volume, popularity, commit frequency
   - Assess code quality and project relevance

5. **Work Experience Evaluation**
   - Identify work at top AI organizations
   - Assess impact quality and mentorship roles
   - Evaluate deep learning framework experience

6. **Final Scoring**
   - Weighted combination of all factors
   - Default weights: Education (25%), Publications (30%), Patents (13%), Work Experience (30%), GitHub (2%)
   - Score breakdown and justification provided

### Scoring Criteria

- **Education (0-10)**: Degree level, institution tier, field relevance
- **Publications (0-10)**: Count, citations, H-index, venue quality  
- **Patents (0-10)**: Granted patents as first/co-inventor
- **Work Experience (0-10)**: Top AI orgs, impact quality, mentorship
- **GitHub (0-10)**: Repository volume, popularity, activity

##  Usage Examples

### Web Interface

1. **CV Upload**: Drop PDF/DOC files for analysis
2. **LinkedIn Profile**: Enter LinkedIn username or profile ID
3. **Custom Weights**: Adjust scoring weights per your criteria
4. **Score Breakdown**: View detailed justification for scores


##  Development

### Server Structure
```
server/
├── index.js                 # Main server entry point
├── routes/
│   ├── evaluation.js        # CV and LinkedIn evaluation endpoints
│   ├── researchers.js       # Researcher data management
│   └── scoring.js           # Scoring endpoints
├── utils/
│   ├── aiProfileParser.js   # Education and profile parsing
│   ├── publicationsParser.js # Google Scholar integration
│   ├── patentParser.js      # Patent search and analysis
│   ├── githubParser.js      # GitHub profile analysis
│   ├── workExperienceParser.js # Experience parsing
│   └── scoringEngine.js     # Score calculation
└── tests/                   # Development test scripts
```

### Client Structure
```
client/src/
├── components/              # React components
│   ├── ProfileEvaluator.tsx # Main evaluation interface
│   ├── FilterPanel.tsx     # Search filters
│   └── ResearcherList.tsx  # Results display
├── services/
│   └── api.ts              # API service layer
└── types/
    └── index.ts            # TypeScript definitions
```

##  API Endpoints

- `POST /api/evaluation/cv` - Evaluate uploaded CV file
- `POST /api/evaluation/linkedin` - Evaluate LinkedIn profile
- `GET /api/researchers` - Get all researchers with filters
- `POST /api/scoring/calculate` - Calculate scores with custom weights

##  Error Handling

The system handles various error scenarios:

- **Rate Limits**: Clear messages when API limits are exceeded
- **Network Issues**: Graceful degradation and retry suggestions  
- **Invalid Files**: Helpful error messages for unsupported formats
- **Missing Data**: Fallback values when information isn't available


---

