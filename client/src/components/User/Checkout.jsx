import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  TextInput,
  Button,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; 
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCartHistory,
  clearCart,
  removeFromCart,
  updateCartItemQuantity,
} from "../../redux/slices/cartSlice";
import axiosInstance from "../../utils/axiosInstance";

const Checkout = ({ navigation }) => {
  const dispatch = useDispatch();
  const { cartHistory, loading, error } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const [quantities, setQuantities] = useState({});
  const [isCheckoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentType, setPaymentType] = useState("Cash on Delivery"); 
  useEffect(() => {
    if (userId) {
      dispatch(fetchCartHistory(userId));
    }
  }, [userId, dispatch]);
  useEffect(() => {
    if (cartHistory.length > 0) {
      const initialQuantities = {};
      cartHistory.forEach((item) => {
        initialQuantities[item.product._id] = item.quantity;
      });
      setQuantities(initialQuantities);
    }
  }, [cartHistory]);
  const calculateTotal = () => {
    return cartHistory.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const handleUpdateQuantity = async (productId, quantity) => {
    if (!quantity || quantity < 1) {
      Alert.alert("Error", "Please enter a valid quantity (at least 1).");
      return;
    }

    try {
      await dispatch(
        updateCartItemQuantity({ userId, productId, quantity })
      ).unwrap();
      Alert.alert("Success", "Quantity updated successfully!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update quantity.");
    }
  };


  const handleRemoveItem = async (productId) => {
    try {
      await dispatch(removeFromCart({ userId, productId })).unwrap();
      Alert.alert("Success", "Item removed from cart successfully!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to remove item from cart.");
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!address || !phone || !paymentType) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      const response = await axiosInstance.post("/checkout/checkout", {
        userId: user._id,
        address,
        phone,
        paymentType,
      });

      if (response.data.success) {
        Alert.alert("Success", "Checkout successful!");
        dispatch(clearCart(user._id)); // Clear the cart
        setCheckoutModalVisible(false); // Close the modal
        navigation.navigate("CartHistory"); // Navigate to cart history
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Checkout failed");
    }
  };

  // Show loading state
  if (loading) return <Text>Loading...</Text>;

  // Show error state
  if (error) return <Text>Error: {error.error || "An error occurred"}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart History</Text>

      {cartHistory.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cartHistory}
            keyExtractor={(item) => item.product._id}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image
                  source={{ uri: item.product.image }}
                  style={styles.productImage}
                />
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productPrice}>₱{item.product.price}</Text>

       
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  value={
                    quantities[item.product._id] !== undefined
                      ? quantities[item.product._id].toString()
                      : ""
                  }
                  onChangeText={(text) => {
                    const quantity = text === "" ? "" : parseInt(text, 10);
                    setQuantities((prev) => ({
                      ...prev,
                      [item.product._id]: quantity || "",
                    }));
                  }}
                />

                {/* Update Quantity Button */}
                <Button
                  title="Update Quantity"
                  onPress={() =>
                    handleUpdateQuantity(item.product._id, quantities[item.product._id])
                  }
                />

                {/* Remove Item Button */}
                <Button
                  title="Remove"
                  onPress={() => handleRemoveItem(item.product._id)}
                  color="red"
                />
              </View>
            )}
          />

          {/* Display Total Price */}
          <Text style={styles.totalPrice}>
            Total: ₱{calculateTotal().toFixed(2)}
          </Text>

          {/* Checkout Button */}
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => setCheckoutModalVisible(true)}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>

          {/* Checkout Modal */}
          <Modal
            visible={isCheckoutModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCheckoutModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Checkout</Text>

                {/* Address Input */}
                <TextInput
                  style={styles.input}
                  placeholder="Address"
                  value={address}
                  onChangeText={setAddress}
                />

                {/* Phone Input */}
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                {/* Payment Type Dropdown */}
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={paymentType}
                    onValueChange={(itemValue) => setPaymentType(itemValue)}
                  >
                    <Picker.Item label="Cash on Delivery" value="Cash on Delivery" />
                    <Picker.Item label="Credit Card" value="Credit Card" />
                    <Picker.Item label="PayPal" value="PayPal" />
                  </Picker>
                </View>

                {/* Checkout Button */}
                <TouchableOpacity
                  style={styles.modalCheckoutButton}
                  onPress={handleCheckout}
                >
                  <Text style={styles.modalCheckoutButtonText}>Checkout</Text>
                </TouchableOpacity>

                {/* Close Modal Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setCheckoutModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
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
  emptyCartText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  cartItem: {
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 5,
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2ecc71",
    marginBottom: 5,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
  },
  checkoutButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  modalCheckoutButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  modalCheckoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalCloseButton: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Checkout; 

