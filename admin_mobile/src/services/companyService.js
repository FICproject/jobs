import apiClient from './api';

export const companyService = {
  async getCompanies() {
    const response = await apiClient.get('/api/companies');
    return Array.isArray(response.data) ? response.data : [];
  },

  async createCompany(companyData) {
    const response = await apiClient.post('/api/companies', companyData);
    return response.data;
  },

  async updateCompany(id, companyData) {
    const response = await apiClient.put(`/api/companies/${id}`, companyData);
    return response.data;
  },

  async deleteCompany(id) {
    const response = await apiClient.delete(`/api/companies/${id}`);
    return response.data;
  },
};

export default companyService;
