import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import axiosInstance from "../../utils/axiosInstance";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProductDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchDiscounts = async () => {
    try {
      const response = await axiosInstance.get('/discounts/active/now'); 
      setDiscounts(response.data);
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
      case 'Active': return '#32CD32';
      case 'Inactive': return '#FF0000';
      case 'Expired': return '#FFA500';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Active Discounts</Text>
        <Text style={styles.subtitle}>{discounts.length} products on sale</Text>
      </View>
      
      {discounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={48} color="#ccc" />
          <Text style={styles.noDiscountsText}>No active discounts available</Text>
        </View>
      ) : (
        discounts.map((discount, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.discountCard}
            onPress={() => discount.product && handleProductPress(discount.product)}
            activeOpacity={0.7}
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
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{discount.product.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.originalPrice}>
                    ${discount.product.price.toFixed(2)}
                  </Text>
                  <Text style={styles.discountedPrice}>
                    ${(discount.product.price * (1 - discount.discountPercentage/100)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.datesContainer}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.dateText}>
                  Started: {new Date(discount.startDate).toLocaleDateString()}
                </Text>
              </View>
              {discount.endDate && (
                <View style={styles.dateRow}>
                  <Ionicons name="timer-outline" size={16} color="#666" />
                  <Text style={styles.dateText}>
                    Ends: {new Date(discount.endDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDiscountsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  discountCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  productInfo: {
    marginBottom: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  datesContainer: {
    marginTop: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dateText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#666',
  },
});

export default ProductDiscounts;