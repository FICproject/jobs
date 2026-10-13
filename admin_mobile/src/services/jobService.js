import apiClient from './api';

export const jobService = {
  async getJobs() {
    const response = await apiClient.get('/api/jobs');
    return Array.isArray(response.data) ? response.data : [];
  },

  async createJob(jobData) {
    const response = await apiClient.post('/api/jobs', jobData);
    return response.data;
  },

  async updateJob(id, jobData) {
    const response = await apiClient.put(`/api/jobs/${id}`, jobData);
    return response.data;
  },

  async deleteJob(id) {
    const response = await apiClient.delete(`/api/jobs/${id}`);
    return response.data;
  },
};

export default jobService;
