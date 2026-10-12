import { apiRequest, clearSessionCookies } from './client';

export const AuthService = {
  /**
   * Log in patient with credentials and enforce patient role security
   */
  async login(username, password) {
    const res = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (res.success && res.data?.user) {
      const user = res.data.user;
      if (user.role && user.role !== 'patient') {
        await this.logout();
        return {
          success: false,
          isStaffAttempt: true,
          message: 'Access restricted: This mobile app is exclusively for Patients. Healthcare staff must sign in via the Staff Portal.'
        };
      }
    }

    return res;
  },

  /**
   * Verify 2FA OTP code
   */
  async verify2FA(code) {
    return await apiRequest('/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },

  /**
   * Request fresh 2FA code
   */
  async resend2FA() {
    return await apiRequest('/resend-2fa', {
      method: 'POST'
    });
  },

  /**
   * Complete first login credential reset
   */
  async completeFirstLogin(payload) {
    return await apiRequest('/auth/first-login', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update 90-day expired password
   */
  async updateExpiredPassword(payload) {
    return await apiRequest('/auth/expired-password', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * HIPAA Notice of Privacy Practices consent
   */
  async acknowledgeNpp(signatureName) {
    return await apiRequest('/auth/npp-acknowledge', {
      method: 'POST',
      body: JSON.stringify({
        signature_data: signatureName,
        signature_type: 'electronic',
        npp_version: '2026-09'
      })
    });
  },

  /**
   * Logout patient
   */
  async logout() {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      clearSessionCookies();
    }
  }
};
