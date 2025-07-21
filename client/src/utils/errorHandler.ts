/**
 * Error Handler Utility
 * Provides clear, user-friendly error messages for API errors
 */

export interface ApiError {
  message: string;
  type: 'rate_limit' | 'network' | 'validation' | 'server' | 'not_found' | 'timeout' | 'generic';
  retryable: boolean;
  retryAfter?: number; // seconds
}

/**
 * Parse API error and return user-friendly message
 * @param error - Error object from API call
 * @returns Parsed error information
 */
export function parseApiError(error: any): ApiError {
  // Network/connection errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return {
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'network',
      retryable: true
    };
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      message: 'Request timed out. The server is taking longer than expected. Please try again.',
      type: 'timeout',
      retryable: true
    };
  }

  // Handle HTTP response errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    const errorMessage = data?.message || data?.error || '';

    switch (status) {
      case 429: // Rate Limit
        return parseRateLimitError(data, errorMessage);
      
      case 404: // Not Found
        return {
          message: 'Resource not found. Please check the profile ID or file and try again.',
          type: 'not_found',
          retryable: false
        };
      
      case 400: // Bad Request
        return {
          message: data?.message || 'Invalid request. Please check your input and try again.',
          type: 'validation',
          retryable: false
        };
      
      case 401: // Unauthorized
        return {
          message: 'Authentication failed. Please check your API credentials.',
          type: 'server',
          retryable: false
        };
      
      case 403: // Forbidden
        return {
          message: 'Access denied. You may have exceeded your API quota or lack necessary permissions.',
          type: 'rate_limit',
          retryable: true,
          retryAfter: 3600 // Suggest waiting 1 hour
        };
      
      case 500: // Internal Server Error
        return {
          message: 'Server error occurred. Our team has been notified. Please try again later.',
          type: 'server',
          retryable: true
        };
      
      case 502: // Bad Gateway
      case 503: // Service Unavailable
      case 504: // Gateway Timeout
        return {
          message: 'Service temporarily unavailable. Please try again in a few minutes.',
          type: 'server',
          retryable: true,
          retryAfter: 300 // Suggest waiting 5 minutes
        };
      
      default:
        return parseSpecificApiErrors(errorMessage, status);
    }
  }

  // Fallback for unknown errors
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    type: 'generic',
    retryable: true
  };
}

/**
 * Parse rate limit specific errors
 * @param data - Response data
 * @param errorMessage - Error message
 * @returns Rate limit error info
 */
function parseRateLimitError(data: any, errorMessage: string): ApiError {
  // Check for SerpAPI rate limit
  if (errorMessage.includes('rate limit') || errorMessage.includes('quota exceeded')) {
    let specificMessage = 'API rate limit exceeded. You have made too many requests. Please wait before trying again.';
    
    if (errorMessage.includes('Google Scholar')) {
      specificMessage = 'Google Scholar API rate limit exceeded. Please wait before analyzing more publications.';
    } else if (errorMessage.includes('Patent search')) {
      specificMessage = 'Patent search API rate limit exceeded. Please wait before searching more patents.';
    }
    
    return {
      message: specificMessage,
      type: 'rate_limit',
      retryable: true,
      retryAfter: data?.retryAfter || 3600 // Default 1 hour
    };
  }

  // Check for People Data Labs rate limit
  if (errorMessage.includes('PDL') || errorMessage.includes('People Data Labs')) {
    return {
      message: 'LinkedIn profile API rate limit reached. Please wait before processing more profiles.',
      type: 'rate_limit',
      retryable: true,
      retryAfter: 3600
    };
  }

  // Check for Google Scholar rate limit
  if (errorMessage.includes('Scholar') || errorMessage.includes('publications')) {
    return {
      message: 'Google Scholar API rate limit reached. Please wait before analyzing more publications.',
      type: 'rate_limit',
      retryable: true,
      retryAfter: 1800 // 30 minutes
    };
  }

  // Generic rate limit
  return {
    message: 'Too many requests. Please wait a moment before trying again.',
    type: 'rate_limit',
    retryable: true,
    retryAfter: 300 // 5 minutes
  };
}

/**
 * Parse specific API errors from error messages
 * @param errorMessage - Error message to parse
 * @param status - HTTP status code
 * @returns Parsed error info
 */
function parseSpecificApiErrors(errorMessage: string, status: number): ApiError {
  const lowerMessage = errorMessage.toLowerCase();

  // SerpAPI specific errors
  if (lowerMessage.includes('serpapi')) {
    if (lowerMessage.includes('invalid api key')) {
      return {
        message: 'Invalid SerpAPI key. Please check your API configuration.',
        type: 'validation',
        retryable: false
      };
    }
    if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
      return {
        message: 'SerpAPI quota exceeded. Please upgrade your plan or wait for quota reset.',
        type: 'rate_limit',
        retryable: true,
        retryAfter: 86400 // 24 hours
      };
    }
  }

  // LinkedIn/PDL specific errors
  if (lowerMessage.includes('linkedin') || lowerMessage.includes('profile not found')) {
    return {
      message: 'LinkedIn profile not found or private. Please check the profile ID and privacy settings.',
      type: 'not_found',
      retryable: false
    };
  }

  // Ollama specific errors
  if (lowerMessage.includes('ollama') || lowerMessage.includes('connection refused')) {
    return {
      message: 'AI analysis service unavailable. Please try again later or contact support.',
      type: 'server',
      retryable: true,
      retryAfter: 300
    };
  }

  // GitHub specific errors
  if (lowerMessage.includes('github')) {
    if (lowerMessage.includes('not found')) {
      return {
        message: 'GitHub profile not found. The username may be incorrect or the profile may be private.',
        type: 'not_found',
        retryable: false
      };
    }
    if (lowerMessage.includes('rate limit')) {
      return {
        message: 'GitHub API rate limit reached. Please wait before analyzing more GitHub profiles.',
        type: 'rate_limit',
        retryable: true,
        retryAfter: 3600
      };
    }
  }

  // Generic error based on status
  return {
    message: errorMessage || `Request failed with status ${status}. Please try again.`,
    type: status >= 500 ? 'server' : 'validation',
    retryable: status >= 500
  };
}

/**
 * Format retry time in human-readable format
 * @param seconds - Seconds to wait
 * @returns Human-readable time string
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else if (seconds < 86400) {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.round(seconds / 86400);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
}

/**
 * Get user-friendly error message with retry information
 * @param error - Error object from API call
 * @returns Complete error message string
 */
export function getErrorMessage(error: any): string {
  const parsedError = parseApiError(error);
  
  let message = parsedError.message;
  
  if (parsedError.retryable && parsedError.retryAfter) {
    const retryTime = formatRetryTime(parsedError.retryAfter);
    message += ` Please try again in ${retryTime}.`;
  } else if (parsedError.retryable) {
    message += ' Please try again in a few moments.';
  }
  
  return message;
}

/**
 * Get error severity for UI display
 * @param error - Parsed error object
 * @returns Severity level for UI components
 */
export function getErrorSeverity(error: ApiError): 'error' | 'warning' | 'info' {
  switch (error.type) {
    case 'rate_limit':
      return 'warning';
    case 'validation':
    case 'not_found':
      return 'error';
    case 'network':
    case 'timeout':
      return 'warning';
    default:
      return 'error';
  }
} 