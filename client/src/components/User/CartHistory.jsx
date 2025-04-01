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
  Button,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { Rating } from "react-native-ratings";
import { submitReview, resetReviewState } from "../../redux/slices/reviewSlice";

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
  const dispatch = useDispatch();
  const { loading: reviewLoading, error: reviewError, success: reviewSuccess } = useSelector(
    (state) => state.review
  );

  useEffect(() => {
    if (userId) {
      fetchCheckoutHistory();
    }
  }, [userId]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout History</Text>
      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.reviewsHistoryButton}
        onPress={() => navigation.navigate("ReviewsHistory")}
      >
        <Text style={styles.reviewsHistoryButtonText}>View Reviews History</Text>
      </TouchableOpacity>

      {checkoutHistory.length === 0 ? (
        <Text style={styles.emptyText}>No checkout history found.</Text>
      ) : (
        <FlatList
          data={checkoutHistory}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.checkoutItem}>
              <Text style={styles.checkoutDate}>
                Date: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.checkoutTotal}>Total: ₱{item.totalAmount.toFixed(2)}</Text>
              <Text style={styles.checkoutStatus}>Status: {item.status}</Text>
              <Text style={styles.checkoutAddress}>Address: {item.address}</Text>
              <Text style={styles.checkoutPhone}>Phone: {item.phone}</Text>
              <Text style={styles.checkoutPayment}>Payment: {item.paymentType}</Text>

              {item.status === "Delivered" && (
                <>
                  {item.hasReviewed ? (
                    <Text style={styles.alreadyReviewedText}>Already Reviewed</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.reviewButton}
                      onPress={() => {
                        setSelectedOrderId(item._id);
                        setReviewModalVisible(true);
                      }}
                    >
                      <Text style={styles.reviewButtonText}>Leave a Review</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
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
            <Text style={styles.modalTitle}>Leave a Review</Text>

            <Rating
              type="star"
              ratingCount={5}
              imageSize={30}
              startingValue={rating}
              onFinishRating={(value) => setRating(value)}
              style={styles.rating}
            />

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review..."
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />

            <Button
              title={reviewLoading ? "Submitting..." : "Submit Review"}
              onPress={handleReviewSubmit}
              disabled={reviewLoading}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setReviewModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
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
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  emptyText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  checkoutItem: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  checkoutDate: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  checkoutTotal: {
    fontSize: 16,
    marginBottom: 5,
  },
  checkoutStatus: {
    fontSize: 16,
    marginBottom: 5,
  },
  checkoutAddress: {
    fontSize: 16,
    marginBottom: 5,
  },
  checkoutPhone: {
    fontSize: 16,
    marginBottom: 5,
  },
  checkoutPayment: {
    fontSize: 16,
    marginBottom: 5,
  },
  reviewButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  reviewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  alreadyReviewedText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  homeButton: {
    backgroundColor: "#9b59b6", // Purple color for the button
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewsHistoryButton: {
    backgroundColor: "#2ecc71",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  reviewsHistoryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  rating: {
    marginBottom: 20,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    height: 100,
  },
  modalCloseButton: {
    backgroundColor: "#e74c3c",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CartHistory;