import { apiRequest } from './client';

export const PrescriptionService = {
  /**
   * Fetch patient's prescriptions (automatically scoped by backend to authenticated patient)
   */
  async getPrescriptions() {
    return await apiRequest('/patient-prescriptions', {
      method: 'GET'
    });
  },

  /**
   * Request a medication refill
   */
  async requestRefill(prescriptionId) {
    return await apiRequest('/patient-prescriptions/refill-request', {
      method: 'POST',
      body: JSON.stringify({ prescription_id: prescriptionId })
    });
  }
};
