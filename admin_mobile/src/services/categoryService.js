import apiClient from './api';

export const categoryService = {
  async getCategories() {
    const response = await apiClient.get('/api/categories');
    return Array.isArray(response.data) ? response.data : [];
  },

  async createCategory(categoryData) {
    const response = await apiClient.post('/api/categories', categoryData);
    return response.data;
  },

  async updateCategory(id, categoryData) {
    const response = await apiClient.put(`/api/categories/${id}`, categoryData);
    return response.data;
  },

  async deleteCategory(id) {
    const response = await apiClient.delete(`/api/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
