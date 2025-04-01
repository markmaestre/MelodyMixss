import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import reviewReducer from "./slices/reviewSlice";

export default configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    review: reviewReducer, 
  },
});