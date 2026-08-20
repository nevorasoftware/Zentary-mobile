// Device Service for Zentary Mobile
// Manages persistent device identification and long-lived 15-day session storage across Web and Native platforms

import * as FileSystem from 'expo-file-system';
import { apiService, UserProfile } from './api';

const DEVICE_ID_KEY = 'zentary_device_id_v1';
const SESSION_TOKEN_KEY = 'zentary_session_token_v1';
const SESSION_USER_KEY = 'zentary_session_user_v1';

// Native storage paths via expo-file-system
const NATIVE_DIR = FileSystem.documentDirectory || '';
const SESSION_FILE = NATIVE_DIR ? `${NATIVE_DIR}zentary_session_store_v1.json` : '';
const DEVICE_FILE = NATIVE_DIR ? `${NATIVE_DIR}zentary_device_id_v1.txt` : '';

class DeviceService {
  private deviceIdCache: string | null = null;
  private tokenCache: string | null = null;
  private userCache: UserProfile | null = null;

  /**
   * Reads a key from either localStorage or Native FileSystem
   */
  private async readItem(key: string, nativeFile: string): Promise<string | null> {
    // 1. Try localStorage if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val) return val;
      }
    } catch (e) {}

    // 2. Try Native FileSystem if available
    try {
      if (nativeFile) {
        const info = await FileSystem.getInfoAsync(nativeFile);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(nativeFile);
          if (content && content.trim()) {
            return content.trim();
          }
        }
      }
    } catch (e) {}

    return null;
  }

  /**
   * Writes a key-value pair to both localStorage and Native FileSystem
   */
  private async writeItem(key: string, value: string, nativeFile: string): Promise<void> {
    // 1. Write to localStorage if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}

    // 2. Write to Native FileSystem if available
    try {
      if (nativeFile) {
        await FileSystem.writeAsStringAsync(nativeFile, value);
      }
    } catch (e) {}
  }

  /**
   * Removes a key-value pair from both localStorage and Native FileSystem
   */
  private async removeItem(key: string, nativeFile: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}

    try {
      if (nativeFile) {
        await FileSystem.deleteAsync(nativeFile, { idempotent: true });
      }
    } catch (e) {}
  }

  /**
   * Returns or generates a persistent unique Device ID for this device
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceIdCache) {
      return this.deviceIdCache;
    }

    const storedId = await this.readItem(DEVICE_ID_KEY, DEVICE_FILE);
    if (storedId) {
      this.deviceIdCache = storedId;
      return storedId;
    }

    const newDeviceId =
      'DEV-' +
      Math.random().toString(36).substring(2, 11).toUpperCase() +
      '-' +
      Date.now().toString(36).toUpperCase();

    this.deviceIdCache = newDeviceId;
    await this.writeItem(DEVICE_ID_KEY, newDeviceId, DEVICE_FILE);
    return newDeviceId;
  }

  /**
   * Persists session token and user profile locally
   */
  async saveSession(token: string, user: UserProfile) {
    this.tokenCache = token;
    this.userCache = user;

    const payload = JSON.stringify({ token, user, savedAt: Date.now() });
    await this.writeItem(SESSION_TOKEN_KEY, token, '');
    await this.writeItem(SESSION_USER_KEY, JSON.stringify(user), '');
    await this.writeItem('session_combined', payload, SESSION_FILE);

    apiService.setAuthToken(token);
  }

  /**
   * Clears saved session data upon logout or disabled account
   */
  async clearSession() {
    this.tokenCache = null;
    this.userCache = null;

    await this.removeItem(SESSION_TOKEN_KEY, '');
    await this.removeItem(SESSION_USER_KEY, '');
    await this.removeItem('session_combined', SESSION_FILE);

    apiService.setAuthToken('');
  }

  /**
   * Attempts silent background session renewal on app start
   */
  async restoreAndRenewSession(): Promise<{ loggedIn: boolean; user?: UserProfile; mustChangePassword?: boolean }> {
    const deviceId = await this.getDeviceId();
    apiService.setDeviceId(deviceId);

    let savedToken: string | null = this.tokenCache;
    let savedUser: UserProfile | null = this.userCache;

    if (!savedToken || !savedUser) {
      // Try combined file first (Native FileSystem)
      const combinedStr = await this.readItem('session_combined', SESSION_FILE);
      if (combinedStr) {
        try {
          const parsed = JSON.parse(combinedStr);
          if (parsed.token && parsed.user) {
            savedToken = parsed.token;
            savedUser = parsed.user;
          }
        } catch (e) {}
      }
    }

    if (!savedToken) {
      savedToken = await this.readItem(SESSION_TOKEN_KEY, '');
    }

    if (!savedUser) {
      const userStr = await this.readItem(SESSION_USER_KEY, '');
      if (userStr) {
        try {
          savedUser = JSON.parse(userStr);
        } catch (e) {}
      }
    }

    if (!savedToken) {
      return { loggedIn: false };
    }

    apiService.setAuthToken(savedToken);

    try {
      // Renew token for 15 additional days via API
      const res = await apiService.renewSession(deviceId);
      if (res.success && res.token) {
        await this.saveSession(res.token, res.user);
        return {
          loggedIn: true,
          user: res.user,
          mustChangePassword: res.mustChangePassword,
        };
      }
    } catch (err: any) {
      console.log('⚠️ [SESSION RENEWAL WARN]:', err.message);
      // If error is account disabled or invalid token/expired, clear session
      if (
        err.message &&
        (err.message.includes('deshabilitado') ||
          err.message.includes('no válida') ||
          err.message.includes('expirado') ||
          err.message.includes('INVALID_TOKEN'))
      ) {
        await this.clearSession();
        return { loggedIn: false };
      }
    }

    // Fallback: If network is offline, keep logged in with cached user if token exists
    if (savedUser) {
      return { loggedIn: true, user: savedUser };
    }

    return { loggedIn: false };
  }
}

export const deviceService = new DeviceService();
