/**
 * Get the API base URL from environment variables
 * Falls back to localhost for development
 */
export const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

/**
 * Build a full API URL from a path
 * @param path - API endpoint path (e.g., '/auth/profile')
 * @returns Full URL
 */
export const buildApiUrl = (path: string) => {
    const baseUrl = getApiUrl();
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
};
