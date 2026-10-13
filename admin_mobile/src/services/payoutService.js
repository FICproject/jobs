import apiClient from './api';

export const payoutService = {
  /**
   * Fetch global IT training incentives mapping
   * e.g. { 'PROCESS 1': 10000, 'PROCESS 2': 15000, 'PROCESS 3': 10000 }
   */
  async getGlobalIncentives() {
    try {
      const response = await apiClient.get('/api/settings/it-training-incentives');
      return response.data || {};
    } catch (e) {
      console.warn('Error fetching global IT training incentives:', e.message);
      return { 'PROCESS 1': 10000, 'PROCESS 2': 15000, 'PROCESS 3': 10000 };
    }
  },

  /**
   * Save global IT training incentives mapping
   */
  async saveGlobalIncentives(incentives) {
    const response = await apiClient.post('/api/settings/it-training-incentives', incentives);
    return response.data;
  },

  /**
   * Fetch IT training processes to get placement process list
   */
  async getPlacementProcesses() {
    try {
      const response = await apiClient.get('/api/it-training-processes/all');
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      console.warn('Error fetching IT processes:', e.message);
      return [];
    }
  },

  /**
   * Fetch HR team users
   */
  async getHrs() {
    try {
      const response = await apiClient.get('/api/users/hr');
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      console.warn('Error fetching HR users:', e.message);
      return [];
    }
  },

  /**
   * Fetch all Agent / Partner users
   */
  async getAllPartners() {
    try {
      const response = await apiClient.get('/api/users/agents/all');
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      console.warn('Error fetching all partners:', e.message);
      return [];
    }
  },

  /**
   * Fetch all candidate applications
   */
  async getApplications() {
    try {
      const response = await apiClient.get('/api/applications');
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      console.warn('Error fetching applications:', e.message);
      return [];
    }
  },

  /**
   * Update payout status for a candidate application (e.g. 'Paid' or 'Pending')
   */
  async updateApplicationIncentiveStatus(applicationId, status) {
    const response = await apiClient.put(`/api/applications/${applicationId}/incentive-status`, {
      status,
    });
    return response.data;
  },

  /**
   * Update candidate incentives for an HR user
   * items: [{ applicationId, amount }]
   */
  async updateCandidateIncentives(hrId, items) {
    const response = await apiClient.put(`/api/users/hr/${hrId}/candidate-incentives`, {
      items,
    });
    return response.data;
  },
};

export default payoutService;
