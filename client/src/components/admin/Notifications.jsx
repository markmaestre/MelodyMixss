import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import axiosInstance from "../../utils/axiosInstance";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const OrderDetails = ({ route, navigation }) => {
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('all');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(50))[0];

  useEffect(() => {
    const fetchCheckoutDetails = async () => {
      try {
        const response = await axiosInstance.get(`/checkout/${route.params.checkoutId}`);
        setCheckout(response.data);
        

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          })
        ]).start();
      } catch (error) {
        console.error('Error fetching checkout details:', error);
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutDetails();
  }, [route.params.checkoutId]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#FFC864';
      case 'Shipped': return '#1DB954'; // Spotify green
      case 'Delivered': return '#1DB954';
      case 'Cancelled': return '#FF6B6B';
      case 'Reviewed': return '#BA68C8';
      default: return '#FFFFFF';
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? 'all' : section);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#121212', '#181818']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading your order...</Text>
      </LinearGradient>
    );
  }

  if (!checkout) {
    return (
      <LinearGradient colors={['#121212', '#181818']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#1DB954" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity 
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const renderStatusTimeline = () => {
    const statuses = ['Pending', 'Shipped', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(checkout.status);
    
    return (
      <View style={styles.timeline}>
        {statuses.map((status, index) => {
          const isActive = index <= currentStatusIndex;
          const isLast = index === statuses.length - 1;
          
          return (
            <View key={status} style={styles.timelineItem}>
              <View style={[
                styles.timelineCircle,
                { backgroundColor: isActive ? '#1DB954' : '#333' }
              ]}>
                {isActive && <Ionicons name="checkmark" size={16} color="#000" />}
              </View>
              {!isLast && (
                <View style={[
                  styles.timelineLine,
                  { backgroundColor: index < currentStatusIndex ? '#1DB954' : '#333' }
                ]} />
              )}
              <Text style={[
                styles.timelineText,
                { color: isActive ? '#1DB954' : '#999' }
              ]}>
                {status}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#121212', '#181818']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Animated.View style={[
          styles.animatedContent,
          { opacity: fadeAnim, transform: [{ translateY }] }
        ]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Order Details</Text>
            <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert('Need help?', 'Contact our support team for assistance with your order.')}>
              <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <LinearGradient
            colors={['rgba(29, 185, 84, 0.8)', 'rgba(29, 185, 84, 0.2)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.orderBanner}
          >
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>Order #{checkout._id.substring(0, 8)}</Text>
              <Text style={styles.orderDate}>
                {new Date(checkout.createdAt).toLocaleDateString()} • {new Date(checkout.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(checkout.status) }]}>
              <Text style={styles.statusText}>{checkout.status}</Text>
            </View>
          </LinearGradient>
          
          {renderStatusTimeline()}
          
          <TouchableOpacity 
            style={styles.section}
            onPress={() => toggleSection('summary')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="receipt-outline" size={20} color="#1DB954" />
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>
              <Ionicons 
                name={expandedSection === 'summary' || expandedSection === 'all' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#999"
              />
            </View>
            
            {(expandedSection === 'summary' || expandedSection === 'all') && (
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={18} color="#999" />
                  <Text style={styles.infoText}>Payment: {checkout.paymentType}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={18} color="#999" />
                  <Text style={styles.infoText}>Total: <Text style={styles.highlightText}>₱{checkout.totalAmount.toFixed(2)}</Text></Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.section}
            onPress={() => toggleSection('customer')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="person-outline" size={20} color="#1DB954" />
                <Text style={styles.sectionTitle}>Customer Information</Text>
              </View>
              <Ionicons 
                name={expandedSection === 'customer' || expandedSection === 'all' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#999"
              />
            </View>
            
            {(expandedSection === 'customer' || expandedSection === 'all') && (
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#999" />
                  <Text style={styles.infoText}>{checkout.user?.username || 'User'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={18} color="#999" />
                  <Text style={styles.infoText}>{checkout.user?.email || 'No email'}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.section}
            onPress={() => toggleSection('shipping')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="location-outline" size={20} color="#1DB954" />
                <Text style={styles.sectionTitle}>Shipping Information</Text>
              </View>
              <Ionicons 
                name={expandedSection === 'shipping' || expandedSection === 'all' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#999"
              />
            </View>
            
            {(expandedSection === 'shipping' || expandedSection === 'all') && (
              <View style={styles.sectionContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={18} color="#999" />
                  <Text style={styles.infoText}>{checkout.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color="#999" />
                  <Text style={styles.infoText}>{checkout.phone}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="cart-outline" size={20} color="#1DB954" />
                <Text style={styles.sectionTitle}>Order Items</Text>
              </View>
            </View>
            
            <View style={styles.itemsContainer}>
              {checkout.items.map((item, index) => (
                <View key={index} style={styles.itemContainer}>
                  <View style={styles.itemImageContainer}>
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="musical-notes" size={20} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
                    <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                  ₱{(item.product?.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalAmount}>₱{checkout.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => Alert.alert('Contact Support', 'Our team is ready to help you with any questions about your order.')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  animatedContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 15,
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  goBackButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  helpButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderDate: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineLine: {
    position: 'absolute',
    top: 12,
    right: -50,
    width: 100,
    height: 2,
    zIndex: -1,
  },
  timelineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#282828',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  sectionContent: {
    padding: 15,
    paddingTop: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    color: '#CCCCCC',
  },
  highlightText: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
  itemsContainer: {
    paddingHorizontal: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemImageContainer: {
    marginRight: 15,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  itemQuantity: {
    color: '#999',
    fontSize: 14,
  },
  itemPrice: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1DB954',
  },
  supportButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 10,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default OrderDetails;