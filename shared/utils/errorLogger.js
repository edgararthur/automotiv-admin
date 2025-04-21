/**
 * Logs error information
 * @param {string} source - Source of the error (e.g., service.method)
 * @param {Error|Object} error - Error object
 */
export const logError = (source, error) => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
  const stack = error instanceof Error ? error.stack : 'No stack trace';
  
  console.error(`[${timestamp}] [ERROR] ${source}: ${errorMessage}`);
  
  // Always log stack trace in development environments (browser or Node.js)
  console.error(stack);
  
  // In a real app, you might want to:
  // 1. Send to a logging service (Sentry, LogRocket, etc.)
  // 2. Log to a file or database
  // 3. Send alerts for critical errors
//   Gilfoyle.arthur
}; 