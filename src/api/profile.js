import { apiRequest } from './client';

export const ProfileService = {
  /**
   * Fetch current patient's profile from OpenEMR / hospital backend
   */
  async getProfile() {
    return await apiRequest('/profile');
  },

  /**
   * Update patient profile information (contact & name)
   */
  async updateProfile(data) {
    return await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Change patient password
   */
  async changePassword(currentPassword, newPassword) {
    return await apiRequest('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
  }
};
