import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

export const submitReview = createAsyncThunk(
  "review/submitReview",
  async ({ orderId, userId, review, rating }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/reviews/create", {
        orderId,
        userId,
        review,
        rating,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to submit review");
    }
  }
);

// Async thunk to fetch reviews for a user
export const fetchReviews = createAsyncThunk(
  "review/fetchReviews",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/reviews/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch reviews");
    }
  }
);

// Async thunk to update a review
export const updateReview = createAsyncThunk(
  "review/updateReview",
  async ({ reviewId, review, rating }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/reviews/update/${reviewId}`, {
        review,
        rating,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to update review");
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
    reviews: [], // Array to store fetched reviews
  },
  reducers: {
    resetReviewState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
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
      .addCase(submitReview.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to submit review";
      })

      // Fetch reviews
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload; // Store fetched reviews
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch reviews";
      })

      // Update review
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateReview.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update review";
      });
  },
});

// Export actions
export const { resetReviewState } = reviewSlice.actions;

// Export reducer
export default reviewSlice.reducer;