import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import axiosInstance from "../../utils/axiosInstance";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ProductDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const navigation = useNavigation();

  const fetchDiscounts = async () => {
    setLoading(true);
    fadeAnim.setValue(0);
    
    try {
      const response = await axiosInstance.get('/discounts/active/now'); 
      setDiscounts(response.data);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }).start();
      
    } catch (error) {
      console.error('Error fetching discounts:', error);
      let errorMessage = 'Failed to load discount details';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Discount endpoint not found. Please check the API URL.';
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Check your network connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscounts();
  };

  const getStatus = (discount) => {
    if (!discount.isActive) return 'Inactive';
    if (discount.endDate && new Date(discount.endDate) < new Date()) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return '#1DB954'; // Spotify green
      case 'Inactive': return '#FF6B6B';
      case 'Expired': return '#F9A825';
      default: return '#000000';
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('Cart', { 
      productId: product._id,
      productName: product.name,
      productPrice: product.price
    });
  };

  const toggleExpandCard = (index) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  const placeholderImages = [
    'https://via.placeholder.com/150/1DB954/FFFFFF?text=Music',
    'https://via.placeholder.com/150/191414/FFFFFF?text=Albums',
    'https://via.placeholder.com/150/535353/FFFFFF?text=Podcasts',
    'https://via.placeholder.com/150/B3B3B3/FFFFFF?text=Radio'
  ];

  const getRandomImage = () => {
    const index = Math.floor(Math.random() * placeholderImages.length);
    return placeholderImages[index];
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateTimeLeft = (endDate) => {
    if (!endDate) return null;
    
    const difference = new Date(endDate) - new Date();
    if (difference <= 0) return 'Ended';
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    return `${hours} hour${hours !== 1 ? 's' : ''} left`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading discounts...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#121212', '#282828', '#121212']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DB954']}
            tintColor="#1DB954"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Hot Discounts</Text>
          <View style={styles.subtitleContainer}>
            <FontAwesome5 name="spotify" size={16} color="#1DB954" />
            <Text style={styles.subtitle}>{discounts.length} products on sale</Text>
          </View>
        </View>
        
        {discounts.length === 0 ? (
          <Animated.View 
            style={[styles.emptyContainer, {opacity: fadeAnim}]}
          >
            <Ionicons name="musical-notes" size={64} color="#1DB954" />
            <Text style={styles.noDiscountsText}>No active discounts available</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>Check Again</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{opacity: fadeAnim}}>
            {discounts.map((discount, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.discountCard,
                  expandedCard === index && styles.expandedCard
                ]}
                onPress={() => toggleExpandCard(index)}
                activeOpacity={0.9}
              >
                <View style={styles.discountHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(getStatus(discount)) }]}>
                    <Text style={styles.statusText}>{getStatus(discount)}</Text>
                  </View>
                  <Text style={styles.discountPercentage}>
                    {discount.discountPercentage}% OFF
                  </Text>
                </View>
                
                {discount.product && (
                  <View style={styles.productContainer}>
                    <Image 
                      source={{ uri: getRandomImage() }} 
                      style={styles.productImage}
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{discount.product.name}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>
                          ₱{discount.product.price.toFixed(2)}
                        </Text>
                        <Text style={styles.discountedPrice}>
                          ₱{(discount.product.price * (1 - discount.discountPercentage/100)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {expandedCard === index && (
                  <View style={styles.expandedContent}>
                    <View style={styles.datesContainer}>
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar-outline" size={16} color="#B3B3B3" />
                        <Text style={styles.dateText}>
                          Started: {formatDate(discount.startDate)}
                        </Text>
                      </View>
                      {discount.endDate && (
                        <View style={styles.dateRow}>
                          <Ionicons name="timer-outline" size={16} color="#B3B3B3" />
                          <Text style={styles.dateText}>
                            Ends: {formatDate(discount.endDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {discount.endDate && (
                      <View style={styles.timeLeftContainer}>
                        <Text style={styles.timeLeftText}>
                          {calculateTimeLeft(discount.endDate)}
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={() => discount.product && handleProductPress(discount.product)}
                    >
                      <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.cardFooter}>
                  <Text style={styles.expandPrompt}>
                    {expandedCard === index ? 'Show less' : 'Show more'}
                  </Text>
                  <Ionicons 
                    name={expandedCard === index ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#B3B3B3" 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDiscountsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#B3B3B3',
    marginLeft: 8,
  },
  discountCard: {
    backgroundColor: '#282828',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  expandedCard: {
    backgroundColor: '#333333',
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#191414',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1DB954',
  },
  productContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#535353',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#B3B3B3',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1DB954',
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#191414',
  },
  datesContainer: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#B3B3B3',
  },
  timeLeftContainer: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  timeLeftText: {
    color: '#1DB954',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#1DB954',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 30,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#191414',
  },
  expandPrompt: {
    fontSize: 12,
    color: '#B3B3B3',
    marginRight: 4,
  },
});

export default ProductDiscounts;