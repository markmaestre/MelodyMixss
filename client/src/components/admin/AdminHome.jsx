import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StatusBar, 
  Dimensions,
  Animated
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { removeToken } from "../../utils/auth";
import { logoutUser } from "../../redux/slices/authSlice";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from "react-native-chart-kit";
import axiosInstance from '../../utils/axiosInstance';
import { LinearGradient } from 'expo-linear-gradient';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [ordersData, setOrdersData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-50))[0];

  const windowWidth = Dimensions.get('window').width;
  const isSmallDevice = windowWidth < 375;

  useEffect(() => {
    fetchData();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders data
      const ordersResponse = await axiosInstance.get("/checkout/all");
      setOrdersData(ordersResponse.data);
      
      // Fetch users data
      const usersResponse = await axiosInstance.get("/auth");
      setUsersData(usersResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await removeToken();
    dispatch(logoutUser());
    navigation.replace("Login");
  };

  const goToProducts = () => {
    navigation.navigate("Products"); 
  };

  const goToCheckoutManagement = () => {
    navigation.navigate("Status");
  };

  const goToDiscountManagement = () => {
    navigation.navigate("Discount");
  };

  const goToUserManagement = () => {
    navigation.navigate("Users");
  };

  // Process orders data for chart
  const getOrderStatusData = () => {
    const statusCounts = {
      "Pending": 0,
      "Shipped": 0,
      "Delivered": 0,
      "Cancelled": 0,
      "Reviewed": 0
    };

    ordersData.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts)
      }]
    };
  };

  // Process users data for line chart (user registration by month)
  const getUserRegistrationData = () => {
    const monthlyCounts = Array(12).fill(0);
    
    usersData.forEach(user => {
      const date = new Date(user.createdAt || Date.now());
      const month = date.getMonth();
      monthlyCounts[month]++;
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return {
      labels: monthNames,
      datasets: [
        {
          data: monthlyCounts,
          color: (opacity = 1) => `rgba(16, 90, 185, ${opacity})`, // Changed to professional blue
          strokeWidth: 2
        }
      ],
      legend: ["User Registrations"]
    };
  };

  // Professional color scheme chart config
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(16, 90, 185, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#105AB9'
    }
  };

  // Professional color scheme
  const pieChartColors = [
    '#105AB9', // Primary blue
    '#3498DB', // Light blue
    '#2E4053', // Dark blue-gray
    '#1ABC9C', // Teal
    '#566573'  // Gray
  ];

  // Custom pie chart data
  const getPieChartData = () => {
    const statusData = getOrderStatusData();
    return statusData.labels.map((label, index) => ({
      name: label,
      population: statusData.datasets[0].data[index],
      color: pieChartColors[index % pieChartColors.length],
      legendFontColor: '#333333',
      legendFontSize: 12
    }));
  };

  const screenWidth = Dimensions.get('window').width - 40;

  const adminActions = [
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: "people",
      color: "#105AB9",
      onPress: goToUserManagement
    },
    {
      title: "Manage Orders",
      description: "Process and track orders",
      icon: "cart",
      color: "#3498DB",
      onPress: goToCheckoutManagement
    },
    {
      title: "Manage Discounts",
      description: "Create promotional offers",
      icon: "pricetag",
      color: "#2E4053",
      onPress: goToDiscountManagement
    },
    {
      title: "Manage Products",
      description: "Update product inventory",
      icon: "cube",
      color: "#1ABC9C",
      onPress: goToProducts
    }
  ];

  const Card = ({ item, index }) => {
    const [isPressed, setIsPressed] = useState(false);
    const scaleAnim = useState(new Animated.Value(1))[0];
    
    const handlePressIn = () => {
      setIsPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 5,
        tension: 100,
        useNativeDriver: true
      }).start();
    };
    
    const handlePressOut = () => {
      setIsPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true
      }).start();
      
      // Navigate after animation
      item.onPress();
    };
    
    return (
      <Animated.View style={[
        styles.cardWrapper,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity 
          style={styles.card}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <LinearGradient
            colors={['#FFFFFF', `${item.color}20`]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardContent}>
              <View style={[styles.cardIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Summary cards with key metrics
  const SummaryCard = ({ title, value, icon, color }) => (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );

  const renderDashboardContent = () => (
    <>
      {/* Summary Cards */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.summaryContainer}>
          <SummaryCard 
            title="Total Orders" 
            value={ordersData.length || 0} 
            icon="document-text" 
            color="#105AB9" 
          />
          <SummaryCard 
            title="Total Users" 
            value={usersData.length || 0} 
            icon="people" 
            color="#3498DB" 
          />
          <SummaryCard 
            title="Pending Orders" 
            value={ordersData.filter(order => order.status === "Pending").length || 0} 
            icon="time" 
            color="#2E4053" 
          />
          <SummaryCard 
            title="This Month" 
            value={ordersData.filter(order => {
              const now = new Date();
              const orderDate = new Date(order.createdAt);
              return orderDate.getMonth() === now.getMonth() && 
                     orderDate.getFullYear() === now.getFullYear();
            }).length || 0} 
            icon="calendar" 
            color="#1ABC9C" 
          />
        </View>
      </Animated.View>

      {/* Order Status Pie Chart */}
      <Animated.View style={[styles.chartContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.chartTitle}>Order Status Distribution</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#105AB9" />
          </View>
        ) : ordersData.length > 0 ? (
          <View>
            <PieChart
              data={getPieChartData()}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend={true}
              style={styles.chart}
            />
            <View style={styles.chartActions}>
              <TouchableOpacity style={styles.chartActionButton}>
                <Ionicons name="download-outline" size={16} color="#105AB9" />
                <Text style={styles.chartActionText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartActionButton}>
                <Ionicons name="expand-outline" size={16} color="#105AB9" />
                <Text style={styles.chartActionText}>Full View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={40} color="#999" />
            <Text style={styles.noDataText}>No order data available</Text>
          </View>
        )}
      </Animated.View>

      {/* User Registration Line Chart */}
      <Animated.View style={[styles.chartContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.chartTitle}>User Registrations by Month</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#105AB9" />
          </View>
        ) : usersData.length > 0 ? (
          <View>
            <LineChart
              data={getUserRegistrationData()}
              width={screenWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 90, 185, ${opacity})`,
                strokeWidth: 2,
                fillShadowGradientFrom: "#105AB9",
                fillShadowGradientTo: "#105AB930",
              }}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={true}
              fromZero
            />
            <View style={styles.chartActions}>
              <TouchableOpacity style={styles.chartActionButton}>
                <Ionicons name="download-outline" size={16} color="#105AB9" />
                <Text style={styles.chartActionText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chartActionButton}>
                <Ionicons name="expand-outline" size={16} color="#105AB9" />
                <Text style={styles.chartActionText}>Full View</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="people-outline" size={40} color="#999" />
            <Text style={styles.noDataText}>No user data available</Text>
          </View>
        )}
      </Animated.View>
    </>
  );

  const renderActionsContent = () => (
    <Animated.View style={[styles.actionsWrapper, { opacity: fadeAnim }]}>
      <Text style={styles.sectionTitle}>Administrative Actions</Text>
      <View style={styles.cardContainer}>
        {adminActions.map((item, index) => (
          <Card key={index} item={item} index={index} />
        ))}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with logout button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Welcome, {user?.name}</Text>
          <Text style={styles.roleText}>Administrator Dashboard</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh-outline" size={20} color="#105AB9" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name="stats-chart" 
            size={20} 
            color={activeTab === 'dashboard' ? "#105AB9" : "#999"} 
          />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'actions' && styles.activeTabButton]}
          onPress={() => setActiveTab('actions')}
        >
          <Ionicons 
            name="grid" 
            size={20} 
            color={activeTab === 'actions' ? "#105AB9" : "#999"} 
          />
          <Text style={[styles.tabText, activeTab === 'actions' && styles.activeTabText]}>
            Actions
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#105AB9" />
          </View>
        ) : (
          <>
            {activeTab === 'dashboard' ? renderDashboardContent() : renderActionsContent()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E4053',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#105AB9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#105AB9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#666',
  },
  activeTabText: {
    color: '#105AB9',
    fontWeight: 'bold',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E4053',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E4053',
    marginBottom: 16,
    marginTop: 8,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E4053',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
    alignSelf: 'center',
  },
  chartActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  chartActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 12,
  },
  chartActionText: {
    fontSize: 12,
    color: '#105AB9',
    marginLeft: 4,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  actionsWrapper: {
    paddingTop: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: '#2E4053',
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  }
});

export default AdminDashboard;