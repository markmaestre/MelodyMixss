import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// Async thunk to submit a review
export const submitReview = createAsyncThunk(
  "review/submitReview",
  async ({ orderId, userId, productId, review, rating }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/reviews", {
        orderId,
        userId,
        productId,
        review,
        rating,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to submit review");
    }
  }
);

// Async thunk to fetch all reviews
export const fetchAllReviews = createAsyncThunk(
  "review/fetchAllReviews",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/reviews");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch reviews");
    }
  }
);

// Async thunk to fetch reviews for a user
export const fetchUserReviews = createAsyncThunk(
  "review/fetchUserReviews",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/reviews/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch user reviews");
    }
  }
);

// Async thunk to fetch reviews for a product
export const fetchProductReviews = createAsyncThunk(
  "review/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/reviews/product/${productId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch product reviews");
    }
  }
);

// Async thunk to update a review
export const updateReview = createAsyncThunk(
  "review/updateReview",
  async ({ reviewId, review, rating }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/reviews/${reviewId}`, {
        review,
        rating,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to update review");
    }
  }
);

// Async thunk to delete a review
export const deleteReview = createAsyncThunk(
  "review/deleteReview",
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete review");
    }
  }
);

// Review slice
const reviewSlice = createSlice({
  name: "review",
  initialState: {
    loading: false,
    error: null,
    success: false,
    reviews: [], // All reviews
    userReviews: [], // Reviews by specific user
    productReviews: [], // Reviews for specific product
    currentReview: null, // Currently viewed/edited review
  },
  reducers: {
    resetReviewState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    setCurrentReview: (state, action) => {
      state.currentReview = action.payload;
    },
    clearProductReviews: (state) => {
      state.productReviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit review
      .addCase(submitReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Add the new review to user reviews
        state.userReviews.unshift(action.payload.data);
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all reviews
      .addCase(fetchAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch user reviews
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.userReviews = action.payload.data;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch product reviews
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.productReviews = action.payload.data;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update review
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update the review in user reviews
        state.userReviews = state.userReviews.map(review => 
          review._id === action.payload.data._id ? action.payload.data : review
        );
        // Update the review in product reviews if it exists there
        state.productReviews = state.productReviews.map(review => 
          review._id === action.payload.data._id ? action.payload.data : review
        );
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete review
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Remove the review from user reviews
        state.userReviews = state.userReviews.filter(
          review => review._id !== action.meta.arg
        );
        // Remove the review from product reviews if it exists there
        state.productReviews = state.productReviews.filter(
          review => review._id !== action.meta.arg
        );
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { resetReviewState, setCurrentReview, clearProductReviews } = reviewSlice.actions;

// Export reducer
export default reviewSlice.reducer;