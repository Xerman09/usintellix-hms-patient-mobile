import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY_ENABLED = 'usintellix_biometric_enabled';
const BIOMETRIC_KEY_CREDENTIALS = 'usintellix_biometric_credentials';
const BIOMETRIC_KEY_LAST_USER = 'usintellix_biometric_last_user';

export const BiometricService = {
  /**
   * Check if hardware supports biometrics (fingerprint/face) and enrolled
   */
  async checkBiometricAvailability() {
    try {
      if (Platform.OS === 'web') {
        return {
          available: false,
          hasHardware: false,
          isEnrolled: false,
          biometricType: 'Biometric Unlock'
        };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType = 'Biometric Unlock';
      if (supportedTypes && supportedTypes.length > 0) {
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricType = Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricType = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint Unlock';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometricType = 'Iris Scan';
        }
      }

      return {
        available: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        biometricType
      };
    } catch (err) {
      console.warn('Biometric availability check failed:', err);
      return {
        available: false,
        hasHardware: false,
        isEnrolled: false,
        biometricType: 'Biometric Unlock'
      };
    }
  },

  /**
   * Check whether the user has toggled biometric unlock ON
   */
  async isBiometricEnabled() {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(BIOMETRIC_KEY_ENABLED) === 'true';
        }
        return false;
      }
      const val = await SecureStore.getItemAsync(BIOMETRIC_KEY_ENABLED);
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  /**
   * Store user credentials securely in Android Keystore / iOS Keychain
   */
  async enableBiometrics(username, password, userData = null) {
    try {
      const payload = JSON.stringify({
        username,
        password,
        savedAt: new Date().toISOString()
      });

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(BIOMETRIC_KEY_ENABLED, 'true');
          window.localStorage.setItem(BIOMETRIC_KEY_CREDENTIALS, payload);
          if (userData) {
            window.localStorage.setItem(BIOMETRIC_KEY_LAST_USER, JSON.stringify(userData));
          }
        }
        return true;
      }

      await SecureStore.setItemAsync(BIOMETRIC_KEY_ENABLED, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_KEY_CREDENTIALS, payload, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
      });
      if (userData) {
        await SecureStore.setItemAsync(BIOMETRIC_KEY_LAST_USER, JSON.stringify(userData));
      }
      return true;
    } catch (e) {
      console.error('Failed to enable biometrics securely:', e);
      return false;
    }
  },

  /**
   * Disable biometric authentication and erase saved credentials
   */
  async disableBiometrics() {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(BIOMETRIC_KEY_ENABLED);
          window.localStorage.removeItem(BIOMETRIC_KEY_CREDENTIALS);
        }
        return true;
      }

      await SecureStore.deleteItemAsync(BIOMETRIC_KEY_ENABLED);
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY_CREDENTIALS);
      return true;
    } catch (e) {
      console.error('Failed to disable biometrics:', e);
      return false;
    }
  },

  /**
   * Get the saved biometric account username
   */
  async getSavedBiometricUsername() {
    try {
      let raw = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(BIOMETRIC_KEY_CREDENTIALS);
        }
      } else {
        raw = await SecureStore.getItemAsync(BIOMETRIC_KEY_CREDENTIALS);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.username || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get cached last user info for display on quick unlock screen
   */
  async getLastUser() {
    try {
      let raw = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(BIOMETRIC_KEY_LAST_USER);
        }
      } else {
        raw = await SecureStore.getItemAsync(BIOMETRIC_KEY_LAST_USER);
      }
      if (raw) return JSON.parse(raw);
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Trigger native biometric prompt (Fingerprint scan or Face match)
   */
  async authenticateWithBiometrics(customPrompt = 'Unlock USIntellix Patient Portal') {
    try {
      if (Platform.OS === 'web') {
        // On web fallback (simulate or allow if credentials stored)
        const creds = await this.getStoredCredentials();
        if (creds) {
          return { success: true, credentials: creds };
        }
        return { success: false, error: 'Biometrics unavailable on web browser.' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: customPrompt,
        cancelLabel: 'Use Password',
        disableDeviceFallback: false,
        fallbackLabel: 'Enter Password'
      });

      if (result.success) {
        const creds = await this.getStoredCredentials();
        if (creds) {
          return { success: true, credentials: creds };
        } else {
          return {
            success: false,
            error: 'Biometric passed, but no stored login session found. Please enter password once.'
          };
        }
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication cancelled.'
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Biometric sensor error.'
      };
    }
  },

  /**
   * Retrieve encrypted credentials
   */
  async getStoredCredentials() {
    try {
      let raw = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(BIOMETRIC_KEY_CREDENTIALS);
        }
      } else {
        raw = await SecureStore.getItemAsync(BIOMETRIC_KEY_CREDENTIALS);
      }

      if (raw) {
        return JSON.parse(raw);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
};
