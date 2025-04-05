import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import axiosInstance from './axiosInstance';

// Discount Notification Utilities
export const sendDiscountLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          type: 'discount',
        },
        sound: true,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error('Discount local notification error:', error);
    return false;
  }
};

export const sendDiscountPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) {
    console.warn('No push token for discount notification');
    return false;
  }

  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        type: 'discount',
      },
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    return true;
  } catch (error) {
    console.error('Discount push notification error:', error);
    return false;
  }
};

export const notifyNewDiscount = async (productName, discountPercentage, userId, pushToken) => {
  const title = '🎉 New Discount Available!';
  const body = `Get ${discountPercentage}% off on ${productName}`;
  const data = {
    screen: 'Cart',
    params: { highlightDiscount: true }
  };

  try {
    if (pushToken) {
      await sendDiscountPushNotification(pushToken, title, body, data);
    }
    await sendDiscountLocalNotification(title, body, data);
    return true;
  } catch (error) {
    console.error('New discount notification failed:', error);
    return false;
  }
};

export const notifyAdminAboutDiscount = async (action, productName, discountPercentage, adminPushToken) => {
  const actions = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted'
  };

  const title = `Discount ${actions[action]}`;
  const body = `${productName} (${discountPercentage}%) discount ${actions[action]}`;
  const data = {
    screen: 'DiscountManagement'
  };

  try {
    if (adminPushToken) {
      await sendDiscountPushNotification(adminPushToken, title, body, data);
    }
    await sendDiscountLocalNotification(title, body, data);
    return true;
  } catch (error) {
    console.error('Admin discount notification failed:', error);
    return false;
  }
};

export const notifyExpiringDiscount = async (productName, discountPercentage, expiryDate, pushToken) => {
  const title = '⏰ Discount Ending Soon!';
  const body = `Last chance! ${discountPercentage}% off ${productName} ends ${new Date(expiryDate).toLocaleDateString()}`;
  const data = {
    screen: 'Products',
    params: { highlightDiscount: true }
  };

  try {
    if (pushToken) {
      await sendDiscountPushNotification(pushToken, title, body, data);
    }
    await sendDiscountLocalNotification(title, body, data);
    return true;
  } catch (error) {
    console.error('Expiring discount notification failed:', error);
    return false;
  }
};