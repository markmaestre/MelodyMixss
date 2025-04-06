import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { updateReview, deleteReview } from "../../redux/slices/reviewSlice";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const Review = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [updatedReviewText, setUpdatedReviewText] = useState("");
  const [updatedRating, setUpdatedRating] = useState(0);
  const [scrollY] = useState(new Animated.Value(0));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const swipeableRefs = useRef({});
  
  // Redux
  const dispatch = useDispatch();
  const { loading: reviewLoading, error: reviewError, success: reviewSuccess } = useSelector(
    (state) => state.review
  );

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [userId]);
  
  useEffect(() => {
    // Fade in animation when reviews load
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [reviews]);

  const fetchReviews = async () => {
    setIsRefreshing(true);
    try {
      const response = await axiosInstance.get(`/reviews/user/${userId}`);
      setReviews(response.data);
      setLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      setError(error.message || "Failed to fetch reviews");
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!updatedReviewText.trim()) {
      showToast("Please provide a review text");
      return;
    }

    if (updatedRating === 0) {
      showToast("Please select a rating");
      return;
    }

    // Dispatch the updateReview action
    dispatch(
      updateReview({
        reviewId: selectedReview._id,
        review: updatedReviewText.trim(),
        rating: updatedRating,
      })
    );
  };
  
  const confirmDeleteReview = (review) => {
    setReviewToDelete(review);
    setDeleteConfirmVisible(true);
  };
  
  const handleDeleteReview = async () => {
    if (reviewToDelete) {
      try {
        // Close any open swipeables
        Object.values(swipeableRefs.current).forEach(ref => {
          if (ref && ref.close) {
            ref.close();
          }
        });
        
        await dispatch(deleteReview(reviewToDelete._id));
        setDeleteConfirmVisible(false);
        showToast("Review deleted successfully");
        fetchReviews();
      } catch (error) {
        showToast("Failed to delete review");
      }
    }
  };
  
  const showToast = (message) => {
    // You can implement a toast notification here
    // For simplicity, we'll use an alert
    alert(message);
  };

  // Handle review update success or error
  useEffect(() => {
    if (reviewSuccess) {
      showToast("Review updated successfully!");
      setUpdateModalVisible(false);
      setUpdatedReviewText("");
      setUpdatedRating(0);
      fetchReviews(); // Refresh reviews
    }

    if (reviewError) {
      showToast(reviewError);
    }
  }, [reviewSuccess, reviewError]);

  const renderRightActions = (reviewItem) => {
    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editAction]}
          onPress={() => {
            setSelectedReview(reviewItem);
            setUpdatedReviewText(reviewItem.review);
            setUpdatedRating(reviewItem.rating);
            setUpdateModalVisible(true);
          }}
        >
          <MaterialIcons name="edit" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteAction]}
          onPress={() => confirmDeleteReview(reviewItem)}
        >
          <MaterialIcons name="delete" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  const headerElevation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 5],
    extrapolate: 'clamp',
  });

  const renderReviewItem = ({ item, index }) => {
    // Create a scale animation for each item
    const scaleAnim = new Animated.Value(0.95);
    
    // Animate the scale when component mounts
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
      delay: index * 100, // Staggered animation
    }).start();
    
    return (
      <Animated.View 
        style={[
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
          {marginBottom: 16}
        ]}
      >
        <Swipeable 
          renderRightActions={() => renderRightActions(item)}
          ref={ref => swipeableRefs.current[item._id] = ref}
          friction={2}
          overshootRight={false}
        >
          <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= item.rating ? "star" : "star-outline"}
                      size={16}
                      color="#1DB954"
                      style={styles.starIcon}
                    />
                  ))}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedReview(item);
                  setUpdatedReviewText(item.review);
                  setUpdatedRating(item.rating);
                  setUpdateModalVisible(true);
                }}
              >
                <MaterialIcons name="edit" size={22} color="#1DB954" />
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewText}>{item.review}</Text>
          </View>
        </Swipeable>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#121212', '#181818']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#121212', '#181818']} style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#1DB954" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#121212', '#181818']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <Animated.View 
        style={[
          styles.header, 
          { 
            opacity: headerOpacity,
            elevation: headerElevation,
            shadowOpacity: headerElevation,
          }
        ]}
      >
        <LinearGradient 
          colors={['#1DB954', '#1ED760']} 
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Ionicons name="ios-star-half" size={30} color="#fff" />
            <Text style={styles.title}>Reviews & Ratings</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Animated.View 
            style={{
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -20],
                  extrapolate: 'clamp',
                })
              }]
            }}
          >
            <Ionicons name="ios-document-text-outline" size={80} color="#1DB954" />
          </Animated.View>
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubText}>Your reviews will appear here</Text>
          <TouchableOpacity 
            style={styles.addReviewButton}
            onPress={() => {
          
              showToast("Navigate to add review screen");
            }}
          >
            <LinearGradient 
              colors={['#1DB954', '#1ED760']} 
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.addReviewGradient}
            >
              <AntDesign name="plus" size={20} color="#fff" />
              <Text style={styles.addReviewText}>Add Review</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          refreshing={isRefreshing}
          onRefresh={fetchReviews}
        />
      )}

      {/* Floating Action Button */}
      {reviews.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => {
            // Navigate to add review screen or show add review modal
            showToast("Navigate to add review screen");
          }}
        >
          <LinearGradient 
            colors={['#1DB954', '#1ED760']} 
            style={styles.fabGradient}
          >
            <AntDesign name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Update Review Modal */}
      <Modal
        visible={isUpdateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View 
            style={styles.modalBackdrop}
            entering={Animated.timing({
              from: { opacity: 0 },
              to: { opacity: 1 },
              duration: 300,
              easing: Easing.out(Easing.ease),
            })}
            exiting={Animated.timing({
              from: { opacity: 1 },
              to: { opacity: 0 },
              duration: 300,
              easing: Easing.out(Easing.ease),
            })}
          />
          <Animated.View
            style={styles.modalContentContainer}
            entering={Animated.timing({
              from: { translateY: 300, opacity: 0 },
              to: { translateY: 0, opacity: 1 },
              duration: 300,
              easing: Easing.out(Easing.ease),
            })}
            exiting={Animated.timing({
              from: { translateY: 0, opacity: 1 },
              to: { translateY: 300, opacity: 0 },
              duration: 300,
              easing: Easing.out(Easing.ease),
            })}
          >
            <LinearGradient colors={['#282828', '#181818']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Review</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setUpdateModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              {/* Rating using Icons */}
              <Text style={styles.ratingLabel}>Your Rating</Text>
              <View style={styles.customRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      // Add haptic feedback here if available
                      setUpdatedRating(star);
                    }}
                    style={styles.starButton}
                  >
                    <Animated.View>
                      <Ionicons
                        name={star <= updatedRating ? "star" : "star-outline"}
                        size={36}
                        color={star <= updatedRating ? "#1DB954" : "#555"}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingHint}>
                {updatedRating > 0 
                  ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][updatedRating-1] 
                  : "Tap to rate"}
              </Text>

              {/* Review Input */}
              <Text style={styles.inputLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="What did you think about it?"
                placeholderTextColor="#888"
                multiline
                value={updatedReviewText}
                onChangeText={setUpdatedReviewText}
                maxLength={500}
              />
              <Text style={styles.charCounter}>
                {updatedReviewText.length}/500 characters
              </Text>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.updateButton, 
                  (!updatedReviewText.trim() || updatedRating === 0) && styles.disabledButton
                ]}
                onPress={handleUpdateReview}
                disabled={reviewLoading || !updatedReviewText.trim() || updatedRating === 0}
              >
                <LinearGradient 
                  colors={['#1DB954', '#1ED760']} 
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.buttonGradient}
                >
                  {reviewLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.updateButtonText}>Update Review</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" style={styles.confirmIcon} />
            <Text style={styles.confirmTitle}>Delete Review</Text>
            <Text style={styles.confirmText}>
              Are you sure you want to delete this review? This action cannot be undone.
            </Text>
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteReview}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// Enhanced Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: 110,
    justifyContent: 'flex-end',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 10,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    height: '100%',
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 20,
    elevation: 3,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 16,
    color: "#b3b3b3",
    marginTop: 10,
    marginBottom: 30,
  },
  addReviewButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 3,
    width: 180,
  },
  addReviewGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addReviewText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 80, // Additional space for FAB
  },
  reviewItem: {
    padding: 16,
    backgroundColor: "#282828",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#b3b3b3",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  starIcon: {
    marginRight: 3,
  },
  reviewText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: "row",
    width: 160,
    height: "100%",
  },
  actionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editAction: {
    backgroundColor: "#2980B9",
  },
  deleteAction: {
    backgroundColor: "#E74C3C",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 30,
    overflow: "hidden",
    width: 56,
    height: 56,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 28,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContentContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 14,
  },
  customRating: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  starButton: {
    marginHorizontal: 8,
    padding: 6,
  },
  ratingHint: {
    color: "#b3b3b3",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 14,
  },
  reviewInput: {
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  charCounter: {
    fontSize: 12,
    color: "#b3b3b3",
    textAlign: "right",
    marginBottom: 24,
  },
  updateButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: "#282828",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 340,
    alignItems: "center",
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: "#b3b3b3",
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#E74C3C",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default Review;