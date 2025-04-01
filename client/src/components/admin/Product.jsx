
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
  ScrollView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../../redux/slices/productSlice";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

const Product = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  
  // State management
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Lifecycle and permissions
  useEffect(() => {
    dispatch(fetchProducts());
    requestPermissions();
  }, [dispatch]);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissions Required", "Camera roll permissions are needed to select images.");
      }
    }
  };

  // Image picking logic
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Image Selection Error", "Failed to pick an image.");
    }
  };

  // Product management functions
  const handleCreateProduct = async () => {
    if (!validateForm()) return;

    try {
      if (!image) {
        Alert.alert("Error", "Please select an image");
        return;
      }

      const base64Image = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = {
        name,
        description,
        price: parseFloat(price),
        image: `data:image/jpeg;base64,${base64Image}`,
        stock: parseInt(stock, 10),
      };

      await dispatch(createProduct(formData)).unwrap();
      resetForm();
      setIsModalVisible(false);
    } catch (error) {
      handleError("create", error);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !validateForm()) return;

    try {
      let updatedImage = selectedProduct.image;

      if (image && image !== selectedProduct.image) {
        const base64Image = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        updatedImage = `data:image/jpeg;base64,${base64Image}`;
      }

      const updatedProduct = {
        name,
        description,
        price: parseFloat(price),
        image: updatedImage,
        stock: parseInt(stock, 10),
      };

      await dispatch(updateProduct({ 
        id: selectedProduct._id, 
        productData: updatedProduct 
      })).unwrap();
      resetForm();
      setIsModalVisible(false);
    } catch (error) {
      handleError("update", error);
    }
  };

  // Utility functions
  const validateForm = () => {
    if (!name || !description || !price || !image || stock === "") {
      Alert.alert("Validation Error", "Please fill all fields and select an image.");
      return false;
    }
    
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price.");
      return false;
    }
    
    if (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
      Alert.alert("Validation Error", "Please enter a valid stock quantity.");
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setImage(null);
    setSelectedProduct(null);
  };

  const handleError = (operation, error) => {
    console.error(`Failed to ${operation} product:`, error);
    let errorMessage = error.message || "Unknown error";
    
    // Handle specific error cases
    if (error.error) {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    Alert.alert("Error", `Failed to ${operation} product: ${errorMessage}`);
  };

  const handleDeleteProduct = (id) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(deleteProduct(id)).unwrap();
            } catch (error) {
              handleError("delete", error);
            }
          },
        },
      ]
    );
  };

  const openUpdateModal = (product) => {
    setSelectedProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setImage(product.image);
    setIsCreateMode(false);
    setIsModalVisible(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateMode(true);
    setIsModalVisible(true);
  };

  // Render product item
  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.productImage} 
        resizeMode="cover"
      />
      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
          ₱{item.price.toFixed(2)}
          </Text>
          <Text style={styles.productStock}>
            Stock: {item.stock}
          </Text>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.updateButton]} 
            onPress={() => openUpdateModal(item)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDeleteProduct(item._id)}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Product Management</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={openCreateModal}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <Text>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>
            Error: {error.message || "An error occurred"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal 
        visible={isModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollView}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isCreateMode ? "Create New Product" : "Update Product"}
              </Text>
              
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Product Name"
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Product Description"
                multiline
                numberOfLines={3}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="Price"
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="Stock"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#007bff" />
                <Text style={styles.imagePickerText}>
                  {image ? "Change Image" : "Select Image"}
                </Text>
              </TouchableOpacity>

              {image && (
                <Image 
                  source={{ uri: image }} 
                  style={styles.selectedImage} 
                  resizeMode="cover"
                />
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={isCreateMode ? handleCreateProduct : handleUpdateProduct}
                >
                  <Text style={styles.modalButtonText}>
                    {isCreateMode ? "Create" : "Update"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#007bff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    padding: 15,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  productDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productDescription: {
    color: "#666",
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28a745",
  },
  productStock: {
    color: "#6c757d",
  },
  productActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  updateButton: {
    backgroundColor: "#007bff",
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "white",
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
  },
  imagePickerText: {
    color: "#007bff",
    marginLeft: 10,
    fontSize: 16,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Product;