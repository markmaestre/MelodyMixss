import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, addToCart, addItemToCart } from "../../redux/slices/cartSlice";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; 

const Cart = ({ navigation }) => {
  const dispatch = useDispatch();
  const { products, loading, error, items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const userId = user?._id;
  const [quantities, setQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
  });

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);
  
  useEffect(() => {
    if (items.length > 0) {
      dispatch(fetchProducts());
    }
  }, [items]);

  useEffect(() => {
    let result = products;

    // Apply search filter
    if (searchQuery) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "All") {
      result = result.filter(product => 
        product.name.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Apply price range filter
    if (priceRange.min !== "" || priceRange.max !== "") {
      result = result.filter(product => {
        const price = product.price;
        const minPrice = priceRange.min !== "" ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max !== "" ? parseFloat(priceRange.max) : Infinity;
        
        return price >= minPrice && price <= maxPrice;
      });
    }

    setFilteredProducts(result);
  }, [products, searchQuery, categoryFilter, priceRange]);

  // Extract unique categories from product names
  const categories = ["All", ...new Set(products.map(product => {
    // Take the first word of the product name as category
    return product.name.split(' ')[0];
  }))];

  const handleAddToCart = async (productId) => {
    const quantity = quantities[productId] || 1; // Default to 1 if not specified

    if (!userId) {
      Alert.alert("Error", "You must be logged in to add items to the cart.");
      return;
    }

    if (quantity < 1) {
      Alert.alert("Error", "Please enter a valid quantity (at least 1).");
      return;
    }

    try {
      dispatch(addItemToCart({ productId, quantity }));
      await dispatch(addToCart({ userId, productId, quantity })).unwrap();

      setQuantities((prev) => ({ ...prev, [productId]: "" }));
      Alert.alert("Success", "Item added to cart successfully!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add item to cart.");
    }
  };

  const handleQuantityChange = (productId, text) => {
    const quantity = parseInt(text, 10);
    setQuantities((prev) => ({ ...prev, [productId]: quantity || "" }));
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    
    if (!wishlist[productId]) {
      // Showing brief feedback when adding to wishlist
      Alert.alert("Added to Wishlist", "Item has been added to your wishlist!");
    }
  };

  const resetFilter = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setPriceRange({ min: "", max: "" });
  };

  // Category Pills Component
  const CategoryPills = () => (
    <View style={styles.categoryContainer}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryPill,
              categoryFilter === item && styles.categoryPillActive
            ]}
            onPress={() => setCategoryFilter(item)}
          >
            <Text 
              style={[
                styles.categoryText,
                categoryFilter === item && styles.categoryTextActive
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  // Filter Modal Component
  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isFilterModalVisible}
      onRequestClose={() => setIsFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={() => setIsFilterModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Filter Products</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceInputContainer}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.inputLabel}>Min</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={priceRange.min}
                  onChangeText={(text) => setPriceRange(prev => ({ ...prev, min: text }))}
                />
              </View>
              <View style={styles.dividerLine} />
              <View style={styles.priceInputWrapper}>
                <Text style={styles.inputLabel}>Max</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="999"
                  keyboardType="numeric"
                  value={priceRange.max}
                  onChangeText={(text) => setPriceRange(prev => ({ ...prev, max: text }))}
                />
              </View>
            </View>
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.resetButton]} 
              onPress={() => {
                resetFilter();
                setIsFilterModalVisible(false);
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.primaryButton]} 
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Product Item Component - redesigned as cards in a 2-column grid
  const ProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.productImage} 
          resizeMode="cover"
        />
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={() => toggleWishlist(item._id)}
        >
          <Ionicons 
            name={wishlist[item._id] ? "heart" : "heart-outline"} 
            size={22} 
            color={wishlist[item._id] ? "#e74c3c" : "#fff"} 
          />
        </TouchableOpacity>
        <View style={[
          styles.stockBadge,
          item.stock <= 0 ? styles.outOfStockBadge : 
          item.stock < 5 ? styles.lowStockBadge : styles.inStockBadge
        ]}>
          <Text style={styles.stockBadgeText}>
            {item.stock <= 0 ? 'Out of Stock' : 
             item.stock < 5 ? 'Low Stock' : 'In Stock'}
          </Text>
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.productFooter}>
          <View style={styles.quantityWrapper}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => {
                const currentQty = quantities[item._id] || 0;
                if (currentQty > 0) {
                  handleQuantityChange(item._id, (currentQty - 1).toString());
                }
              }}
            >
              <Ionicons name="remove" size={16} color="#333" />
            </TouchableOpacity>
            
            <TextInput
              style={styles.quantityInput}
              placeholder="1"
              keyboardType="numeric"
              value={quantities[item._id] ? quantities[item._id].toString() : ""}
              onChangeText={(text) => handleQuantityChange(item._id, text)}
            />
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => {
                const currentQty = quantities[item._id] || 0;
                handleQuantityChange(item._id, (currentQty + 1).toString());
              }}
            >
              <Ionicons name="add" size={16} color="#333" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              item.stock <= 0 && styles.disabledButton
            ]}
            onPress={() => handleAddToCart(item._id)}
            disabled={item.stock <= 0}
          >
            <Ionicons name="cart" size={16} color="white" style={styles.cartIcon} />
            <Text style={styles.addToCartButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FilterModal />

      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Ionicons name="person-circle" size={28} color="#3498db" />
          <Text style={styles.welcomeText}>Hello, {user?.name || 'Guest'}!</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("Checkout")}
          >
            <Ionicons name="time" size={22} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => {
              // Navigate to wishlist items
              const wishlistItems = products.filter(p => wishlist[p._id]);
              navigation.navigate("Wishlist", { items: wishlistItems });
            }}
          >
            <Ionicons name="heart" size={22} color="#e74c3c" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={() => navigation.navigate("CartHistory")}
          >
            <Ionicons name="cart" size={22} color="#333" />
            {items.length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{items.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <CategoryPills />

      {loading ? (
        <View style={styles.centerContent}>
          <Ionicons name="reload" size={36} color="#3498db" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={36} color="#e74c3c" />
          <Text style={styles.errorText}>
            {error.message || "An error occurred while fetching products"}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => dispatch(fetchProducts())}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={ProductItem}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="search-outline" size={48} color="#bdc3c7" />
              <Text style={styles.noResultsText}>No products found</Text>
              <TouchableOpacity 
                style={styles.resetSearchButton}
                onPress={resetFilter}
              >
                <Text style={styles.resetSearchButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.productList}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIconButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterButton: {
    backgroundColor: '#3498db',
    width: 50,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#3498db',
  },
  categoryText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  productList: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: itemWidth,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inStockBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.8)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(243, 156, 18, 0.8)',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
  },
  stockBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2ecc71',
    marginBottom: 6,
  },
  productDescription: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
    height: 32, // Fixed height for 2 lines
  },
  productFooter: {
    flexDirection: 'column',
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 40,
    height: 30,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    marginRight: 5,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  addToCartButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  priceInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: 5,
    color: '#666',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  dividerLine: {
    width: 20,
    height: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 16,
  },
  resetSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  resetSearchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Cart;