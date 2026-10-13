// API Configuration for Forge India Connect Jobs

// Determine default backend host depending on React Native environment / platform
const DEFAULT_BASE_URL = typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL
  : 'https://api.jobs.forgeindiaconnect.in/api';

export const API_CONFIG = {
  // Base URL connected to the existing backend server
  BASE_URL: DEFAULT_BASE_URL,
  TIMEOUT: 15000,
  ENDPOINTS: {
    AUTH_LOGIN: '/auth/login',
    AUTH_REGISTER: '/auth/register',
    UPDATE_PROFILE: (userId) => `/auth/profile/${userId}`,
    JOBS: '/jobs',
    JOB_DETAILS: (id) => `/jobs/${id}`,
    CATEGORIES: '/categories',
    COMPANIES: '/companies',
    IT_TRAINING: '/it-training-processes',
    APPLY: '/applications',
    APPLICATIONS: '/applications',
    INTERVIEWS: '/interviews',
  },
};

export const APP_INFO = {
  NAME: 'Forge India Connect Jobs',
  TAGLINE: 'Empowering India’s Workforce with Career Opportunities',
  SUPPORT_EMAIL: 'support@forgeindiaconnect.com',
};

export const JOB_TYPES = ['All', 'Full-Time', 'Part-Time', 'Contract', 'Remote', 'Internship'];
