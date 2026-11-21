import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Backend Host Configuration for Patient Mobile Portal
 *
 * Resolution order:
 *  1. app.json -> expo.extra.apiBaseUrl, when configured for production/pilot.
 *  2. EXPO_PUBLIC_API_URL environment variable if provided.
 *  3. Dynamic runtime override via setServerHost().
 *  4. Android Emulator / Host LAN fallback in development.
 */
const DEFAULT_API_PATH = '/ims/usintellix-hospital-management-system/backend/public';

function resolveDefaultBaseUrl() {
  const configured = Constants.expoConfig?.extra?.apiBaseUrl || 
                     (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL);
  if (configured) {
    return String(configured).replace(/\/+$/, '');
  }

  const host = (() => {
    if (Platform.OS === 'android') {
      return typeof __DEV__ !== 'undefined' && __DEV__ ? '10.0.2.2' : 'localhost';
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.hostname || 'localhost';
    }
    return 'localhost';
  })();

  const protocol = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'https' : 'http';
  return `${protocol}://${host}${DEFAULT_API_PATH}`;
}

let customBaseUrl = null;

export const CONFIG = {
  get BASE_URL() {
    return customBaseUrl || resolveDefaultBaseUrl();
  },
  APP_NAME: 'USIntellix Health',
  APP_SUBTITLE: 'Patient Mobile Portal',
  VERSION: '1.0.1'
};

export function getServerHost() {
  try {
    const url = new URL(CONFIG.BASE_URL);
    return url.hostname;
  } catch {
    return 'localhost';
  }
}

export function setServerHost(newHost) {
  if (newHost && typeof newHost === 'string') {
    let clean = newHost.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      const protocol = (typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'https' : 'http';
      clean = `${protocol}://${clean}`;
    }
    clean = clean.replace(/\/+$/, '');
    if (!clean.includes('/backend/public')) {
      clean = `${clean}${DEFAULT_API_PATH}`;
    }
    customBaseUrl = clean;
  }
  return getServerHost();
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
