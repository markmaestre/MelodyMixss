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
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; 
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
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
  const [discounts, setDiscounts] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    if (userId) {
      dispatch(fetchCartHistory(userId));
      fetchActiveDiscounts();
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

  // Fetch active discounts
  const fetchActiveDiscounts = async () => {
    try {
      const response = await axiosInstance.get('/discounts/active/now');
      const discountsMap = {};
      response.data.forEach(discount => {
        if (discount?.product?._id) {
          discountsMap[discount.product._id] = discount;
        }
      });
      setDiscounts(discountsMap);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    }
  };

  // Get discounted price for a product
  const getDiscountedPrice = (product) => {
    if (!product?._id) return product?.price || 0;
    
    const discount = discounts[product._id];
    if (discount?.isActive && discount?.discountPercentage) {
      return product.price * (1 - discount.discountPercentage / 100);
    }
    return product.price;
  };

  // Check if product has active discount
  const hasActiveDiscount = (productId) => {
    if (!productId) return false;
    const discount = discounts[productId];
    return discount?.isActive && discount?.discountPercentage;
  };

  // Calculate total with discounts applied
  const calculateTotal = () => {
    return cartHistory.reduce((total, item) => {
      const discountedPrice = getDiscountedPrice(item.product);
      return total + discountedPrice * item.quantity;
    }, 0);
  };

  // Calculate subtotal (original price total)
  const calculateSubtotal = () => {
    return cartHistory.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  // Calculate total savings from discounts
  const calculateSavings = () => {
    return calculateSubtotal() - calculateTotal();
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (!quantity || quantity < 1) {
      Alert.alert("Error", "Please enter a valid quantity (at least 1).");
      return;
    }

    try {
      await dispatch(
        updateCartItemQuantity({ userId, productId, quantity })
      ).unwrap();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update quantity.");
    }
  };

  const handleIncrement = async (productId) => {
    const currentQty = quantities[productId] || 0;
    const newQty = currentQty + 1;
    setQuantities({...quantities, [productId]: newQty});
    handleUpdateQuantity(productId, newQty);
  };

  const handleDecrement = async (productId) => {
    const currentQty = quantities[productId] || 0;
    if (currentQty > 1) {
      const newQty = currentQty - 1;
      setQuantities({...quantities, [productId]: newQty});
      handleUpdateQuantity(productId, newQty);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await dispatch(removeFromCart({ userId, productId })).unwrap();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to remove item from cart.");
    }
  };

  const handleCheckout = async () => {
    if (!address || !phone || !paymentType) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setProcessingCheckout(true);
    
    try {
      const response = await axiosInstance.post("/checkout/checkout", {
        userId: user._id,
        address,
        phone,
        paymentType,
        discounts: cartHistory.map(item => ({
          productId: item.product._id,
          discount: discounts[item.product._id] || null
        }))
      });

      if (response.data.success) {
        setProcessingCheckout(false);
        setCheckoutSuccess(true);
        
        // Delay to show success screen before navigating
        setTimeout(() => {
          dispatch(clearCart(user._id));
          setCheckoutModalVisible(false);
          setCheckoutSuccess(false);
          navigation.navigate("CartHistory");
        }, 2000);
      }
    } catch (error) {
      setProcessingCheckout(false);
      Alert.alert("Error", error.response?.data?.error || "Checkout failed");
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCheckout();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setCheckoutModalVisible(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>
          Error: {error.error || "An error occurred"}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchCartHistory(userId))}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        {cartHistory.length > 0 && (
          <Text style={styles.itemCount}>{cartHistory.length} items</Text>
        )}
      </View>

      {cartHistory.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Icon name="cart-outline" size={100} color="#1DB954" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopNowButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.shopNowButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartHistory}
            keyExtractor={(item) => item.product._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={styles.cartItemHeader}>
                  <View style={styles.productImageContainer}>
                    <Image
                      source={{ uri: item.product.image }}
                      style={styles.productImage}
                    />
                  </View>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    
                    {hasActiveDiscount(item.product._id) ? (
                      <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>₱{item.product.price.toFixed(2)}</Text>
                        <Text style={styles.discountedPrice}>
                          ₱{getDiscountedPrice(item.product).toFixed(2)}
                        </Text>
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>
                            -{discounts[item.product._id].discountPercentage}%
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.productPrice}>₱{item.product.price.toFixed(2)}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.cartItemActions}>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.product._id)}
                  >
                    <Icon name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                  
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleDecrement(item.product._id)}
                    >
                      <Icon name="remove" size={20} color="#1DB954" />
                    </TouchableOpacity>
                    
                    <TextInput
                      style={styles.quantityInput}
                      keyboardType="numeric"
                      value={String(quantities[item.product._id] || "")}
                      onChangeText={(text) => {
                        const quantity = text === "" ? "" : parseInt(text, 10);
                        setQuantities((prev) => ({
                          ...prev,
                          [item.product._id]: quantity || "",
                        }));
                      }}
                      onBlur={() => handleUpdateQuantity(item.product._id, quantities[item.product._id])}
                    />
                    
                    <TouchableOpacity 
                      style={styles.quantityButton}
                      onPress={() => handleIncrement(item.product._id)}
                    >
                      <Icon name="add" size={20} color="#1DB954" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={styles.priceSummaryContainer}>
                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal:</Text>
                    <Text style={styles.priceValue}>₱{calculateSubtotal().toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Discount:</Text>
                    <Text style={[styles.priceValue, styles.savingsText]}>
                      -₱{calculateSavings().toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, styles.totalLabel]}>Total:</Text>
                    <Text style={[styles.priceValue, styles.totalValue]}>
                      ₱{calculateTotal().toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={() => setCheckoutModalVisible(true)}
                >
                  <Icon name="cart-outline" size={20} color="#fff" style={styles.checkoutIcon} />
                  <Text style={styles.checkoutButtonText}>Checkout Now</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {/* Shopee-style Checkout Modal */}
          <Modal
            visible={isCheckoutModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
              setCheckoutModalVisible(false);
              setCurrentStep(1);
              setCheckoutSuccess(false);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={prevStep}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.modalHeaderTitle}>
                    {checkoutSuccess ? "Order Complete" : `Checkout: Step ${currentStep} of 3`}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setCheckoutModalVisible(false);
                      setCurrentStep(1);
                      setCheckoutSuccess(false);
                    }}
                  >
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                {/* Progress Bar */}
                {!checkoutSuccess && (
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, {width: `${(currentStep/3) * 100}%`}]} />
                  </View>
                )}

                {processingCheckout ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#1DB954" />
                    <Text style={styles.processingText}>Processing your order...</Text>
                  </View>
                ) : checkoutSuccess ? (
                  <View style={styles.successContainer}>
                    <Icon name="checkmark-circle" size={80} color="#1DB954" />
                    <Text style={styles.successText}>Order Placed Successfully!</Text>
                    <Text style={styles.successSubtext}>Redirecting to your order history...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.stepContent}>
                    {currentStep === 1 && (
                      <View style={styles.step}>
                        <Text style={styles.stepTitle}>Order Summary</Text>
                        
                        {cartHistory.map((item) => (
                          <View key={item.product._id} style={styles.summaryItem}>
                            <Image
                              source={{ uri: item.product.image }}
                              style={styles.summaryItemImage}
                            />
                            <View style={styles.summaryItemDetails}>
                              <Text style={styles.summaryItemName} numberOfLines={1}>
                                {item.product.name}
                              </Text>
                              <View style={styles.summaryItemMeta}>
                                <Text style={styles.summaryItemQuantity}>
                                  Qty: {item.quantity}
                                </Text>
                                {hasActiveDiscount(item.product._id) ? (
                                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={styles.summaryItemOriginalPrice}>
                                      ₱{item.product.price.toFixed(2)}
                                    </Text>
                                    <Text style={styles.summaryItemPrice}>
                                      ₱{getDiscountedPrice(item.product).toFixed(2)}
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={styles.summaryItemPrice}>
                                    ₱{item.product.price.toFixed(2)}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ))}
                        
                        <View style={styles.summaryPriceContainer}>
                          <View style={styles.summaryPriceRow}>
                            <Text>Merchandise Subtotal:</Text>
                            <Text>₱{calculateSubtotal().toFixed(2)}</Text>
                          </View>
                          <View style={styles.summaryPriceRow}>
                            <Text>Discounts Applied:</Text>
                            <Text style={styles.savingsText}>-₱{calculateSavings().toFixed(2)}</Text>
                          </View>
                          <View style={styles.summaryPriceRow}>
                            <Text style={styles.summaryTotalText}>Total Payment:</Text>
                            <Text style={styles.summaryTotalValue}>₱{calculateTotal().toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {currentStep === 2 && (
                      <View style={styles.step}>
                        <Text style={styles.stepTitle}>Shipping Information</Text>
                        
                        <Text style={styles.inputLabel}>Delivery Address</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your complete address"
                          value={address}
                          onChangeText={setAddress}
                          multiline
                        />
                        
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your contact number"
                          value={phone}
                          onChangeText={setPhone}
                          keyboardType="phone-pad"
                        />
                      </View>
                    )}

                    {currentStep === 3 && (
                      <View style={styles.step}>
                        <Text style={styles.stepTitle}>Payment Method</Text>
                        
                        <View style={styles.paymentOptions}>
                          <TouchableOpacity
                            style={[
                              styles.paymentOption,
                              paymentType === "Cash on Delivery" && styles.selectedPaymentOption
                            ]}
                            onPress={() => setPaymentType("Cash on Delivery")}
                          >
                            <Icon name="cash-outline" size={24} color={paymentType === "Cash on Delivery" ? "#1DB954" : "#777"} />
                            <Text style={[
                              styles.paymentOptionText,
                              paymentType === "Cash on Delivery" && styles.selectedPaymentOptionText
                            ]}>Cash on Delivery</Text>
                            {paymentType === "Cash on Delivery" && (
                              <Icon name="checkmark-circle" size={18} color="#1DB954" style={styles.checkIcon} />
                            )}
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.paymentOption,
                              paymentType === "Credit Card" && styles.selectedPaymentOption
                            ]}
                            onPress={() => setPaymentType("Credit Card")}
                          >
                            <Icon name="card-outline" size={24} color={paymentType === "Credit Card" ? "#1DB954" : "#777"} />
                            <Text style={[
                              styles.paymentOptionText,
                              paymentType === "Credit Card" && styles.selectedPaymentOptionText
                            ]}>Credit Card</Text>
                            {paymentType === "Credit Card" && (
                              <Icon name="checkmark-circle" size={18} color="#1DB954" style={styles.checkIcon} />
                            )}
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.paymentOption,
                              paymentType === "PayPal" && styles.selectedPaymentOption
                            ]}
                            onPress={() => setPaymentType("PayPal")}
                          >
                            <Icon name="logo-paypal" size={24} color={paymentType === "PayPal" ? "#1DB954" : "#777"} />
                            <Text style={[
                              styles.paymentOptionText,
                              paymentType === "PayPal" && styles.selectedPaymentOptionText
                            ]}>PayPal</Text>
                            {paymentType === "PayPal" && (
                              <Icon name="checkmark-circle" size={18} color="#1DB954" style={styles.checkIcon} />
                            )}
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.finalSummary}>
                          <Text style={styles.finalSummaryTitle}>Order Summary</Text>
                          <View style={styles.finalSummaryRow}>
                            <Text>Total Items:</Text>
                            <Text>{cartHistory.length}</Text>
                          </View>
                          <View style={styles.finalSummaryRow}>
                            <Text>Shipping Address:</Text>
                            <Text numberOfLines={1} style={{flex: 1, textAlign: 'right'}}>{address}</Text>
                          </View>
                          <View style={styles.finalSummaryRow}>
                            <Text>Payment Method:</Text>
                            <Text>{paymentType}</Text>
                          </View>
                          <View style={styles.finalSummaryRow}>
                            <Text style={styles.finalTotalText}>Total Payment:</Text>
                            <Text style={styles.finalTotalValue}>₱{calculateTotal().toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )}

                {!processingCheckout && !checkoutSuccess && (
                  <TouchableOpacity
                    style={[
                      styles.nextButton,
                      (currentStep === 2 && !address || !phone) || (currentStep === 3 && !paymentType) 
                        ? styles.disabledButton 
                        : {}
                    ]}
                    onPress={nextStep}
                    disabled={(currentStep === 2 && (!address || !phone))}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentStep < 3 ? "Continue" : "Place Order"}
                    </Text>
                    {currentStep < 3 ? (
                      <Icon name="arrow-forward" size={20} color="#fff" />
                    ) : (
                      <Icon name="checkmark" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  itemCount: {
    fontSize: 14,
    color: "#b3b3b3",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#b3b3b3",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1DB954",
    borderRadius: 30,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyCartText: {
    fontSize: 18,
    marginTop: 20,
    color: "#b3b3b3",
    textAlign: "center",
  },
  shopNowButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#1DB954",
    borderRadius: 30,
  },
  shopNowButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  cartItem: {
    marginHorizontal: 15,
    marginVertical: 8,
    backgroundColor: "#282828",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cartItemHeader: {
    flexDirection: "row",
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 5,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productDetails: {
    marginLeft: 15,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 14,
    color: "#b3b3b3",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1DB954",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1DB954",
  },
  discountBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  cartItemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  removeButton: {
    padding: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  quantityButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  quantityInput: {
    color: "#fff",
    textAlign: "center",
    paddingVertical: 5,
    paddingHorizontal: 12,
    minWidth: 40,
  },
  priceSummaryContainer: {
    marginTop: 10,
    marginBottom: 100,
    paddingHorizontal: 15,
  },
  priceSummary: {
    backgroundColor: "#282828",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  priceLabel: {
    fontSize: 15,
    color: "#b3b3b3",
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
  },
  savingsText: {
    color: "#e74c3c",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 17,
    color: "#fff",
  },
  totalValue: {
    fontSize: 17,
    color: "#1DB954",
  },
  checkoutButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  checkoutIcon: {
    marginRight: 10,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#121212",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#191414",
  },
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#1DB954",
  },
  stepContent: {
    flex: 1,
    padding: 15,
  },
  step: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: "row",
    backgroundColor: "#282828",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  summaryItemImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  summaryItemDetails: {
    marginLeft: 10,
    flex: 1,
    justifyContent: "center",
  },
  summaryItemName: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
    marginBottom: 5,
  },
  summaryItemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItemQuantity: {
    color: "#b3b3b3",
    fontSize: 12,
  },
  summaryItemOriginalPrice: {
    color: "#b3b3b3",
    fontSize: 12,
    textDecorationLine: "line-through",
    marginRight: 5,
  },
  summaryItemPrice: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 14,
  },
  summaryPriceContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  summaryPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  summaryTotalText: {
    color: "#282828",
    fontWeight: "bold",
    fontSize: 16,
  },
  summaryTotalValue: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    backgroundColor: "#282828",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 15,
  },
  inputLabel: {
    color: "#fff",
    marginBottom: 5,
    fontSize: 14,
  },
  paymentOptions: {
    marginVertical: 10,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#282828",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedPaymentOption: {
    borderColor: "#1DB954",
  },
  paymentOptionText: {
    color: "#fff",
    marginLeft: 15,
    flex: 1,
    fontSize: 16,
  },
  selectedPaymentOptionText: {
    fontWeight: "bold",
    color: "#1DB954",
  },
  checkIcon: {
    marginLeft: 5,
  },
  finalSummary: {
    backgroundColor: "#282828",
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  finalSummaryTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
  },
  finalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  finalTotalText: {
    color: "#fff",
    fontWeight: "bold",
  },
  finalTotalValue: {
    color: "#1DB954",
    fontWeight: "bold",
    fontSize: 18,
  },
  nextButton: {
    backgroundColor: "#1DB954",
    padding: 15,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    margin: 15,
  },
  disabledButton: {
    backgroundColor: "#565656",
    opacity: 0.7,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 10,
  },
  processingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  processingText: {
    color: "#fff",
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  successText: {
    color: "#fff",
    marginTop: 20,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  successSubtext: {
    color: "#b3b3b3",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
});

export default Checkout;