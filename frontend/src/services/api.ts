import axios from 'axios';
import { Alert, AlertStats } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const alertsAPI = {
  getAlerts: async (params?: {
    status?: string;
    severity?: string;
    limit?: number;
  }): Promise<Alert[]> => {
    const response = await api.get('/alerts/', { params });
    return response.data;
  },

  getStats: async (): Promise<AlertStats> => {
    const response = await api.get('/alerts/stats');
    return response.data;
  },

  generateAlerts: async (): Promise<{ message: string; alert_count: number }> => {
    const response = await api.post('/alerts/generate');
    return response.data;
  },

  getRecentEvents: async (hours: number = 24): Promise<any[]> => {
    const response = await api.get('/alerts/events', { params: { hours } });
    return response.data;
  },

  updateAlertStatus: async (alertId: string, status: string): Promise<{ message: string; alert_id: string; new_status: string }> => {
    const response = await api.patch(`/alerts/${alertId}/status`, { status });
    return response.data;
  },
};

export default api;
