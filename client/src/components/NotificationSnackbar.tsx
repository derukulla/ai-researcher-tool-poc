import React from 'react';
import { Snackbar, Alert, AlertTitle, Button } from '@mui/material';
import { parseApiError, getErrorSeverity } from '../utils/errorHandler';

interface NotificationSnackbarProps {
  open: boolean;
  message: string;
  severity?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  error?: any; // Original error object for enhanced parsing
  onRetry?: () => void; // Optional retry function
}

const NotificationSnackbar: React.FC<NotificationSnackbarProps> = ({ 
  open, 
  message, 
  severity = 'info', 
  onClose,
  error,
  onRetry
}) => {
  // If an error object is provided, parse it for enhanced display
  const parsedError = error ? parseApiError(error) : null;
  const enhancedSeverity = parsedError ? getErrorSeverity(parsedError) : severity;
  
  const getTitle = () => {
    if (!parsedError) return null;
    
    switch (parsedError.type) {
      case 'rate_limit':
        return 'Rate Limit Exceeded';
      case 'network':
        return 'Connection Issue';
      case 'validation':
        return 'Invalid Input';
      case 'not_found':
        return 'Not Found';
      case 'timeout':
        return 'Request Timeout';
      case 'server':
        return 'Server Error';
      default:
        return null;
    }
  };

  const title = getTitle();
  const showRetry = parsedError?.retryable && onRetry;
  const autoHideDuration = parsedError?.type === 'rate_limit' ? 10000 : 6000; // Longer for rate limits

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={onClose}
        severity={enhancedSeverity}
        sx={{ width: '100%', maxWidth: 500 }}
        action={
          showRetry && (
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                onRetry();
                onClose();
              }}
            >
              Retry
            </Button>
          )
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar; 