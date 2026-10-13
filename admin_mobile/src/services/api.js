import axios from 'axios';
import { ACTIVE_API_URL } from '../constants/config';

export const apiClient = axios.create({
  baseURL: ACTIVE_API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

export default apiClient;
