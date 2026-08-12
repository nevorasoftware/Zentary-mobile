// Device Service for Zentary Mobile
// Manages persistent device identification and long-lived 15-day session storage

import { apiService, UserProfile } from './api';

const DEVICE_ID_KEY = 'zentary_device_id_v1';
const SESSION_TOKEN_KEY = 'zentary_session_token_v1';
const SESSION_USER_KEY = 'zentary_session_user_v1';

class DeviceService {
  private deviceIdCache: string | null = null;

  /**
   * Returns or generates a persistent unique Device ID for this device
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceIdCache) {
      return this.deviceIdCache;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        let storedId = window.localStorage.getItem(DEVICE_ID_KEY);
        if (!storedId) {
          storedId = 'DEV-' + Math.random().toString(36).substring(2, 11).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
          window.localStorage.setItem(DEVICE_ID_KEY, storedId);
        }
        this.deviceIdCache = storedId;
        return storedId;
      }
    } catch (e) {}

    // Fallback memory ID
    const fallbackId = 'DEV-MOBILE-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    this.deviceIdCache = fallbackId;
    return fallbackId;
  }

  /**
   * Persists session token and user profile locally
   */
  async saveSession(token: string, user: UserProfile) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SESSION_TOKEN_KEY, token);
        window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      }
    } catch (e) {}
    apiService.setAuthToken(token);
  }

  /**
   * Clears saved session data upon logout or disabled account
   */
  async clearSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(SESSION_TOKEN_KEY);
        window.localStorage.removeItem(SESSION_USER_KEY);
      }
    } catch (e) {}
    apiService.setAuthToken('');
  }

  /**
   * Attempts silent background session renewal on app start
   */
  async restoreAndRenewSession(): Promise<{ loggedIn: boolean; user?: UserProfile; mustChangePassword?: boolean }> {
    const deviceId = await this.getDeviceId();
    apiService.setDeviceId(deviceId);

    let savedToken: string | null = null;
    let savedUser: UserProfile | null = null;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        savedToken = window.localStorage.getItem(SESSION_TOKEN_KEY);
        const userStr = window.localStorage.getItem(SESSION_USER_KEY);
        if (userStr) {
          savedUser = JSON.parse(userStr);
        }
      }
    } catch (e) {}

    if (!savedToken) {
      return { loggedIn: false };
    }

    apiService.setAuthToken(savedToken);

    try {
      // Renew token for 15 additional days
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
      // If error is account disabled or invalid token, clear session
      if (err.message && (err.message.includes('deshabilitado') || err.message.includes('no válida') || err.message.includes('expirado'))) {
        await this.clearSession();
        return { loggedIn: false };
      }
    }

    // Fallback: If network is offline, keep logged in with cached user if available
    if (savedUser) {
      return { loggedIn: true, user: savedUser };
    }

    return { loggedIn: false };
  }
}

export const deviceService = new DeviceService();
