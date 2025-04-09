import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";


// Cart slice
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [], 
    items: [], 
    cartHistory: [], 
    loading: false,
    error: null,
  },
  reducers: {
    
    addItemToCart: (state, action) => {
      const { productId, quantity } = action.payload;
      const product = state.products.find((p) => p._id === productId);

      if (product) {
        const existingItem = state.items.find(
          (item) => item.product._id === productId
        );

        if (existingItem) {
         
          existingItem.quantity += quantity;
        } else {
       
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
        state.products = action.payload; 
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
          state.items = action.payload.items; 
          saveCartToStorage(state.items); 
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
          state.items = action.payload.items; 
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
        state.cartHistory = []; 
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
        state.cartHistory = action.payload; 
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
          state.items = action.payload.items; 
          saveCartToStorage(state.items); 
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
      return response.data.cart; 
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


export const { addItemToCart, loadCartFromStorage } = cartSlice.actions;

export default cartSlice.reducer;