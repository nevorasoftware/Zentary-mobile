import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from './api';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token: string | null = null;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Permission not granted for push notifications.');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'aef38c4b-42a6-4eb0-b8ed-7ea60eac6976';
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = tokenData.data;
      console.log('[NotificationService] Expo Push Token obtained:', token);

      if (token) {
        const res = await apiService.registerPushToken(token);
        console.log('[NotificationService] Push token registered on backend:', res);
      }
    } catch (error) {
      console.error('[NotificationService] Error fetching Expo Push Token:', error);
    }
  } else {
    console.log('[NotificationService] Physical device required for push notifications (emulator detected)');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default Channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2B82FB',
      sound: 'default',
    });
  }

  return token;
};
