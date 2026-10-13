import api from './api';
import { API_CONFIG } from '../constants/config';

export const fetchCandidateNotifications = async (candidateId) => {
  try {
    const [appRes, intRes] = await Promise.all([
      api.get(`${API_CONFIG.ENDPOINTS.APPLICATIONS}?candidateId=${candidateId}`),
      api.get(`${API_CONFIG.ENDPOINTS.INTERVIEWS}?candidateId=${candidateId}`)
    ]);

    const applications = Array.isArray(appRes.data) ? appRes.data : [];
    const interviews = Array.isArray(intRes.data) ? intRes.data : [];

    const notifications = [];

    interviews.forEach(intItem => {
      notifications.push({
        id: `notif_int_${intItem.id}`,
        title: 'Interview Scheduled 📅',
        message: `Your interview for ${intItem.jobTitle} with ${intItem.companyName} is scheduled for ${intItem.date} at ${intItem.time}. Mode: ${intItem.mode || 'Online'}`,
        date: intItem.createdAt || intItem.date,
        type: 'interview',
        data: intItem
      });
    });

    applications.forEach(app => {
      if (app.status === 'Selected') {
        notifications.push({
          id: `notif_sel_${app.id}`,
          title: 'Congratulations! 🎉',
          message: `You have been selected for the position ${app.jobTitle} at ${app.companyName}!`,
          date: app.updatedAt || app.appliedAt,
          type: 'selected',
          data: app
        });
      } else if (app.status === 'Shortlisted') {
        notifications.push({
          id: `notif_short_${app.id}`,
          title: 'Application Shortlisted ⭐',
          message: `Your application for ${app.jobTitle} at ${app.companyName} has been shortlisted by the HR team.`,
          date: app.updatedAt || app.appliedAt,
          type: 'shortlisted',
          data: app
        });
      }
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
