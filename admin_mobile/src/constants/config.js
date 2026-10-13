import { Platform } from 'react-native';

// Live production API endpoint
export const API_BASE_URL = 'https://api.jobs.forgeindiaconnect.in';

// Local dev API endpoint (fallback when debugging locally)
export const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

// Default active API URL
export const ACTIVE_API_URL = API_BASE_URL;

export const APP_CONFIG = {
  NAME: 'FIC RecruitPro',
  SUBTITLE: 'Admin & HR Management Portal',
  VERSION: '1.0.0',
};

export const APPLICATION_STATUSES = [
  'Payment Pending',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
];

export const INTERVIEW_ROUNDS = [
  'HR Screening',
  'Telephonic Interview',
  'Technical Interview',
  'Branch Manager Round',
  'Final Offer Discussion',
];

export const IT_CATEGORIES = ['Placement', 'Training', 'Course', 'Internship'];
