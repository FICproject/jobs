import apiClient from './api';

export const reportService = {
  async getDashboardReports() {
    const response = await apiClient.get('/api/reports/dashboard');
    return response.data;
  },
};

export default reportService;
