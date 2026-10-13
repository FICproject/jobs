import apiClient from './api';

export const partnerService = {
  async getPartners(hrId) {
    try {
      const response = await apiClient.get(`/api/users/hr/${hrId}/agents`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      try {
        const fallback = await apiClient.get(`/api/users/agents/${hrId}/subagents`);
        return Array.isArray(fallback.data) ? fallback.data : [];
      } catch (err) {
        console.warn('Error fetching partners for HR:', err.message);
        return [];
      }
    }
  },

  async createPartner(hrId, partnerData) {
    try {
      const response = await apiClient.post(`/api/users/hr/${hrId}/agents`, partnerData);
      return response.data;
    } catch (e) {
      const fallback = await apiClient.post(`/api/users/agents/${hrId}/subagents`, partnerData);
      return fallback.data;
    }
  },

  async deletePartner(hrId, agentId) {
    try {
      const response = await apiClient.delete(`/api/users/hr/${hrId}/agents/${agentId}`);
      return response.data;
    } catch (e) {
      const fallback = await apiClient.delete(`/api/users/agents/${hrId}/subagents/${agentId}`);
      return fallback.data;
    }
  },
};

export default partnerService;
