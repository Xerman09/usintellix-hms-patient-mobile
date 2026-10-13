import { Platform } from 'react-native';

/**
 * Backend Host Configuration for React Native
 * 
 * - When running on Android Emulator: 10.0.2.2 maps to the host machine's localhost (XAMPP).
 * - When running on Physical Android Device via Wi-Fi/USB: Replace with your PC LAN IP (e.g. 192.168.1.X).
 * - When running on iOS Simulator: localhost maps to host machine.
 */
const getHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.hostname || 'localhost';
  return 'localhost';
};

export const CONFIG = {
  BASE_URL: `http://${getHost()}/ims/usintellix-hospital-management-system/backend/public`,
  APP_NAME: 'USIntellix Health',
  APP_SUBTITLE: 'Patient Mobile Portal',
  VERSION: '1.0.0'
};

export function getAvatarUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${CONFIG.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

