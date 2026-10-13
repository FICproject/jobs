import apiClient from './api';

export const applicationService = {
  async getApplications() {
    const response = await apiClient.get('/api/applications');
    const data = Array.isArray(response.data) ? response.data : [];
    return data.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
  },

  async updateApplicationStatus(id, status, adminNotes = '', paymentId = null) {
    const payload = { status };
    if (adminNotes !== undefined && adminNotes !== null) payload.adminNotes = adminNotes;
    if (paymentId) payload.paymentId = paymentId;
    const response = await apiClient.put(`/api/applications/${id}/status`, payload);
    return response.data;
  },

  async approvePayment(id, customPaymentId = null) {
    const paymentId = customPaymentId || ('MANUAL_PAYMENT_' + Date.now());
    const response = await apiClient.put(`/api/applications/${id}/status`, {
      status: 'Applied',
      paymentId,
    });
    return response.data;
  },

  async createApplication(applicationData) {
    const response = await apiClient.post('/api/applications', applicationData);
    return response.data;
  },
};

export default applicationService;
