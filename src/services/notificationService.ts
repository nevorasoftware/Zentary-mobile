// Notification Service for Zentary Mobile
// Supports Native System Notifications (Android System Tray / Lock Screen / Status Bar)
// matching PedidosYa, Gmail, CapCut notifications style.

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { localDateISO } from '../utils/dates';

export interface NotificationConfig {
  enabled: boolean;
  frequency: 'DAILY' | 'EVERY_2_DAYS' | 'WEEKLY';
  reminderTime: string; // e.g. '09:00 AM'
  soundEnabled: boolean;
  lastNotifiedDate?: string; // YYYY-MM-DD
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'PAYMENT_REMINDER' | 'ANNOUNCEMENT' | 'VISIT';
  date: string;
  read: boolean;
  amount?: number;
  dueDate?: string;
}

const CONFIG_KEY = 'zentary_notification_config_v1';
const NATIVE_DIR = FileSystem.documentDirectory || '';
const CONFIG_FILE = NATIVE_DIR ? `${NATIVE_DIR}zentary_notif_config.json` : '';

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  frequency: 'DAILY',
  reminderTime: '09:00 AM',
  soundEnabled: true,
};

class NotificationService {
  private currentConfig: NotificationConfig = DEFAULT_CONFIG;
  private notificationsModule: any = null;

  constructor() {
    this.initNativeNotifications();
  }

  /**
   * Initializes native system notification handlers and Android Channels
   */
  private async initNativeNotifications() {
    try {
      const Notifications = require('expo-notifications');
      this.notificationsModule = Notifications;

      // Configure default handler to show notification banner, sound & badge
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Set up Android High Priority Channel for System Notification Drawer
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('zentary-payments', {
          name: 'Recordatorios de Pago Zentary',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2B82FB',
          sound: 'default',
        });
      }
    } catch (e) {
      console.warn('Native Notifications module notice:', e);
    }
  }

  /**
   * Requests user permission for Android / iOS System Tray Notifications
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (this.notificationsModule) {
        const { status: existingStatus } = await this.notificationsModule.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await this.notificationsModule.requestPermissionsAsync();
          finalStatus = status;
        }
        return finalStatus === 'granted';
      }
    } catch (e) {}
    return false;
  }

  /**
   * Triggers a Native System Notification on Android / iOS status bar (like PedidosYa / Gmail)
   */
  async triggerNativeSystemNotification(title: string, body: string, data: any = {}) {
    try {
      if (this.notificationsModule) {
        await this.notificationsModule.scheduleNotificationAsync({
          content: {
            title: title,
            body: body,
            sound: 'default',
            data: data,
            badge: 1,
            color: '#2B82FB',
          },
          trigger: null, // Triggers immediately in status bar
        });
      }
    } catch (e) {
      console.warn('Could not fire native notification:', e);
    }
  }

  /**
   * Loads saved notification preferences
   */
  async getConfig(): Promise<NotificationConfig> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(CONFIG_KEY);
        if (stored) {
          this.currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
          return this.currentConfig;
        }
      }
    } catch (e) {}

    try {
      if (CONFIG_FILE) {
        const info = await FileSystem.getInfoAsync(CONFIG_FILE);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(CONFIG_FILE);
          if (content) {
            this.currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(content) };
            return this.currentConfig;
          }
        }
      }
    } catch (e) {}

    return this.currentConfig;
  }

  /**
   * Saves updated notification preferences
   */
  async saveConfig(config: Partial<NotificationConfig>): Promise<NotificationConfig> {
    const updated = { ...this.currentConfig, ...config };
    this.currentConfig = updated;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
      }
    } catch (e) {}

    try {
      if (CONFIG_FILE) {
        await FileSystem.writeAsStringAsync(CONFIG_FILE, JSON.stringify(updated));
      }
    } catch (e) {}

    return updated;
  }
}

export const notificationService = new NotificationService();
