import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Save cart to AsyncStorage
const saveCartToStorage = async (cart) => {
  try {
    if (cart && Array.isArray(cart)) {
      await AsyncStorage.setItem("cart", JSON.stringify(cart));
    } else {
      console.warn("Cart is undefined, null, or not an array. Skipping save to storage.");
    }
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
};

// Load cart from AsyncStorage
const loadCartFromAsyncStorage = async () => {
  try {
    const cart = await AsyncStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Error loading cart from storage:", error);
    return [];
  }
};

// Fetch products from the backend
export const fetchProducts = createAsyncThunk(
  "cart/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/products");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/cart/add", {
        userId,
        productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(
        `/cart/remove/${userId}/${productId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Clear cart after checkout
export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/cart/clear/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Fetch user's cart history
export const fetchCartHistory = createAsyncThunk(
  "cart/fetchCartHistory",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/cart/history/${userId}`);
      return response.data.cart; // Return only the cart items
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Update item quantity in cart
export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/cart/update/${userId}/${productId}`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Cart slice
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [], // Products fetched from the backend
    items: [], // Cart items (initialized as an empty array)
    cartHistory: [], // Cart history items
    loading: false,
    error: null,
  },
  reducers: {
    // Add a local reducer to update the cart immediately
    addItemToCart: (state, action) => {
      const { productId, quantity } = action.payload;
      const product = state.products.find((p) => p._id === productId);

      if (product) {
        const existingItem = state.items.find(
          (item) => item.product._id === productId
        );

        if (existingItem) {
          // If the item already exists in the cart, update the quantity
          existingItem.quantity += quantity;
        } else {
          // If the item is not in the cart, add it
          state.items.push({ product, quantity });
        }

        // Save the updated cart to AsyncStorage
        saveCartToStorage(state.items);
      }
    },
    // Load cart from AsyncStorage when the app starts
    loadCartFromStorage: (state) => {
      loadCartFromAsyncStorage().then((cart) => {
        if (cart && Array.isArray(cart)) {
          state.items = cart;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload; // Store fetched products
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items && Array.isArray(action.payload.items)) {
          state.items = action.payload.items; // Update cart items from the backend
          saveCartToStorage(state.items); // Save to AsyncStorage
        } else {
          console.warn("Invalid items array in payload. Skipping state update.");
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items && Array.isArray(action.payload.items)) {
          state.items = action.payload.items; // Update cart items from the backend
          saveCartToStorage(state.items); // Save to AsyncStorage
        } else {
          console.warn("Invalid items array in payload. Skipping state update.");
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.cartHistory = []; // Clear cart history as well
        AsyncStorage.removeItem("cart"); // Clear AsyncStorage
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Cart History
      .addCase(fetchCartHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.cartHistory = action.payload; // Store cart history items
      })
      .addCase(fetchCartHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Cart Item Quantity
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items && Array.isArray(action.payload.items)) {
          state.items = action.payload.items; // Update cart items from the backend
          saveCartToStorage(state.items); // Save to AsyncStorage
        } else {
          console.warn("Invalid items array in payload. Skipping state update.");
        }
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export the local reducer actions
export const { addItemToCart, loadCartFromStorage } = cartSlice.actions;

export default cartSlice.reducer;