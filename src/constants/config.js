import { Platform } from 'react-native';

/**
 * Backend Host Configuration for React Native
 * 
 * - When running on physical Android device over Wi-Fi: uses PC's LAN IP (192.168.100.31).
 * - When running on Android Studio Emulator: 10.0.2.2 maps to host machine.
 * - When running on Web: uses current window.location.hostname.
 */
const DEFAULT_LAN_IP = '192.168.100.31';

let currentHost = (() => {
  if (Platform.OS === 'android') return DEFAULT_LAN_IP;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.hostname || 'localhost';
  return 'localhost';
})();

export const CONFIG = {
  get BASE_URL() {
    return `http://${currentHost}/ims/usintellix-hospital-management-system/backend/public`;
  },
  APP_NAME: 'USIntellix Health',
  APP_SUBTITLE: 'Patient Mobile Portal',
  VERSION: '1.0.0'
};

export function getServerHost() {
  return currentHost;
}

export function setServerHost(newHost) {
  if (newHost && typeof newHost === 'string') {
    let clean = newHost.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (clean) {
      currentHost = clean;
    }
  }
  return currentHost;
}

export function getAvatarUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${CONFIG.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${CONFIG.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

