import api from './api';
import { API_CONFIG } from '../constants/config';

export const fetchJobs = async (params = {}) => {
  try {
    const response = await api.get(API_CONFIG.ENDPOINTS.JOBS, { params });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching jobs from server:', error);
    return [];
  }
};

export const fetchJobById = async (id) => {
  try {
    const response = await api.get(API_CONFIG.ENDPOINTS.JOB_DETAILS(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching job details for ${id}:`, error);
    return null;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await api.get(API_CONFIG.ENDPOINTS.CATEGORIES);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchCompanies = async () => {
  try {
    const response = await api.get(API_CONFIG.ENDPOINTS.COMPANIES);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

export const fetchItTrainingProcesses = async () => {
  try {
    const response = await api.get(API_CONFIG.ENDPOINTS.IT_TRAINING);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching IT training processes:', error);
    return [];
  }
};
