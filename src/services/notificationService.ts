// Notification Service for Zentary Mobile
// Handles parametrizable payment reminder notifications and alerts

import * as FileSystem from 'expo-file-system';

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

  /**
   * Checks if a daily/parametrizable payment reminder should be triggered for pending current month payments
   */
  async checkPendingPaymentReminder(payments: Array<{ id: string; concept: string; amount: number; dueDate: string; status: 'PENDING' | 'PAID' | 'OVERDUE' }>): Promise<AppNotification | null> {
    const config = await this.getConfig();
    if (!config.enabled) {
      return null;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check frequency restriction
    if (config.frequency === 'DAILY' && config.lastNotifiedDate === todayStr) {
      // Already notified today, return persistent banner reminder for UI
    }

    // Find pending payment for current month
    const pendingPayment = payments.find((p) => p.status === 'PENDING' || p.status === 'OVERDUE');

    if (!pendingPayment) {
      return null;
    }

    // Update lastNotifiedDate
    await this.saveConfig({ lastNotifiedDate: todayStr });

    return {
      id: `notif-pay-${pendingPayment.id}`,
      title: '💳 Recordatorio de Pago Pendiente',
      body: `Tienes un pago pendiente de $${pendingPayment.amount.toFixed(2)} por "${pendingPayment.concept}". Vence el ${pendingPayment.dueDate}.`,
      type: 'PAYMENT_REMINDER',
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      amount: pendingPayment.amount,
      dueDate: pendingPayment.dueDate,
    };
  }
}

export const notificationService = new NotificationService();
