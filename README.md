# AI Researcher Evaluation Tool

A comprehensive system for evaluating AI researchers based on their education, publications, patents, work experience, and GitHub contributions.

## Features

- **Multi-source Analysis**: Evaluates CVs and LinkedIn profiles
- **Comprehensive Scoring**: Education, Publications, Patents, Work Experience, GitHub
- **Real-time Processing**: Live API integration with Google Scholar, Patents, GitHub
- **Smart Filtering**: Advanced filters for education, publications, patents, and more
- **Rate Limit Handling**: Robust error handling with user-friendly messages
- **Score Justification**: Detailed breakdown of how scores are calculated
- **Source Traceability**: Every data point shows which source it came from and reliability
- **Parallel Processing**: Lightning-fast multi-profile evaluation with concurrent parsing
- **Excel Export**: Comprehensive Excel export with 68+ detailed fields for analysis

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
2. Choose between "Score CV/Profile" or "Get Top Researchers"
3. For CV evaluation: Upload CV or enter LinkedIn profile
4. For researcher search: Configure filters and search LinkedIn profiles
5. View detailed evaluation results and export to Excel

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

**What You Get in Terminal:**
- 🔍 **Detailed Parsing**: See exactly what data is extracted from each source
- 📊 **API Responses**: Full responses from Google Scholar, GitHub, Patents APIs  
- ⚙️ **Processing Steps**: Step-by-step evaluation pipeline
- 🐛 **Debug Info**: Error messages, cache status, API call details
- 📈 **Scoring Breakdown**: Detailed score calculations and weightings
- 🔑 **API Status**: Real-time API key validation and usage stats
- 📋 **Source Justification**: See which sources contributed to each data point and reliability scores
- ⚡ **Performance Metrics**: Compare parallel vs sequential processing speeds

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

- **Education (0-10)**: Degree level, institution prestige, field relevance
- **Publications (0-10)**: Count, citations, H-index, venue quality  
- **Patents (0-10)**: Granted patents as first/co-inventor
- **Work Experience (0-10)**: Top AI orgs, impact quality, mentorship
- **GitHub (0-10)**: Repository volume, popularity, activity

##  Usage Examples

### Web Interface

1. **Score CV/Profile Mode**:
   - Upload CV files (PDF/DOC) for analysis
   - Enter LinkedIn username or profile ID
   - Adjust custom scoring weights
   - View detailed score breakdown

2. **Get Top Researchers Mode**:
   - Configure education, publications, patents, work experience filters
   - Search LinkedIn profiles with AI-powered analysis
   - Export comprehensive results to Excel (68+ fields)
   - Apply filters and download matching profiles

### Excel Export Features

The system generates comprehensive Excel exports with 68+ fields including:

- **Basic Info**: Name, LinkedIn details, title, passed filters
- **Education**: Degree, institute, field, scores
- **Publications**: Count, citations, H-index, venue quality, research areas
- **Patents**: First inventor, co-inventor, filed patents, scores
- **GitHub**: Profile details, repository analysis, AI relevance
- **Work Experience**: AI organizations, impact quality, frameworks, reasoning
- **Scoring**: Raw scores, weighted scores, individual weights used

##  Development

### Server Structure
```
server/
├── index.js                 # Main server entry point
├── routes/
│   ├── evaluation.js        # CV and LinkedIn evaluation endpoints
│   ├── researchers.js       # Researcher data management
│   ├── profileSearch.js     # LinkedIn profile search endpoints
│   └── cache.js             # Cache management endpoints
├── utils/
│   ├── aiProfileParser.js   # Education and profile parsing
│   ├── publicationsParser.js # Google Scholar integration
│   ├── patentParser.js      # Patent search and analysis
│   ├── githubParser.js      # GitHub profile analysis
│   ├── workExperienceParser.js # Experience parsing
│   ├── scoringEngine.js     # Score calculation
│   ├── profileSearch.js     # LinkedIn profile search logic
│   ├── linkedinCache.js     # LinkedIn profile caching
│   └── linkedinFormatter.js # LinkedIn data formatting
└── tests/                   # Development test scripts
```

### Client Structure
```
client/src/
├── components/              # React components
│   ├── ModeSelector.tsx     # Mode selection interface
│   ├── ProfileEvaluator.tsx # CV/LinkedIn evaluation interface
│   ├── FilterPanel.tsx     # Search filters with Excel export
│   ├── ProfileSearchResults.tsx # LinkedIn search results
│   └── ResearcherList.tsx  # Results display
├── services/
│   └── api.ts              # API service layer
└── types/
    └index.ts            # TypeScript definitions
```

##  API Endpoints

- `POST /api/evaluation/cv` - Evaluate uploaded CV file
- `POST /api/evaluation/linkedin` - Evaluate LinkedIn profile
- `POST /api/profile-search/search` - Search LinkedIn profiles with filters
- `GET /api/cache/stats` - Get LinkedIn cache statistics
- `DELETE /api/cache/clear` - Clear LinkedIn profile cache
- `POST /api/scoring/calculate` - Calculate scores with custom weights

##  Error Handling

The system handles various error scenarios:

- **Rate Limits**: Clear messages when API limits are exceeded with caching fallbacks
- **Network Issues**: Graceful degradation and retry suggestions  
- **Invalid Files**: Helpful error messages for unsupported formats
- **Missing Data**: Fallback values when information isn't available
- **API Failures**: Robust error handling with detailed logging

## 🔧 Caching System

The application includes intelligent caching for performance optimization:

- **LinkedIn Profile Caching**: Stores profiles for 30 days to reduce API calls
- **GitHub API Caching**: Caches GitHub profile data and repository analysis
- **Publications Caching**: Stores Google Scholar search results
- **Memory + File Caching**: Dual-layer caching for optimal performance
- **Cache Management**: Built-in cache cleanup and statistics tracking

---

