import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../utils/axiosInstance';

const AnimatedRating = ({ rating }) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(animation, {
      toValue: rating,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, []);
  
  const width = animation.interpolate({
    inputRange: [0, 5],
    outputRange: ['0%', '100%']
  });
  
  return (
    <View style={styles.ratingBarContainer}>
      <View style={styles.ratingBarBackground}>
        <Animated.View style={[styles.ratingBarFill, { width }]} />
      </View>
      <Text style={styles.ratingValue}>{rating}/5</Text>
    </View>
  );
};

const ReviewScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const animateItem = (index) => {
    return {
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })
      }]
    };
  };

  const fetchAllReviews = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await axiosInstance.get('/reviews/');
      
      if (response.data.success) {
        setReviews(response.data.data || []);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start();
      } else {
        setError(response.data.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredReviews = () => {
    switch(selectedFilter) {
      case 'highest':
        return [...reviews].sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return [...reviews].sort((a, b) => a.rating - b.rating);
      case 'newest':
        return [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default:
        return reviews;
    }
  };

  const renderReviewItem = ({ item, index }) => {
    const reviewDate = item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'No date available';
      
    const isEven = index % 2 === 0;
    const gradientColors = isEven 
      ? ['#121212', '#1E3264'] 
      : ['#121212', '#663399'];

    return (
      <Animated.View 
        style={[styles.reviewItem, animateItem(index)]}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.reviewGradient}
        >
          <View style={styles.reviewHeader}>
            <View style={styles.userSection}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>
                  {(item.userId?.name?.[0] || 'A').toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>
                  {item.userId?.name || 'Anonymous User'}
                </Text>
                {item.userId?.email && (
                  <Text style={styles.userEmail}>{item.userId.email}</Text>
                )}
              </View>
            </View>
            <Text style={styles.reviewDate}>{reviewDate}</Text>
          </View>
          
          {/* Product Information Section */}
          {item.productId && (
            <View style={styles.productContainer}>
              <Text style={styles.productName}>
                {item.productId.name || 'Product'}
              </Text>
              {item.productId.image && (
                <Image 
                  source={{ uri: item.productId.image }} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              )}
              {item.productId.price && (
                <Text style={styles.productPrice}>
                  ₱{item.productId.price.toLocaleString()}
                </Text>
              )}
            </View>
          )}
          
          <AnimatedRating rating={item.rating} />
          
          <Text style={styles.reviewText}>{item.review}</Text>
          
          {item.orderId ? (
            <TouchableOpacity style={styles.orderInfoButton}>
              <Ionicons name="receipt-outline" size={14} color="#1DB954" />
              <Text style={styles.orderInfo}>
                Order: #{item.orderId._id?.slice(-6) || 'N/A'} • {item.orderId.status || 'No status'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.orderInfo}>General review</Text>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#1DB954', '#1E3264']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.title}>CUSTOMER REVIEWS</Text>
        <Text style={styles.subtitle}>
          {reviews.length > 0 
            ? `Showing ${reviews.length} reviews` 
            : 'No reviews available'}
        </Text>
      </LinearGradient>
      
      {reviews.length > 0 && (
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'highest' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('highest')}
          >
            <Text style={[styles.filterText, selectedFilter === 'highest' && styles.filterTextActive]}>Highest</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'lowest' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('lowest')}
          >
            <Text style={[styles.filterText, selectedFilter === 'lowest' && styles.filterTextActive]}>Lowest</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, selectedFilter === 'newest' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('newest')}
          >
            <Text style={[styles.filterText, selectedFilter === 'newest' && styles.filterTextActive]}>Newest</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#121212', '#212121']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#121212', '#212121']}
          style={styles.errorGradient}
        >
          <Ionicons name="warning-outline" size={48} color="#ff5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllReviews}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={getFilteredReviews()}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No reviews found</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchAllReviews}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        refreshing={refreshing}
        onRefresh={fetchAllReviews}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    overflow: 'hidden',
  },
  gradientHeader: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#212121',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterButtonActive: {
    backgroundColor: '#1DB954',
  },
  filterText: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reviewItem: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reviewGradient: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 8,
  },
  productContainer: {
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1DB954',
    paddingLeft: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginVertical: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#1DB954',
    fontWeight: 'bold',
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1DB954',
    width: 36,
    textAlign: 'right',
  },
  reviewText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 22,
  },
  orderInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfo: {
    fontSize: 12,
    color: '#AAAAAA',
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginVertical: 12,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

export default ReviewScreen;