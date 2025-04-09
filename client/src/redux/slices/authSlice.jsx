import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import { saveToken, removeToken } from "../../utils/auth";


const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    pushToken: null,
    loading: false,
    error: null,
    registerSuccess: false,
    loginSuccess: false,
  },
  reducers: {
    setPushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    resetRegisterSuccess: (state) => {
      state.registerSuccess = false;
    },
    resetLoginSuccess: (state) => {
      state.loginSuccess = false;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.pushToken = null;
      state.loginSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.registerSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loginSuccess = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.pushToken = null;
        state.loginSuccess = false;
      })

      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});


export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      await saveToken(response.data.token); 

      if (credentials.pushToken) {
        await axiosInstance.post("/auth/savetoken", {
          userId: response.data.user._id,
          token: credentials.pushToken,
        });
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  await removeToken(); 
  dispatch(logoutSuccess()); 
});

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async ({ userId, formData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(
        `/auth/profile/${userId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
export const { setPushToken, resetRegisterSuccess, resetLoginSuccess, logoutSuccess } =
  authSlice.actions;
export default authSlice.reducer;