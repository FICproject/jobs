import apiClient from './api';

export const hrService = {
  async getHrs() {
    try {
      const response = await apiClient.get('/api/users/hr');
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      console.warn('Error fetching HR users:', e.message);
      return [];
    }
  },

  async createHr(hrData) {
    const response = await apiClient.post('/api/users/hr', hrData);
    return response.data;
  },

  async deleteHr(id) {
    const response = await apiClient.delete(`/api/users/hr/${id}`);
    return response.data;
  },

  async getHrDashboard(referralCode) {
    try {
      const response = await apiClient.get(`/api/users/hr/${referralCode}/dashboard`);
      return response.data;
    } catch (e) {
      console.warn('Error fetching HR dashboard:', e.message);
      return null;
    }
  },
};

export default hrService;
