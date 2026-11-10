export const WHEN_UNLOCKED = 0;
export const AFTER_FIRST_UNLOCK = 1;
export const ALWAYS = 2;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 3;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 4;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 5;
export const ALWAYS_THIS_DEVICE_ONLY = 6;

export async function setItemAsync(key, value) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

export async function getItemAsync(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
}

export async function deleteItemAsync(key) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
  }
}

export default {
  WHEN_UNLOCKED,
  AFTER_FIRST_UNLOCK,
  ALWAYS,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  ALWAYS_THIS_DEVICE_ONLY,
  setItemAsync,
  getItemAsync,
  deleteItemAsync
};
