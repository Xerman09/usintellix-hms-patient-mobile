export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3
};

export async function hasHardwareAsync() {
  return false;
}

export async function isEnrolledAsync() {
  return false;
}

export async function supportedAuthenticationTypesAsync() {
  return [];
}

export async function authenticateAsync() {
  return { success: false, error: 'not_supported_on_web' };
}

export default {
  AuthenticationType,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
  authenticateAsync
};
