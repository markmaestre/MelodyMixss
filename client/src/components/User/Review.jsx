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
import { updateReview } from "../../redux/slices/reviewSlice";

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

  const fetchReviews = async () => {
    try {
      const response = await axiosInstance.get(`/reviews/user/${userId}`);
      setReviews(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message || "Failed to fetch reviews");
      setLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!updatedReviewText || updatedRating === 0) {
      alert("Please provide both a review and a rating.");
      return;
    }

    // Dispatch the updateReview action
    dispatch(
      updateReview({
        reviewId: selectedReview._id,
        review: updatedReviewText,
        rating: updatedRating,
      })
    );
  };

  // Handle review update success or error
  useEffect(() => {
    if (reviewSuccess) {
      alert("Review updated successfully!");
      setUpdateModalVisible(false);
      setUpdatedReviewText("");
      setUpdatedRating(0);
      fetchReviews(); // Refresh reviews
    }

    if (reviewError) {
      alert(reviewError);
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
      <Text style={styles.title}>Reviews and Ratings History</Text>

      {reviews.length === 0 ? (
        <Text style={styles.emptyText}>No reviews found.</Text>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewDate}>
                Date: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.reviewText}>Review: {item.review}</Text>
              <Text style={styles.reviewRating}>Rating: {item.rating}</Text>

              {/* Update Review Button */}
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => {
                  setSelectedReview(item);
                  setUpdatedReviewText(item.review);
                  setUpdatedRating(item.rating);
                  setUpdateModalVisible(true);
                }}
              >
                <Text style={styles.updateButtonText}>Update Review</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Update Review Modal */}
      <Modal
        visible={isUpdateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Review</Text>

            {/* Rating */}
            <Rating
              type="star"
              ratingCount={5}
              imageSize={30}
              startingValue={updatedRating}
              onFinishRating={(value) => setUpdatedRating(value)}
              style={styles.rating}
            />

            {/* Review Input */}
            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review..."
              multiline
              value={updatedReviewText}
              onChangeText={setUpdatedReviewText}
            />

            {/* Submit Button */}
            <Button
              title={reviewLoading ? "Updating..." : "Update Review"}
              onPress={handleUpdateReview}
              disabled={reviewLoading}
            />

            {/* Close Modal Button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setUpdateModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles
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
  reviewItem: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  reviewDate: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 16,
    marginBottom: 5,
  },
  reviewRating: {
    fontSize: 16,
    marginBottom: 5,
  },
  updateButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  updateButtonText: {
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

export default Review;