import React, { useEffect, useRef } from "react";
import { Provider, useDispatch } from "react-redux";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { NavigationContainer } from '@react-navigation/native';
import store from "./src/redux/store";
import Navigator from "./src/navigation/Navigator";
import { loadCartFromStorage } from "./src/redux/slices/cartSlice";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const MainApp = () => {
  const dispatch = useDispatch();
  const navigationRef = useRef();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
 
    dispatch(loadCartFromStorage());
    setupNotifications();
    
    return () => {
  
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [dispatch]);

  const setupNotifications = async () => {
    await registerForPushNotifications();
    
    
    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotification);
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  };

  const handleNotification = (notification) => {
    console.log("Notification received:", notification);
  };

  const handleNotificationResponse = (response) => {
    const { data } = response.notification.request.content;
    if (data?.checkoutId && navigationRef.current) {
      navigationRef.current.navigate('Notif', { checkoutId: data.checkoutId });
    }
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      Alert.alert("Error", "Must use a physical device for push notifications.");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert("Permission required", "Enable notifications to receive alerts.");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };
  return (
    <NavigationContainer ref={navigationRef}>
      <Navigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}