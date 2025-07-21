# Enhanced Error Handling Utility

This utility provides clear, user-friendly error messages for API errors including rate limits, network issues, and other common API problems.

## Features

- 🚨 **Rate Limit Detection**: Automatically detects and provides clear messages for API rate limits
- 🌐 **Network Error Handling**: Handles connection issues and timeouts
- 🔄 **Retry Functionality**: Suggests retry timing and provides retry buttons
- 📝 **User-Friendly Messages**: Converts technical errors into readable messages
- ⚠️ **Appropriate Severity**: Uses correct alert levels (error, warning, info)

## Usage Examples

### Basic Error Handling

```typescript
import { getErrorMessage } from '../utils/errorHandler';

try {
  const result = await api.someRequest();
} catch (error) {
  const userMessage = getErrorMessage(error);
  setError(userMessage); // Display to user
}
```

### Enhanced Error Display with Retry

```typescript
import { parseApiError, getErrorSeverity } from '../utils/errorHandler';

const handleError = (error: any) => {
  const parsed = parseApiError(error);
  const severity = getErrorSeverity(parsed);
  
  showNotification({
    message: parsed.message,
    severity: severity,
    retryable: parsed.retryable,
    retryAfter: parsed.retryAfter
  });
};
```

### Using Enhanced Components

The `EnhancedErrorDisplay` and enhanced `NotificationSnackbar` components automatically handle error parsing:

```typescript
// In ProfileEvaluator.tsx
{error && (
  <EnhancedErrorDisplay 
    error={error} 
    onRetry={handleRetry} 
  />
)}

// In App.tsx with notifications
<NotificationSnackbar
  open={showNotification}
  message={getErrorMessage(lastError)}
  error={lastError} // Pass original error for enhanced parsing
  onRetry={handleRetry}
  onClose={closeNotification}
/>
```

## Supported Error Types

### Rate Limiting (429)
- **SerpAPI**: Search quota exceeded
- **People Data Labs**: LinkedIn profile limits
- **Google Scholar**: Publications API limits
- **GitHub**: Repository analysis limits

**User Message**: Clear explanation with retry timing
**Severity**: Warning (allows retry)
**Retry Time**: 30 minutes to 24 hours depending on service

### Network Issues (503, 502, 504)
- Connection timeouts
- Service unavailable
- Gateway errors

**User Message**: "Service temporarily unavailable"
**Severity**: Warning
**Retry Time**: 5 minutes

### Validation Errors (400, 404)
- Invalid LinkedIn profile IDs
- Missing required fields
- Profile not found

**User Message**: Specific guidance on fixing input
**Severity**: Error
**Retry**: Not recommended

### Authentication (401, 403)
- Invalid API keys
- Insufficient permissions
- Quota exceeded

**User Message**: Check credentials or upgrade plan
**Severity**: Error
**Retry**: After fixing credentials

## Error Messages Examples

### Rate Limit Messages
- "API rate limit exceeded. You have made too many requests. Please try again in 1 hour."
- "LinkedIn profile API rate limit reached. Please wait before processing more profiles."
- "Google Scholar API rate limit reached. Please wait before analyzing more publications."

### Network Messages
- "Unable to connect to the server. Please check your internet connection and try again."
- "Request timed out. The server is taking longer than expected. Please try again."
- "Service temporarily unavailable. Please try again in a few minutes."

### Profile-Specific Messages
- "LinkedIn profile not found or private. Please check the profile ID and privacy settings."
- "GitHub profile not found. The username may be incorrect or the profile may be private."
- "Invalid request. Please check your input and try again."

## API Response Enhancement

Server responses now include enhanced error information:

```json
{
  "success": false,
  "error": "API rate limit exceeded. Please wait before making more requests.",
  "errorType": "rate_limit",
  "retryAfter": 3600,
  "profiles": [],
  "summary": { ... }
}
```

This allows the frontend to provide better user experience with appropriate retry timing and messaging. 