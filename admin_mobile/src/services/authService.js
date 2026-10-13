import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@admin_user';

export const authService = {
  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { user } = response.data;
    
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      throw new Error('Access denied. Only Admins and HRs can access this portal.');
    }
    
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Error removing user session:', e);
    }
  },
};

export default authService;
