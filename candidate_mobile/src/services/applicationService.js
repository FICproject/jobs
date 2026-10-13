import api from './api';
import { API_CONFIG } from '../constants/config';
import { getReferralCode, clearReferralCode } from './referralService';

export const submitApplication = async (jobId, applicationData) => {
  try {
    // Preserve and attach HR referral ID
    let referredBy = applicationData?.referredBy;
    if (!referredBy) {
      referredBy = await getReferralCode();
    }

    const payload = {
      jobId,
      ...applicationData,
      referredBy: referredBy || null,
    };
    const response = await api.post(API_CONFIG.ENDPOINTS.APPLY, payload);

    // Preserve referral code so all job applications submitted by this candidate are attributed to the HR
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.error || 'Failed to submit application.';
    return {
      success: false,
      error: errorMsg,
    };
  }
};

export const fetchCandidateApplications = async (candidateId) => {
  try {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.APPLICATIONS}?candidateId=${candidateId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching candidate applications:', error);
    return [];
  }
};

export const fetchCandidateInterviews = async (candidateId) => {
  try {
    const response = await api.get(`${API_CONFIG.ENDPOINTS.INTERVIEWS}?candidateId=${candidateId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    return [];
  }
};
