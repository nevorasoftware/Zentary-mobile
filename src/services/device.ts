// Device Service for Zentary Mobile
// Manages persistent device identification and long-lived 15-day session storage across Web and Native platforms

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { apiService, isAuthRejection, UserProfile } from './api';

const DEVICE_ID_KEY = 'zentary_device_id_v1';
const SESSION_TOKEN_KEY = 'zentary_session_token_v1';
const SESSION_USER_KEY = 'zentary_session_user_v1';

// Native storage paths via expo-file-system
const NATIVE_DIR = FileSystem.documentDirectory || '';
// v1 guardaba el token en texto plano; v2 solo guarda el usuario (el token va en SecureStore)
const LEGACY_SESSION_FILE = NATIVE_DIR ? `${NATIVE_DIR}zentary_session_store_v1.json` : '';
const SESSION_FILE = NATIVE_DIR ? `${NATIVE_DIR}zentary_session_store_v2.json` : '';
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
   * Secure token storage (Keystore/Keychain). Not available on Web
   */
  private async readSecureToken(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    } catch (e) {}
    return null;
  }

  private async writeSecureToken(token: string): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
      return true;
    } catch (e) {}
    return false;
  }

  private async removeSecureToken(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    } catch (e) {}
  }

  private async removeLegacySessionFile(): Promise<void> {
    try {
      if (LEGACY_SESSION_FILE) {
        await FileSystem.deleteAsync(LEGACY_SESSION_FILE, { idempotent: true });
      }
    } catch (e) {}
  }

  /**
   * Migrates a session saved by an older version (token in plain file) to SecureStore.
   * Always removes the legacy file. Returns false if the token could not be secured.
   */
  private async migrateLegacySession(): Promise<boolean> {
    if (Platform.OS === 'web' || !LEGACY_SESSION_FILE) return true;

    let legacy: { token?: string; user?: UserProfile } | null = null;
    try {
      const info = await FileSystem.getInfoAsync(LEGACY_SESSION_FILE);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(LEGACY_SESSION_FILE);
        if (content && content.trim()) {
          legacy = JSON.parse(content.trim());
        }
      }
    } catch (e) {}

    await this.removeLegacySessionFile();

    if (!legacy || !legacy.token) return true;

    const existing = await this.readSecureToken();
    if (!existing) {
      const saved = await this.writeSecureToken(legacy.token);
      if (!saved) return false;
    }

    if (legacy.user) {
      if (existing) {
        // Do not overwrite a v2 file that already exists
        try {
          const info = await FileSystem.getInfoAsync(SESSION_FILE);
          if (info.exists) return true;
        } catch (e) {}
      }
      const payload = JSON.stringify({ user: legacy.user, savedAt: Date.now() });
      await this.writeItem('session_combined', payload, SESSION_FILE);
    }
    return true;
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

    // On native the token goes to SecureStore; the file only keeps the user
    const payload =
      Platform.OS === 'web'
        ? JSON.stringify({ token, user, savedAt: Date.now() })
        : JSON.stringify({ user, savedAt: Date.now() });
    await this.writeSecureToken(token);
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

    await this.removeSecureToken();
    await this.removeItem(SESSION_TOKEN_KEY, '');
    await this.removeItem(SESSION_USER_KEY, '');
    await this.removeItem('session_combined', SESSION_FILE);
    await this.removeLegacySessionFile();

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
      // Session from an older version: move the token to SecureStore and drop the plain file
      const migrated = await this.migrateLegacySession();
      if (!migrated) {
        return { loggedIn: false };
      }

      // Try combined file first (Native FileSystem)
      const combinedStr = await this.readItem('session_combined', SESSION_FILE);
      if (combinedStr) {
        try {
          const parsed = JSON.parse(combinedStr);
          // On native the file only has the user; the token comes from SecureStore
          if (parsed.user) {
            savedUser = parsed.user;
            if (parsed.token) savedToken = parsed.token;
          }
        } catch (e) {}
      }
    }

    if (!savedToken) {
      savedToken = await this.readSecureToken();
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
      // Only clear session if account is explicitly disabled by administration
      if ((err.message && err.message.includes('deshabilitado')) || isAuthRejection(err.status, err.code)) {
        await this.clearSession();
        return { loggedIn: false };
      }
    }

    // Fallback: Keep logged in with cached session
    if (savedUser && savedToken) {
      apiService.setAuthToken(savedToken);
      return { loggedIn: true, user: savedUser };
    }

    return { loggedIn: false };
  }
}

export const deviceService = new DeviceService();
