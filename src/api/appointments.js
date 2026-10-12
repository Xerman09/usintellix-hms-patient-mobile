import { apiRequest } from './client';

export const AppointmentService = {
  /**
   * Fetch patient's appointments (automatically restricted by backend session)
   */
  async getAppointments() {
    return await apiRequest('/appointments', {
      method: 'GET'
    });
  },

  /**
   * Fetch active medical providers / doctors for selection
   */
  async getProviders() {
    return await apiRequest('/providers', {
      method: 'GET'
    });
  },

  /**
   * Request / book an appointment
   */
  async bookAppointment(data) {
    return await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
