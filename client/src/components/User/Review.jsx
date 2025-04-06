import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { 
  fetchUserReviews, 
  updateReview, 
  deleteReview,
  resetReviewState
} from "../../redux/slices/reviewSlice";

const { width } = Dimensions.get('window');

// Custom animated star rating component
const StarRating = ({ 
  rating, 
  onRatingChange, 
  disabled = false, 
  size = 30,
  containerStyle = {} 
}) => {
  const stars = [1, 2, 3, 4, 5];
  const starScale = useRef(new Animated.Value(1)).current;
  
  const animateStar = (value) => {
    if (disabled) return;
    
    Animated.sequence([
      Animated.timing(starScale, {
        toValue: 1.3,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(starScale, {
        toValue: 1,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true
      })
    ]).start();
    
    onRatingChange(value);
  };
  
  return (
    <View style={[styles.starContainer, containerStyle]}>
      {stars.map((star) => (
        <TouchableOpacity 
          key={star} 
          disabled={disabled}
          onPress={() => animateStar(star)}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: star === rating ? starScale : 1 }] }}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color="#1DB954"
            />
          </Animated.View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Album art icon placeholder
const AlbumPlaceholder = ({ size = 60, style = {} }) => {
  return (
    <View style={[{
      width: size,
      height: size,
      borderRadius: size * 0.1,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center'
    }, style]}>
      <MaterialIcons name="music-note" size={size * 0.5} color="#1DB954" />
    </View>
  );
};

const AnimatedHeader = ({ scrollY }) => {
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  return (
    <Animated.View style={[styles.animatedHeader, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={['#121212', 'transparent']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Your Reviews</Text>
        <FontAwesome5 name="spotify" size={28} color="#1DB954" />
      </LinearGradient>
    </Animated.View>
  );
};

// Review Item Component
const ReviewItem = ({ item, shakeAnimation, onEdit, onDelete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, []);

  const getDynamicColor = (id) => {
    const colors = ['#1DB954', '#4687D6', '#E91429', '#F59B23', '#8858E8'];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  return (
    <Animated.View style={[
      styles.reviewItemContainer,
      { 
        transform: [
          { scale: scaleAnim },
          { translateX: shakeAnimation }
        ] 
      }
    ]}>
      <LinearGradient
        colors={['#282828', '#1E1E1E']}
        style={styles.reviewItem}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.albumIconContainer}>
            {item.productId?.iconType ? (
              <MaterialIcons 
                name={item.productId.iconType} 
                size={30} 
                color={getDynamicColor(item._id)} 
                style={styles.albumIcon}
              />
            ) : (
              <View style={[styles.albumIcon, { backgroundColor: getDynamicColor(item._id) }]}>
                <FontAwesome5 name="music" size={24} color="#FFF" />
              </View>
            )}
          </View>
          <View style={styles.reviewHeaderContent}>
            <Text style={styles.productName}>{item.productId?.name || 'Track not found'}</Text>
            <Text style={styles.artistName}>{item.productId?.artist || 'Unknown artist'}</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                disabled={true}
                rating={item.rating}
                size={16}
              />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.reviewText}>{item.review}</Text>
        <Text style={styles.reviewDate}>
          Reviewed on: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => onEdit(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={18} color="#1DB954" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onDelete(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={18} color="#E91429" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const UserReviewsScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { userReviews, loading, error, success } = useSelector((state) => state.review);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [editedReview, setEditedReview] = useState('');
  const [editedRating, setEditedRating] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const loadReviews = useCallback(() => {
    if (user?._id) {
      dispatch(fetchUserReviews(user._id));
    }
  }, [user?._id, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReviews();
    setTimeout(() => setRefreshing(false), 1000);
  }, [loadReviews]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (success) {
      dispatch(resetReviewState());
      setEditModalVisible(false);
    }
  }, [success, dispatch]);

  const handleEditReview = (review) => {
    setCurrentReview(review);
    setEditedReview(review.review);
    setEditedRating(review.rating);
    setEditModalVisible(true);
  };

  const handleUpdateReview = () => {
    if (!editedReview || editedRating === 0) {
      Alert.alert('Error', 'Please provide both a review and a rating');
      startShakeAnimation();
      return;
    }
    
    dispatch(updateReview({
      reviewId: currentReview._id,
      review: editedReview,
      rating: editedRating
    }));
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            dispatch(deleteReview(reviewId));
            Alert.alert('Success', 'Review deleted successfully');
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderReviewItem = ({ item }) => {
    return (
      <ReviewItem 
        item={item} 
        shakeAnimation={shakeAnimation}
        onEdit={handleEditReview}
        onDelete={handleDeleteReview}
      />
    );
  };

  if (loading && userReviews.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#121212', '#050505']}
          style={styles.container}
        >
          <FontAwesome5 name="spotify" size={40} color="#1DB954" />
          <ActivityIndicator size="large" color="#1DB954" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Loading your reviews...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#121212', '#050505']}
        style={styles.container}
      >
        <FontAwesome5 name="exclamation-circle" size={50} color="#E91429" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadReviews()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (userReviews.length === 0) {
    return (
      <LinearGradient
        colors={['#121212', '#050505']}
        style={styles.container}
      >
        <FontAwesome5 name="music" size={50} color="#b3b3b3" />
        <Text style={styles.noReviewsText}>You haven't reviewed any tracks yet.</Text>
        <TouchableOpacity style={styles.browseButton}>
          <LinearGradient
            colors={['#1DB954', '#169C46']}
            style={styles.browseGradient}
            start={[0, 0]}
            end={[1, 0]}
          >
            <Text style={styles.browseButtonText}>Browse Music</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#121212', '#050505']}
      style={styles.container}
    >
      <AnimatedHeader scrollY={scrollY} />
      
      <Animated.FlatList
        data={userReviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DB954']}
            tintColor="#1DB954"
            progressBackgroundColor="#121212"
          />
        }
      />
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <BlurView intensity={90} style={styles.modalOverlay} tint="dark">
          <Animated.View 
            style={[
              styles.modalContainer,
              { transform: [{ translateX: shakeAnimation }] }
            ]}
          >
            <LinearGradient
              colors={['#282828', '#1E1E1E']}
              style={styles.modalContent}
              start={[0, 0]}
              end={[0, 1]}
            >
              <Text style={styles.modalTitle}>Edit Your Review</Text>
              
              <View style={styles.modalAlbumIcon}>
                <FontAwesome5 name="music" size={40} color="#1DB954" />
              </View>
              
              <Text style={styles.productNameModal}>
                {currentReview?.productId?.name || 'Track'}
              </Text>
              
              <Text style={styles.artistNameModal}>
                {currentReview?.productId?.artist || 'Artist'}
              </Text>
              
              <StarRating
                rating={editedRating}
                onRatingChange={setEditedRating}
                size={40}
                containerStyle={styles.starRatingModal}
              />
              
              <TextInput
                style={styles.reviewInput}
                multiline
                numberOfLines={4}
                placeholder="Write your review here..."
                placeholderTextColor="#b3b3b3"
                value={editedReview}
                onChangeText={setEditedReview}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleUpdateReview}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Spotify's dark background
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    paddingTop: 100, // Give space for the animated header
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  reviewItemContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  reviewItem: {
    padding: 15,
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  albumIconContainer: {
    marginRight: 15,
  },
  albumIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#b3b3b3',
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: 'row',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#b3b3b3',
  },
  reviewText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#b3b3b3',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
  editButtonText: {
    color: '#1DB954',
    marginLeft: 5,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E91429',
    backgroundColor: 'rgba(233, 20, 41, 0.1)',
  },
  deleteButtonText: {
    color: '#E91429',
    marginLeft: 5,
    fontWeight: '600',
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#b3b3b3',
    fontSize: 16,
  },
  noReviewsText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    color: '#b3b3b3',
    paddingHorizontal: 40,
  },
  browseButton: {
    borderRadius: 25,
    overflow: 'hidden',
    width: width * 0.6,
  },
  browseGradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#E91429',
    marginVertical: 20,
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
  },
  modalAlbumIcon: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  productNameModal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: 'white',
  },
  artistNameModal: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#b3b3b3',
  },
  starRatingModal: {
    justifyContent: 'center',
    marginBottom: 20,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    minHeight: 120,
    textAlignVertical: 'top',
    width: '100%',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 15,
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#b3b3b3',
  },
  saveButton: {
    backgroundColor: '#1DB954',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#b3b3b3',
    fontWeight: 'bold',
  },
  wavesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    opacity: 0.5,
  },
});

export default UserReviewsScreen;