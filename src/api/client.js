import { CONFIG } from '../constants/config';

// In-memory cookie session jar for React Native mobile networking
let sessionCookies = '';

export async function apiRequest(endpoint, options = {}) {
  const url = `${CONFIG.BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(sessionCookies ? { 'Cookie': sessionCookies } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers
    });

    // Save PHP session cookies (PHPSESSID) for native mobile networking
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      sessionCookies = setCookie.split(';')[0];
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      return {
        success: false,
        message: `Invalid server response (HTTP ${response.status}).`
      };
    }

    return {
      ...data,
      httpStatus: response.status
    };
  } catch (error) {
    console.error('Network Error:', error);
    return {
      success: false,
      message: 'Unable to connect to hospital server. Please check your network connection.'
    };
  }
}

export function clearSessionCookies() {
  sessionCookies = '';
}
