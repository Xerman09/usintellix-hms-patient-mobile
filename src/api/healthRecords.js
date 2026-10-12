import { apiRequest } from './client';

export const HealthRecordsService = {
  /**
   * Fetch complete CCD health summary for the authenticated patient
   */
  async getHealthSummary() {
    return await apiRequest('/health-summary', {
      method: 'GET'
    });
  }
};
