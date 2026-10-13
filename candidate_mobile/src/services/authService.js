import api from './api';
import { API_CONFIG } from '../constants/config';

export const loginCandidate = async (email, password) => {
  try {
    const response = await api.post(API_CONFIG.ENDPOINTS.AUTH_LOGIN, { email, password });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Authentication failed';
    throw new Error(errorMsg);
  }
};

export const registerCandidate = async (candidateData) => {
  try {
    const response = await api.post(API_CONFIG.ENDPOINTS.AUTH_REGISTER, {
      ...candidateData,
      role: 'candidate',
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Registration failed';
    throw new Error(errorMsg);
  }
};
