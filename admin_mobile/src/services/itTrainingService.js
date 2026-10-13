import apiClient from './api';

export const itTrainingService = {
  async getItProcesses() {
    const response = await apiClient.get('/api/it-training-processes/all');
    return Array.isArray(response.data) ? response.data : [];
  },

  async createItProcess(processData) {
    const response = await apiClient.post('/api/it-training-processes', processData);
    return response.data;
  },

  async updateItProcess(id, processData) {
    const response = await apiClient.put(`/api/it-training-processes/${id}`, processData);
    return response.data;
  },

  async deleteItProcess(id) {
    const response = await apiClient.delete(`/api/it-training-processes/${id}`);
    return response.data;
  },
};

export default itTrainingService;
