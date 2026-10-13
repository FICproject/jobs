import api from './api';
import { API_CONFIG } from '../constants/config';

export const updateProfile = async (userId, profileData) => {
  try {
    const response = await api.put(API_CONFIG.ENDPOINTS.UPDATE_PROFILE(userId), profileData);
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Profile update failed';
    throw new Error(errorMsg);
  }
};
