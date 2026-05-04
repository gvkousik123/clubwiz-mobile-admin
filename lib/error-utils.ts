/**
 * Extract detailed error message from various error response formats
 * Handles axios errors, API responses, and standard Error objects
 */
export function getDetailedErrorMessage(error: any, fallback: string = 'An unexpected error occurred'): string {
    // Try to get error message from various possible locations
    // Check for specific error details first (most specific)
    if (error?.response?.data?.details) {
        return error.response.data.details;
    }

    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.response?.data?.error) {
        return error.response.data.error;
    }

    if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        return error.response.data.errors.join(', ');
    }

    if (error?.response?.statusText) {
        return `${error.response.status}: ${error.response.statusText}`;
    }

    if (error?.message) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return fallback;
}

/**
 * Log error with detailed information for debugging
 */
export function logDetailedError(context: string, error: any): void {
    console.error(`❌ ${context}:`, {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        error: error
    });
}
