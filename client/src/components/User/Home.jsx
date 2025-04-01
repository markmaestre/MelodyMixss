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
  ImageBackground
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { removeToken } from '../../utils/auth';
import { logoutUser } from '../../redux/slices/authSlice';
import axiosInstance from "../../utils/axiosInstance";

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
  const [categories, setCategories] = useState([
    { id: 1, title: "Clothing", icon: "tshirt" },
    { id: 2, title: "Electronics", icon: "tv" },
    { id: 3, title: "Accessories", icon: "watch" },
    { id: 4, title: "Home Goods", icon: "home" },
    { id: 5, title: "Books", icon: "book" },
    { id: 6, title: "Sports", icon: "basketball-ball" }
  ]);
  
  const [topPicks, setTopPicks] = useState([
    { id: 1, title: "Summer Collection" },
    { id: 2, title: "New Arrivals" },
    { id: 3, title: "Best Sellers" }
  ]);

  // Fetch recent orders when component mounts or user changes
  useEffect(() => {
    if (user?._id) {
      fetchRecentOrders();
    }
  }, [user?._id]);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/checkout/history/${user._id}`);
      setRecentOrders(response.data.slice(0, 3)); // Get only the 3 most recent orders
    } catch (err) {
      console.error('Error fetching recent orders:', err);
      setError('Failed to load recent orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // This ensures drawer works after coming back from another screen
  useFocusEffect(
    React.useCallback(() => {
      setDrawerInitialized(true);
      return () => {
        setDrawerInitialized(false);
      };
    }, [])
  );

  // Handle back button press
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
    
    // Force drawer to reset by closing first
    drawerRef.current.closeDrawer();
    
    // Then open after a small delay
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
        <View style={styles.profileCircle}>
          <FontAwesomeIcon name="user" size={40} color="#1DB954" />
        </View>
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
            icon: <MaterialIcon name="search" size={22} color="#fff" />, 
            text: 'Search', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Search');
            }
          },
          { 
            icon: <MaterialIcon name="person" size={22} color="#fff" />, 
            text: 'Profile', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Profile');
            }
          },
          { 
            icon: <MaterialIcon name="shopping-cart" size={22} color="#fff" />, 
            text: 'My Cart', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('CartScreen');
            }
          },
          { 
            icon: <FontAwesomeIcon name="shopping-bag" size={20} color="#fff" />, 
            text: 'Orders', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Orders');
            }
          },
          { 
            icon: <FontAwesomeIcon name="heart" size={20} color="#fff" />, 
            text: 'Wishlist', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Wishlist');
            }
          },
          { 
            icon: <Icon name="settings" size={22} color="#fff" />, 
            text: 'Settings', 
            onPress: () => {
              closeDrawer();
              navigation.navigate('Settings');
            }
          }
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
            onPress={() => navigation.navigate('Shop')}
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
        {topPicks.map((item, index) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.topPickCard}
            onPress={() => navigation.navigate('Collection', { id: item.id })}
          >
            <View style={styles.topPickContent}>
              <Text style={styles.topPickTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoriesSection = () => (
    <View style={styles.categoriesContainer}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => (
          <TouchableOpacity 
            key={category.id}
            style={styles.categoryCard}
            onPress={() => navigation.navigate('Category', { id: category.id })}
          >
            <View style={styles.categoryIconContainer}>
              <FontAwesomeIcon name={category.icon} size={22} color="#1DB954" />
            </View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Only render DrawerLayoutAndroid when initialized
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
      key={`drawer-${drawerInitialized}`} // Force re-render when initialized
      drawerWidth={width * 0.8}
      drawerPosition="left"
      drawerLockMode="unlocked"
      renderNavigationView={renderDrawer}
      statusBarBackgroundColor="transparent"
      onDrawerOpen={() => console.log('Drawer opened')}
      onDrawerClose={() => console.log('Drawer closed')}
      onDrawerStateChanged={(state) => console.log('Drawer state:', state)}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDrawer}>
            <Icon name="menu" size={24} color="#e0e0e0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ShopApp</Text>
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
          {/* Greeting section */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Good day, {user?.name?.split(' ')[0] || 'User'}
            </Text>
            <Text style={styles.subGreetingText}>
              What would you like to buy today?
            </Text>
          </View>

          {/* Top Picks */}
          {renderTopPicksSection()}

          {/* Categories section */}
          {renderCategoriesSection()}

          {/* Recent Orders */}
          <View style={styles.recentActivityContainer}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {renderRecentActivity()}
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar - Spotify-like */}
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
          
          <TouchableOpacity style={styles.bottomNavItem} onPress={() => navigation.navigate('CartScreen')}>
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
    paddingBottom: 80, // Account for bottom nav
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
  
  // Top Picks section
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
    height: 160,
    marginRight: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  topPickContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(29, 185, 84, 0.2)', // Slight green tint
  },
  topPickTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Categories section
  categoriesContainer: {
    marginBottom: 25,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
  },
  categoryCard: {
    width: width / 3 - 20,
    marginHorizontal: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#212121',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Recent Orders section
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
  
  // Bottom Navigation
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
  
  // Drawer styles
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
  profileCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
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