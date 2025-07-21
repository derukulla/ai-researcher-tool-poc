import axios from 'axios';
import { 
  Researcher, 
  ResearchersResponse, 
  ScoreResponse, 
  FilterState, 
  ReferenceData 
} from '../types';

// Configure axios defaults
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // Increased timeout for CV processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    throw error;
  }
);

export const researcherService = {
  // Get all researchers
  async getAll(): Promise<ResearchersResponse> {
    const response = await api.get<ResearchersResponse>('/researchers');
    return response.data;
  },

  // Get filtered researchers
  async getFiltered(filters: FilterState, weights?: any): Promise<ResearchersResponse> {
    const requestData: any = { ...filters };
    
    // Add weights if provided
    if (weights) {
      requestData.weights = weights;
    }
    
    const response = await api.get<ResearchersResponse>('/researchers', {
      params: requestData
    });
    return response.data;
  },

  // Get single researcher
  async getById(id: number): Promise<Researcher> {
    const response = await api.get<Researcher>(`/researchers/${id}`);
    return response.data;
  },

  // Create new researcher
  async create(researcher: Omit<Researcher, 'id'>): Promise<Researcher> {
    const response = await api.post<Researcher>('/researchers', researcher);
    return response.data;
  },

  // Update researcher
  async update(id: number, researcher: Partial<Researcher>): Promise<Researcher> {
    const response = await api.put<Researcher>(`/researchers/${id}`, researcher);
    return response.data;
  },

  // Delete researcher
  async delete(id: number): Promise<void> {
    await api.delete(`/researchers/${id}`);
  },

  // Export to CSV
  async exportCSV(): Promise<void> {
    const response = await api.get('/researchers/export/csv', {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'researchers.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Calculate score for a researcher
  async calculateScore(researcher: Researcher): Promise<ScoreResponse> {
    const response = await api.post<ScoreResponse>('/scoring/calculate', researcher);
    return response.data;
  }
};

export const scoringService = {
  // Get scoring weights and criteria
  async getCriteria(): Promise<ReferenceData> {
    const response = await api.get<ReferenceData>('/scoring/criteria');
    return response.data;
  },

  // Batch calculate scores
  async batchCalculate(researchers: Researcher[]): Promise<any> {
    const response = await api.post('/scoring/batch', { researchers });
    return response.data;
  },

  // Get scoring statistics
  async getStats(): Promise<any> {
    const response = await api.get('/scoring/stats');
    return response.data;
  }
};

// New evaluation service for CV and LinkedIn profiles
export const evaluationService = {
  // Upload and evaluate CV
  async evaluateCV(file: File, weights?: any): Promise<any> {
    const formData = new FormData();
    formData.append('cv', file);
    
    // Add weights if provided
    if (weights) {
      formData.append('weights', JSON.stringify(weights));
    }
    
    const response = await api.post('/evaluation/cv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000 // 2 minutes for CV processing
    });
    
    return response.data;
  },

  // Evaluate LinkedIn profile
  async evaluateLinkedIn(linkedinId: string, weights?: any): Promise<any> {
    const requestBody: any = { linkedinId };
    
    // Add weights if provided
    if (weights) {
      requestBody.weights = weights;
    }
    
    const response = await api.post('/evaluation/linkedin', requestBody, {
      timeout: 120000 // 2 minutes for LinkedIn processing
    });
    
    return response.data;
  }
};

export const healthService = {
  // Check API health
  async check(): Promise<{ status: string; message: string }> {
    const response = await api.get('/health');
    return response.data;
  }
};

// Export the configured axios instance for advanced usage
export { api };

// Default export combining all services
export default {
  researchers: researcherService,
  scoring: scoringService,
  evaluation: evaluationService,
  health: healthService
}; 