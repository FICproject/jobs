import axios from 'axios';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants/config';

// Determine default host depending on Platform
let baseURL = API_CONFIG.BASE_URL;
if (Platform.OS === 'android' && baseURL.includes('localhost')) {
  baseURL = baseURL.replace('localhost', '10.0.2.2');
}

const api = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default api;

