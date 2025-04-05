import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { submitReview, resetReviewState } from "../../redux/slices/reviewSlice";

const { width } = Dimensions.get("window");

const CartHistory = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState("All");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const dispatch = useDispatch();
  const { loading: reviewLoading, error: reviewError, success: reviewSuccess } = useSelector(
    (state) => state.review
  );
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const tabs = [
    { id: "All", icon: "format-list-bulleted" },
    { id: "Pending", icon: "clock-outline" },
    { id: "Shipped", icon: "truck-delivery" },
    { id: "Delivered", icon: "check-circle" },
    { id: "Cancelled", icon: "cancel" }
  ];

  useEffect(() => {
    if (userId) {
      fetchCheckoutHistory();
    }
  }, [userId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [checkoutHistory]);

  const fetchCheckoutHistory = async () => {
    try {
      const response = await axiosInstance.get(`/checkout/history/${userId}`);
      setCheckoutHistory(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message || "Failed to fetch checkout history");
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewText || rating === 0) {
      alert("Please provide both a review and a rating.");
      return;
    }

    dispatch(
      submitReview({
        orderId: selectedOrderId,
        userId,
        review: reviewText,
        rating,
      })
    );
  };

  useEffect(() => {
    if (reviewSuccess) {
      alert("Review submitted successfully!");
      setReviewModalVisible(false);
      setReviewText("");
      setRating(0);
      dispatch(resetReviewState());

      setCheckoutHistory((prevHistory) =>
        prevHistory.map((order) =>
          order._id === selectedOrderId ? { ...order, hasReviewed: true } : order
        )
      );
    }

    if (reviewError) {
      alert(reviewError);
      dispatch(resetReviewState());
    }
  }, [reviewSuccess, reviewError]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "clock-outline";
      case "Shipped":
        return "truck-delivery";
      case "Delivered":
        return "check-circle";
      case "Cancelled":
        return "cancel";
      default:
        return "information-outline";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#f39c12";
      case "Shipped":
        return "#3498db";
      case "Delivered":
        return "#2ecc71";
      case "Cancelled":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Custom star rating component using icons
  const StarRating = ({ rating, setRating, size = 30 }) => {
    return (
      <View style={{ flexDirection: "row" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={{ padding: 3 }}
          >
            <Icon
              name={rating >= star ? "star" : "star-outline"}
              size={size}
              color={rating >= star ? "#1DB954" : "#777"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const filteredOrders = activeTab === "All" 
    ? checkoutHistory 
    : checkoutHistory.filter(order => order.status === activeTab);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchCheckoutHistory}
        >
          <Icon name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Order History</Text>
        <TouchableOpacity
          style={styles.reviewsButton}
          onPress={() => navigation.navigate("ReviewsHistory")}
        >
          <Icon name="star" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton, 
                activeTab === tab.id && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.id ? "#FFFFFF" : "#AAAAAA"} 
                style={styles.tabIcon}
              />
              <Text 
                style={[
                  styles.tabText, 
                  activeTab === tab.id && styles.activeTabText
                ]}
              >
                {tab.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="cart-off" size={60} color="#95a5a6" />
          <Text style={styles.emptyText}>
            {activeTab === "All" 
              ? "No orders found" 
              : `No ${activeTab.toLowerCase()} orders`}
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate("Shop")}
          >
            <Icon name="shopping" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.shopButtonText}>Go Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          style={[{ opacity: fadeAnim }, styles.ordersList]}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Animated.View style={styles.orderCardWrapper}>
              <TouchableOpacity 
                style={[
                  styles.orderCard,
                  { borderLeftColor: getStatusColor(item.status) }
                ]}
                onPress={() => toggleOrderExpansion(item._id)}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.orderHeaderLeft}>
                    <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                      <Icon 
                        name={getStatusIcon(item.status)} 
                        size={20} 
                        color={getStatusColor(item.status)} 
                      />
                    </View>
                    <View>
                      <Text style={styles.orderDate}>
                        {new Date(item.createdAt).toLocaleDateString()} 
                      </Text>
                      <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderHeaderRight}>
                    <Text style={styles.orderTotal}>₱{item.totalAmount.toFixed(2)}</Text>
                    <Icon 
                      name={expandedOrderId === item._id ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#777" 
                    />
                  </View>
                </View>

                {expandedOrderId === item._id && (
                  <View style={styles.orderDetails}>
                    <View style={styles.divider} />
                    
                    <View style={styles.detailRow}>
                      <Icon name="map-marker" size={18} color="#777" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Delivery Address: </Text>
                        {item.address}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Icon name="phone" size={18} color="#777" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Contact: </Text>
                        {item.phone}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Icon name="credit-card" size={18} color="#777" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Payment Method: </Text>
                        {item.paymentType}
                      </Text>
                    </View>

                    {item.discountApplied && (
                      <View style={styles.priceDetails}>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceLabel}>Subtotal:</Text>
                          <Text style={styles.priceValue}>
                            ₱{item.subtotal?.toFixed(2) || item.totalAmount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.priceRow}>
                          <Text style={styles.discountLabel}>Discount:</Text>
                          <Text style={styles.discountValue}>
                            -₱{(item.subtotal - item.totalAmount).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.dividerShort} />
                        <View style={styles.priceRow}>
                          <Text style={styles.totalLabel}>Total:</Text>
                          <Text style={styles.totalValue}>₱{item.totalAmount.toFixed(2)}</Text>
                        </View>
                      </View>
                    )}

                    {item.status === "Delivered" && (
                      <View style={styles.reviewSection}>
                        {item.hasReviewed ? (
                          <View style={styles.reviewedBadge}>
                            <Icon name="check-circle" size={16} color="#2ecc71" />
                            <Text style={styles.reviewedText}>Review Submitted</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={() => {
                              setSelectedOrderId(item._id);
                              setReviewModalVisible(true);
                            }}
                          >
                            <Icon name="star-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.reviewButtonText}>Leave a Review</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}
      
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How was your order?</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setReviewModalVisible(false)}
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalDivider} />
            
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Your Rating</Text>
              <StarRating 
                rating={rating} 
                setRating={setRating} 
                size={32} 
              />
            </View>

            <View style={styles.reviewInputContainer}>
              <Text style={styles.reviewInputLabel}>Your Review</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this order..."
                placeholderTextColor="#999"
                multiline
                value={reviewText}
                onChangeText={setReviewText}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!reviewText || rating === 0 || reviewLoading) && styles.disabledButton
              ]}
              onPress={handleReviewSubmit}
              disabled={!reviewText || rating === 0 || reviewLoading}
            >
              {reviewLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  backButton: {
    padding: 6,
  },
  reviewsButton: {
    padding: 6,
  },
  tabsWrapper: {
    backgroundColor: "#191414",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  tabsContainer: {
    flexDirection: "row",
  },
  tabsContentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "#333",
  },
  activeTabButton: {
    backgroundColor: "#1DB954",
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: "#DDDDDD",
    fontWeight: "500",
    fontSize: 13,
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  ordersList: {
    flex: 1,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#CCCCCC",
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1DB954",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 15,
    color: "#95a5a6",
    marginTop: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  shopButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  orderCardWrapper: {
    marginBottom: 12,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  orderCard: {
    backgroundColor: "#1E1E1E",
    overflow: "hidden",
    borderLeftWidth: 3,
    borderRadius: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  orderHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  orderDate: {
    fontSize: 13,
    color: "#DDDDDD",
    marginBottom: 4,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  orderHeaderRight: {
    alignItems: "flex-end",
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  orderDetails: {
    padding: 14,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 10,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 8,
    width: "100%",
  },
  dividerShort: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    color: "#CCCCCC",
    flex: 1,
    fontSize: 13,
  },
  detailLabel: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  priceDetails: {
    marginTop: 14,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceLabel: {
    color: "#CCCCCC",
    fontSize: 13,
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  discountLabel: {
    color: "#2ecc71",
    fontWeight: "bold",
    fontSize: 13,
  },
  discountValue: {
    color: "#2ecc71",
    fontWeight: "bold",
    fontSize: 13,
  },
  totalLabel: {
    fontWeight: "bold",
    color: "#FFFFFF",
    fontSize: 13,
  },
  totalValue: {
    fontWeight: "bold",
    color: "#FFFFFF",
    fontSize: 13,
  },
  reviewSection: {
    marginTop: 14,
    alignItems: "center",
  },
  reviewButton: {
    flexDirection: "row",
    backgroundColor: "#1DB954",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 13,
  },
  reviewedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  reviewedText: {
    color: "#2ecc71",
    marginLeft: 6,
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: "#1F1F1F",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 4,
  },
  ratingContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 10,
  },
  reviewInputContainer: {
    marginBottom: 20,
  },
  reviewInputLabel: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    height: 120,
    color: "#FFFFFF",
    backgroundColor: "#2A2A2A",
    textAlignVertical: "top",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#333",
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  }
});

export default CartHistory;