import 'dotenv/config';

export const env = {
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    // GHL OAuth2
    GHL_CLIENT_ID: process.env.GHL_CLIENT_ID || '',
    GHL_CLIENT_SECRET: process.env.GHL_CLIENT_SECRET || '',
    GHL_REDIRECT_URI: process.env.GHL_REDIRECT_URI || 'https://app.liabotedu.com/api/integrations/oauth/callback',
};
