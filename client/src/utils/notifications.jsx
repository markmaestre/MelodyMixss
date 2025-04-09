import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import axiosInstance from './axiosInstance';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers the device for push notifications
 * @returns {Promise<string|null>} Push token or null if failed
 */

export const registerForPushNotifications = async () => {

  if (!Device.isDevice) {
    console.warn('Must use physical device for Push Notifications');
    return null;
  }

  try {

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      status = newStatus;
    }

    if (status !== 'granted') {
      Alert.alert(
        'Notification Permission',
        'Please enable notifications in settings to receive order updates',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return null;
    }
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })
    ).data;

    console.log('Push token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    Alert.alert('Error', 'Failed to set up notifications');
    return null;
  }
};

/**
 * Saves push token to server
 * @param {string} userId 
 * @param {string} token 
 * @returns {Promise<boolean>} True if successful
 */
export const savePushToken = async (userId, token) => {
  if (!userId || !token) {
    console.warn('Missing userId or token');
    return false;
  }

  try {
    await axiosInstance.post('/auth/savetoken', {
      userId,
      token,
    });
    console.log('Push token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving push token:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Sends a local notification
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 * @returns {Promise<boolean>} True if successful
 */
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, 
    });
    return true;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return false;
  }
};

/**
 * Sets up notification handlers
 * @param {React.RefObject} navigationRef 
 * @returns {Function} Cleanup function
 */
export const setupNotificationHandlers = (navigationRef) => {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;
    
    if (data?.screen && navigationRef.current) {
      navigationRef.current.navigate(data.screen, data.params);
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

/**
 * Sends a push notification via Expo's push service
 * @param {string} expoPushToken 
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 * @returns {Promise<boolean>} True if successful
 */
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) {
    console.warn('No push token provided');
    return false;
  }

  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    console.log('Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};