// Education types
export interface Education {
  degree: 'PhD' | 'Master\'s' | 'Pursuing PhD' | 'Bachelor\'s';
  fieldOfStudy: 'AI' | 'Computer Science' | 'Machine Learning' | 'Computer Vision' | 'NLP' | 'Related Fields';
  instituteTier: 'Top Institute (QS <300)' | 'Other Institute (QS >300)';
  institute: string;
}

// Patents types
export interface Patents {
  grantedFirstInventor: boolean;
  grantedCoInventor: boolean;
  filedPatent: boolean;
  significantContribution: boolean;
}

// Publications types
export interface Publications {
  topAIConferences: string[];
  otherAIConferences: string[];
  reputableJournals: string[];
  numberOfPublications: number;
  citations: number;
}

// Work Experience types
export interface WorkExperience {
  topAIOrganizations: string[];
  impactQuality: number; // 1-4 scale
  mentorshipRole: boolean;
  dlFrameworks: string[];
  programmingLanguages: string[];
}

// Main Researcher interface
export interface Researcher {
  id: number;
  name: string;
  email: string;
  education: Education;
  patents: Patents;
  publications: Publications;
  hIndex: number;
  experienceBracket: '0-3' | '3-6' | '6-10' | '10+';
  workExperience: WorkExperience;
  score: number;
  grade: string;
}

// Scoring types
export interface ScoreBreakdown {
  raw: number;
  weighted: number;
}

export interface ScoreResult {
  totalScore: number;
  breakdown: {
    education: ScoreBreakdown;
    patents: ScoreBreakdown;
    publications: ScoreBreakdown;
    workExperience: ScoreBreakdown;
  };
  grade: string;
}

// Filter types
export interface FilterState {
  // Education filters
  degree?: string;
  fieldOfStudy?: string;
  instituteTier?: string;
  // Patents filters
  grantedFirstInventor?: boolean;
  grantedCoInventor?: boolean;
  filedPatent?: boolean;
  significantContribution?: boolean;
  // Publications filters
  hasTopAIConferences?: boolean;
  hasOtherAIConferences?: boolean;
  hasReputableJournals?: boolean;
  hasOtherJournals?: boolean;
  minPublications?: number;
  minCitations?: number;
  // Experience filters
  experienceBracket?: string;
  minHIndex?: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ResearchersResponse {
  researchers: Researcher[];
  total: number;
  filters?: FilterState;
}

export interface ScoreResponse {
  researcher: {
    name: string;
    id: number;
  };
  scoring: ScoreResult;
  timestamp: string;
}

// Reference data types (cleaned up)
export interface ReferenceData {
  weights: {
    education: number;
    patents: number;
    publications: number;
    workExperience: number;
  };
  degrees: string[];
  fieldsOfStudy: string[];
  instituteTiers: string[];
} 