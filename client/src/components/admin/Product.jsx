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
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../../redux/slices/productSlice";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Swipeable } from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isGridView, setIsGridView] = useState(false);
  const [sortOrder, setSortOrder] = useState("name"); // name, price, stock
  const [refreshing, setRefreshing] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Filtered and sorted products
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case "price":
        return a.price - b.price;
      case "stock":
        return a.stock - b.stock;
      default:
        return a.name.localeCompare(b.name);
    }
  });

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
      setImageLoading(true);
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Image Selection Error", "Failed to pick an image.");
    } finally {
      setImageLoading(false);
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
      showSuccessMessage("Product created successfully!");
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
      showSuccessMessage("Product updated successfully!");
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
    
    if (error.error) {
      errorMessage = error.error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    Alert.alert("Error", `Failed to ${operation} product: ${errorMessage}`);
  };

  const showSuccessMessage = (message) => {
    Alert.alert("Success", message);
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
              showSuccessMessage("Product deleted successfully!");
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

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchProducts());
    setRefreshing(false);
  };

  // Render swipeable product item
  const renderRightActions = (product) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity 
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => openUpdateModal(product)}
        >
          <Ionicons name="create" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDeleteProduct(product._id)}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render product item in list view
  const renderProductItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item)}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => openUpdateModal(item)}
        activeOpacity={0.7}
      >
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
          <View style={styles.productMeta}>
            <View style={styles.priceContainer}>
              <Ionicons name="pricetag" size={14} color="#28a745" />
              <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.stockContainer}>
              <Ionicons name="cube" size={14} color="#6c757d" />
              <Text style={styles.productStock}>{item.stock}</Text>
            </View>
          </View>
          <View style={styles.statusIndicator}>
            <View 
              style={[
                styles.statusDot, 
                item.stock > 0 ? styles.inStock : styles.outOfStock
              ]} 
            />
            <Text style={styles.statusText}>
              {item.stock > 0 ? "In Stock" : "Out of Stock"}
            </Text>
          </View>
          <View style={styles.productActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.updateButton]} 
              onPress={() => openUpdateModal(item)}
            >
              <Ionicons name="create-outline" size={16} color="white" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={() => handleDeleteProduct(item._id)}
            >
              <Ionicons name="trash-outline" size={16} color="white" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  // Render product item in grid view
  const renderGridItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => openUpdateModal(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.gridImage} 
        resizeMode="cover"
      />
      <View style={styles.gridContent}>
        <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.gridPriceRow}>
          <Text style={styles.gridPrice}>₱{item.price.toFixed(2)}</Text>
          <View 
            style={[
              styles.stockIndicator, 
              item.stock > 0 ? styles.inStockIndicator : styles.outOfStockIndicator
            ]}
          >
            <Text style={styles.stockIndicatorText}>{item.stock}</Text>
          </View>
        </View>
        <View style={styles.gridActions}>
          <TouchableOpacity 
            style={[styles.gridActionButton, styles.editAction]}
            onPress={() => openUpdateModal(item)}
          >
            <Ionicons name="create" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.gridActionButton, styles.deleteAction]}
            onPress={() => handleDeleteProduct(item._id)}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Header with search and filters
  const renderHeader = () => (
    <View style={styles.filterContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filterActions}>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setIsGridView(!isGridView)}
        >
          <Ionicons 
            name={isGridView ? "list" : "grid"} 
            size={20} 
            color="#333" 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // Cycle through sort options
            if (sortOrder === "name") setSortOrder("price");
            else if (sortOrder === "price") setSortOrder("stock");
            else setSortOrder("name");
          }}
        >
          <Ionicons name="funnel" size={20} color="#333" />
          <Text style={styles.sortText}>
            {sortOrder === "name" ? "Name" : sortOrder === "price" ? "Price" : "Stock"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Product Management</Text>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {products.reduce((acc, item) => acc + item.stock, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Stock</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={openCreateModal}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      {renderHeader()}

      {/* Products List */}
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="alert-circle" size={50} color="#dc3545" />
          <Text style={styles.errorText}>
            {error.message || "An error occurred while loading products"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : sortedProducts.length === 0 ? (
        <View style={styles.centeredContainer}>
          <Ionicons name="cube-outline" size={70} color="#6c757d" />
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 
              ? "No products match your search" 
              : "No products found"
            }
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton} 
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item._id}
          renderItem={isGridView ? renderGridItem : renderProductItem}
          contentContainerStyle={isGridView ? styles.gridContainer : styles.listContainer}
          numColumns={isGridView ? 2 : 1}
          key={isGridView ? "grid" : "list"}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}

      {/* Product Form Modal */}
      <Modal 
        visible={isModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <BlurView intensity={100} style={styles.modalContainer} tint="dark">
          <KeyboardAvoidingView 
            style={{ flex: 1, justifyContent: "center" }} 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView 
              contentContainerStyle={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isCreateMode ? "Add New Product" : "Update Product"}
                  </Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Basic Information</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Product Name</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter product name"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Enter product description"
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Price (₱)</Text>
                      <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>Stock</Text>
                      <TextInput
                        style={styles.input}
                        value={stock}
                        onChangeText={setStock}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.formSectionTitle}>Product Image</Text>
                  
                  <TouchableOpacity 
                    style={styles.imagePicker} 
                    onPress={pickImage}
                    disabled={imageLoading}
                  >
                    {imageLoading ? (
                      <ActivityIndicator size="small" color="#007bff" />
                    ) : (
                      <>
                        <Ionicons name="image" size={24} color="#007bff" />
                        <Text style={styles.imagePickerText}>
                          {image ? "Change Image" : "Select Image"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {image && (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: image }} 
                        style={styles.selectedImage} 
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setImage(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, styles.saveButton]}
                    onPress={isCreateMode ? handleCreateProduct : handleUpdateProduct}
                  >
                    <Text style={styles.saveButtonText}>
                      {isCreateMode ? "Create Product" : "Update Product"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  adminHeader: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  headerStats: {
    flexDirection: "row",
  },
  statItem: {
    marginRight: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  addButton: {
    backgroundColor: "#3949ab",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  filterContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  filterActions: {
    flexDirection: "row",
    marginLeft: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  sortText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#333",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1a237e",
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
  },
  clearSearchButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  clearSearchText: {
    color: "#1a237e",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 12,
  },
  gridContainer: {
    padding: 8,
  },
  productCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  productImage: {
    width: 100,
    height: 120,
  },
  productDetails: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: "row",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  stockContainer: {
    flexDirection: "row", 
    alignItems: "center",
  },
  productPrice: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
  },
  productStock: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6c757d",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  inStock: {
    backgroundColor: "#28a745",
  },
  outOfStock: {
    backgroundColor: "#dc3545",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
  productActions: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  updateButton: {
    backgroundColor: "#3949ab",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  // Grid view styles
  gridCard: {
    flex: 1,
    margin: 4,
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridImage: {
    width: "100%",
    height: 130,
  },
  gridContent: {
    padding: 10,
  },
  gridName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },
  gridPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28a745",
  },
  stockIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 30,
    alignItems: "center",
  },
  inStockIndicator: {
    backgroundColor: "rgba(40, 167, 69, 0.2)",
  },
  outOfStockIndicator: {
    backgroundColor: "rgba(220, 53, 69, 0.2)",
  },
  stockIndicatorText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  gridActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  swipeActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  editAction: {
    backgroundColor: "#3949ab",
  },
  deleteAction: {
    backgroundColor: "#dc3545",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    flexGrow: 1,
    justifyContent: "center",
    width: width,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  rowInputs: {
    flexDirection: "row",
    marginBottom: 8,
  },
  imagePicker: {
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  imagePickerText: {
    marginLeft: 8,
    color: "#007bff",
    fontSize: 16,
  },
  imagePreviewContainer: {
    marginTop: 16,
    position: "relative",
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    padding: 4,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  formButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  saveButton: {
    backgroundColor: "#1a237e",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Product;

