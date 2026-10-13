import { apiRequest } from './client';

export const ClinicalRemindersService = {
  /**
   * The logged-in patient's clinical health maintenance reminders
   * (Preventive care rules: Colonoscopy, Mammogram, Vaccines, Blood Pressure, etc.)
   */
  async getMyReminders() {
    return await apiRequest('/patient-reminders/mine', {
      method: 'GET'
    });
  },

  /**
   * General dated reminders from /reminders/mine
   */
  async getDatedReminders() {
    return await apiRequest('/reminders/mine', {
      method: 'GET'
    });
  }
};
