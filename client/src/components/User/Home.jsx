import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet,
  DrawerLayoutAndroid,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { removeToken } from '../../utils/auth';
import { logoutUser } from '../../redux/slices/authSlice';
import axiosInstance from "../../utils/axiosInstance";
import * as Notifications from 'expo-notifications';

// Icons
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const drawerRef = useRef(null);
  const [drawerInitialized, setDrawerInitialized] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  
  const [topPicks, setTopPicks] = useState([
    { 
      id: 1, 
      title: "Summer Collection",
      description: "Fresh styles for the warm season",
      image: require('../../assets/merch/tshirt.jpg') 
    },
    { 
      id: 2, 
      title: "New Arrivals",
      description: "Discover our latest products",
      image: require('../../assets/merch/hoodie.jpg') 
    },
    { 
      id: 3, 
      title: "Best Sellers",
      description: "Fan favorites you'll love",
      image: require('../../assets/merch/poster.jpg') 
    }
  ]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      sendWelcomeNotification(token);
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { screen, params } = response.notification.request.content.data;
      if (screen) {
        navigation.navigate(screen, params);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchRecentOrders();
      checkForDiscounts();
    }
  }, [user?._id]);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/checkout/history/${user._id}`);
      setRecentOrders(response.data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching recent orders:', err);
      setError('Failed to load recent orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Push notifications need the appropriate permissions.');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return '';
    }
  };

  const sendWelcomeNotification = async (token) => {
    try {
      const title = '👋 Welcome to MelodyMix!';
      const body = 'Check out our latest discounts and special offers!';
      const data = {
        screen: 'discountNotif',
        params: { highlightDiscount: true }
      };

      if (token) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: true,
            vibrate: [0, 250, 250, 250],
          },
          trigger: { seconds: 2 },
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: { seconds: 2 },
      });
    } catch (error) {
      console.error('Error sending welcome notification:', error);
    }
  };

  const checkForDiscounts = async () => {
    try {
      const response = await axiosInstance.get('/discounts');
      const activeDiscounts = response.data;
      
      if (activeDiscounts.length > 0) {
        const biggestDiscount = activeDiscounts.reduce((prev, current) => 
          (prev.discountPercentage > current.discountPercentage) ? prev : current
        );
        
        const title = '🔥 Hot Discount Available!';
        const body = `Don't miss ${biggestDiscount.discountPercentage}% off on ${biggestDiscount.name}`;
        const data = {
          screen: 'discountNotif',
          params: { productId: biggestDiscount._id }
        };

        if (expoPushToken) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data,
              sound: true,
            },
            trigger: { seconds: 5 },
          });
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: true,
          },
          trigger: { seconds: 5 },
        });
      }
    } catch (error) {
      console.error('Error checking for discounts:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setDrawerInitialized(true);
      return () => {
        setDrawerInitialized(false);
      };
    }, [])
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (drawerRef.current?.state?.drawerOpened) {
          drawerRef.current.closeDrawer();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, []);

  const handleLogout = async () => {
    await removeToken();
    dispatch(logoutUser());
    navigation.replace('Login');
  };

  const toggleDrawer = () => {
    if (!drawerRef.current) return;
    drawerRef.current.closeDrawer();
    setTimeout(() => {
      if (drawerRef.current) {
        drawerRef.current.openDrawer();
      }
    }, 50);
  };

  const closeDrawer = () => {
    if (drawerRef.current) {
      drawerRef.current.closeDrawer();
    }
  };

  const renderDrawer = () => (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <TouchableOpacity 
          onPress={() => {
            closeDrawer();
            navigation.navigate('EditProfile');
          }}
          activeOpacity={0.8}
        >
          {user?.image ? (
            <Image 
              source={{ uri: user.image }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileCircle}>
              <FontAwesomeIcon name="user" size={40} color="#1DB954" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.drawerHeaderText}>{user?.name || 'User'}</Text>
        <Text style={styles.drawerHeaderEmail}>{user?.email || 'user@example.com'}</Text>
      </View>
      
      <View style={styles.drawerNavigation}>
        {[
          { 
            icon: <Icon name="home" size={22} color="#1DB954" />, 
            text: 'Home', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Home');
            }
          },
          { 
            icon: <MaterialIcon name="person" size={22} color="#fff" />, 
            text: 'Profile', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('EditProfile');
            }
          },
          { 
            icon: <MaterialIcon name="shopping-cart" size={22} color="#fff" />, 
            text: 'Buy Now', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Cart');
            }
          },
          { 
            icon: <FontAwesomeIcon name="shopping-bag" size={20} color="#fff" />, 
            text: 'Orders', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('CartHistory');
            }
          },
          { 
            icon: <MaterialIcon name="rate-review" size={22} color="#fff" />, 
            text: 'Reviews', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('ReviewsHistory');
            }
          },
        ].map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.drawerNavItem}
            onPress={item.onPress}
          >
            {item.icon}
            <Text style={styles.drawerNavItemText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => {
          closeDrawer();
          setTimeout(() => handleLogout(), 300);
        }}
      >
        <Icon name="log-out" size={20} color="#ff5252" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderRecentActivity = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1DB954" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.activityCard}>
          <View style={styles.activityCardHeader}>
            <MaterialIcon name="error-outline" size={20} color="#ff5252" />
            <Text style={styles.activityCardTitle}>Error</Text>
          </View>
          <Text style={styles.activityCardContent}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchRecentOrders}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (recentOrders.length === 0) {
      return (
        <View style={styles.emptyOrdersCard}>
          <MaterialIcon name="shopping-bag" size={40} color="#424242" />
          <Text style={styles.emptyOrdersText}>No orders yet</Text>
          <Text style={styles.emptyOrdersSubtext}>
            Your recent purchases will appear here
          </Text>
          <TouchableOpacity 
            style={styles.shopNowButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return recentOrders.map((order, index) => (
      <TouchableOpacity 
        key={index}
        style={[styles.activityCard, index !== 0 && styles.cardMargin]}
        onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
      >
        <View style={styles.activityCardHeader}>
          <MaterialIcon name="shopping-bag" size={20} color="#e0e0e0" />
          <Text style={styles.activityCardTitle}>Order #{order._id.slice(-6).toUpperCase()}</Text>
        </View>
        <Text style={styles.activityCardContent}>
          Date: {formatDate(order.createdAt)}
        </Text>
        <Text style={styles.activityCardContent}>
          Total: ₱{order.totalAmount.toFixed(2)}
        </Text>
        <View style={styles.orderStatusContainer}>
          <View style={[
            styles.statusIndicator,
            order.status === 'Delivered' && styles.statusDeliveredIndicator,
            order.status === 'Pending' && styles.statusPendingIndicator,
            order.status === 'Shipped' && styles.statusShippedIndicator,
            order.status === 'Cancelled' && styles.statusCancelledIndicator,
          ]} />
          <Text style={[
            styles.orderStatus,
            order.status === 'Delivered' && styles.statusDelivered,
            order.status === 'Pending' && styles.statusPending,
            order.status === 'Shipped' && styles.statusShipped,
            order.status === 'Cancelled' && styles.statusCancelled,
          ]}>
            {order.status}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const renderTopPicksSection = () => (
    <View style={styles.topPicksContainer}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>Top Picks For You</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.topPicksScrollContent}
      >
        {topPicks.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.topPickCard}
            onPress={() => navigation.navigate('Collection', { id: item.id })}
          >
            <Image 
              source={item.image} 
              style={styles.topPickImage}
              resizeMode="cover"
            />
            <View style={styles.topPickContent}>
              <Text style={styles.topPickTitle}>{item.title}</Text>
              <Text style={styles.topPickDescription}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (!drawerInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity>
            <Icon name="menu" size={24} color="#1DB954" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ShopApp</Text>
          <TouchableOpacity>
            <Icon name="bell" size={24} color="#e0e0e0" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      key={`drawer-${drawerInitialized}`}
      drawerWidth={width * 0.8}
      drawerPosition="left"
      drawerLockMode="unlocked"
      renderNavigationView={renderDrawer}
      statusBarBackgroundColor="transparent"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDrawer}>
            <Icon name="menu" size={24} color="#e0e0e0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MelodyMix</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Icon name="search" size={22} color="#e0e0e0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}>
              <Icon name="bell" size={22} color="#e0e0e0" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Good day, {user?.name?.split(' ')[0] || 'User'}
            </Text>
            <Text style={styles.subGreetingText}>
              What would you like to buy today?
            </Text>
          </View>

          {renderTopPicksSection()}

          <View style={styles.recentActivityContainer}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CartHistory')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {renderRecentActivity()}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('Home')}>
            <Icon name="home" size={22} color="#1DB954" />
            <Text style={[styles.bottomNavText, styles.bottomNavTextActive]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('Search')}>
            <Icon name="search" size={22} color="#909090" />
            <Text style={styles.bottomNavText}>Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('Categories')}>
            <Icon name="grid" size={22} color="#909090" />
            <Text style={styles.bottomNavText}>Categories</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('Cart')}>
            <Icon name="shopping-cart" size={22} color="#909090" />
            <Text style={styles.bottomNavText}>Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1DB954',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIconButton: {
    marginLeft: 18,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  greetingContainer: {
    marginTop: 20,
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subGreetingText: {
    fontSize: 16,
    color: '#b3b3b3',
    marginTop: 4,
  },
  topPicksContainer: {
    marginBottom: 25,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1DB954',
    fontWeight: '600',
  },
  topPicksScrollContent: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  topPickCard: {
    width: width * 0.7,
    height: 180,
    marginRight: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  topPickImage: {
    width: '100%',
    height: '60%',
  },
  topPickContent: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    height: '40%',
    justifyContent: 'center',
  },
  topPickTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  topPickDescription: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  recentActivityContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  activityCard: {
    backgroundColor: '#212121',
    borderRadius: 10,
    padding: 15,
  },
  cardMargin: {
    marginTop: 15,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityCardTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  activityCardContent: {
    color: '#b3b3b3',
    marginBottom: 5,
  },
  orderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  orderStatus: {
    fontWeight: '500',
  },
  statusDelivered: {
    color: '#1DB954',
  },
  statusPending: {
    color: '#ffc107',
  },
  statusShipped: {
    color: '#3498db',
  },
  statusCancelled: {
    color: '#ff5252',
  },
  statusDeliveredIndicator: {
    backgroundColor: '#1DB954',
  },
  statusPendingIndicator: {
    backgroundColor: '#ffc107',
  },
  statusShippedIndicator: {
    backgroundColor: '#3498db',
  },
  statusCancelledIndicator: {
    backgroundColor: '#ff5252',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#1DB954',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyOrdersCard: {
    backgroundColor: '#212121',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  emptyOrdersText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyOrdersSubtext: {
    color: '#b3b3b3',
    textAlign: 'center',
    marginBottom: 20,
  },
  shopNowButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  shopNowButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#212121',
    flexDirection: 'row',
    borderTopColor: '#333',
    borderTopWidth: 1,
  },
  bottomNavItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavText: {
    color: '#909090',
    fontSize: 12,
    marginTop: 4,
  },
  bottomNavTextActive: {
    color: '#1DB954',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  drawerHeader: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#212121',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#1DB954',
  },
  profileCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#1DB954',
  },
  drawerHeaderText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerHeaderEmail: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  drawerNavigation: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  drawerNavItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#ffffff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  logoutButtonText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#ff5252',
  },
});

export default HomeScreen;