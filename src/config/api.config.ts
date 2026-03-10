export const API_CONFIG = {
    // API base URL from environment or production default
    BASE_URL: import.meta.env.VITE_API_URL || '/api',

    // Auth token key for localStorage
    TOKEN_KEY: 'lia_auth_token',

    // User data key for localStorage
    USER_KEY: 'lia_user',

    // Default headers
    HEADERS: {
        'Content-Type': 'application/json',
    }
};
