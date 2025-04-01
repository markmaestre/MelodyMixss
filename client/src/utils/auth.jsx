import * as SecureStore from "expo-secure-store";


export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync("token", token);
    console.log("Token saved to SecureStore:", token);
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

export const getToken = async () => {
  try {
    const token = await SecureStore.getItemAsync("token");
    console.log("Token retrieved from SecureStore:", token);
    return token;
  } catch (error) {
    console.error("Error retrieving token:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync("token");
    console.log("Token successfully removed from SecureStore");
  } catch (error) {
    console.error("Error removing token:", error);
  }
};
