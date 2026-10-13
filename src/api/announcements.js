import { apiRequest } from './client';

export const AnnouncementsService = {
  /**
   * Fetch active announcements targeted to the current patient
   */
  async getActiveAnnouncements() {
    return await apiRequest('/announcements/active');
  }
};
