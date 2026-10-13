import apiClient from './api';

export const interviewService = {
  async getInterviews() {
    const response = await apiClient.get('/api/interviews');
    return Array.isArray(response.data) ? response.data : [];
  },

  async scheduleInterview(interviewData) {
    const response = await apiClient.post('/api/interviews', interviewData);
    return response.data;
  },
};

export default interviewService;
