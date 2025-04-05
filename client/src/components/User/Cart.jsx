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
  Animated,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, addToCart, addItemToCart } from "../../redux/slices/cartSlice";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axiosInstance from '../../utils/axiosInstance';

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 2; 

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
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [discounts, setDiscounts] = useState({});
  const [scaleAnim] = useState(new Animated.Value(1));
  const [addedItems, setAddedItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      await dispatch(fetchProducts());
      await fetchActiveDiscounts();
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    if (items.length > 0) {
      dispatch(fetchProducts());
    }
  }, [items]);

  const fetchActiveDiscounts = async () => {
    try {
      const response = await axiosInstance.get('/discounts/active/now');
      const discountsMap = {};
      
      response.data.forEach(discount => {
        if (discount?.product?._id) {
          discountsMap[discount.product._id] = {
            ...discount,
            isActive: discount.isActive !== false,
            discountPercentage: discount.discountPercentage || 0
          };
        }
      });
      
      setDiscounts(discountsMap);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
      Alert.alert("Error", "Could not load discount information");
    }
  };

  const getDiscountedPrice = (product) => {
    if (!product?._id) return product?.price || 0;
    
    const discount = discounts[product._id];
    if (discount?.isActive && discount?.discountPercentage) {
      return product.price * (1 - discount.discountPercentage / 100);
    }
    return product.price;
  };

  const hasActiveDiscount = (productId) => {
    if (!productId) return false;
    const discount = discounts[productId];
    return discount?.isActive && discount?.discountPercentage;
  };

  const getDiscountPercentage = (productId) => {
    if (!productId) return 0;
    const discount = discounts[productId];
    return discount?.discountPercentage || 0;
  };

  const getTimeRemaining = (productId) => {
    if (!productId) return null;
    
    const discount = discounts[productId];
    if (!discount?.endDate) return null;
    
    try {
      const endDate = new Date(discount.endDate);
      const now = new Date();
      const diff = endDate - now;
      
      if (diff <= 0) return null;
      
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h left`;
      if (hours > 0) return `${hours}h ${minutes}m left`;
      return `${minutes}m left`;
    } catch (e) {
      console.error("Error calculating time remaining:", e);
      return null;
    }
  };

  useEffect(() => {
    let result = products || [];

    if (searchQuery) {
      result = result.filter(product => 
        product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "All") {
      result = result.filter(product => 
        product?.name?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    if (priceRange.min !== "" || priceRange.max !== "") {
      result = result.filter(product => {
        const price = getDiscountedPrice(product);
        const minPrice = priceRange.min !== "" ? parseFloat(priceRange.min) : 0;
        const maxPrice = priceRange.max !== "" ? parseFloat(priceRange.max) : Infinity;
        
        return price >= minPrice && price <= maxPrice;
      });
    }

    setFilteredProducts(result);
  }, [products, searchQuery, categoryFilter, priceRange, discounts]);

  const categories = ["All", ...new Set((products || []).map(product => {
    return product?.name?.split(' ')[0] || '';
  }).filter(Boolean))];

  const handleAddToCart = async (productId) => {
    const quantity = quantities[productId] || 1;

    if (!userId) {
      Alert.alert("Error", "You must be logged in to add items to the cart.");
      return;
    }

    if (quantity < 1) {
      Alert.alert("Error", "Please enter a valid quantity (at least 1).");
      return;
    }

    try {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setAddedItems(prev => ({ ...prev, [productId]: true }));
      
      setTimeout(() => {
        setAddedItems(prev => ({ ...prev, [productId]: false }));
      }, 2000);

      dispatch(addItemToCart({ productId, quantity }));
      await dispatch(addToCart({ userId, productId, quantity })).unwrap();

      setQuantities(prev => ({ ...prev, [productId]: "" }));
      Alert.alert("Added to Cart", "Item added successfully!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add item to cart.");
    }
  };

  const handleQuantityChange = (productId, text) => {
    const quantity = parseInt(text, 10) || "";
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  const toggleWishlist = (productId) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setWishlist(prev => ({ ...prev, [productId]: !prev[productId] }));
    
    if (!wishlist[productId]) {
      Alert.alert("Added to Liked Items", "Item added to your favorites!");
    }
  };

  const resetFilter = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setPriceRange({ min: "", max: "" });
  };

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
            <Ionicons name="close" size={24} color="#fff" />
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
                  placeholderTextColor="#a7a7a7"
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
                  placeholderTextColor="#a7a7a7"
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

  const ProductItem = ({ item }) => {
    if (!item?._id) return null;

    return (
      <Animated.View 
        style={[
          styles.productCard,
          addedItems[item._id] && styles.productCardAdded
        ]}
      >
        {hasActiveDiscount(item._id) && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              -{getDiscountPercentage(item._id)}%
            </Text>
          </View>
        )}
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.productImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={() => toggleWishlist(item._id)}
          >
            <Ionicons 
              name={wishlist[item._id] ? "heart" : "heart-outline"} 
              size={22} 
              color={wishlist[item._id] ? "#1DB954" : "#fff"} 
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
          
          <View style={styles.priceContainer}>
            {hasActiveDiscount(item._id) ? (
              <>
                <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
                <Text style={styles.productPrice}>
                  ${getDiscountedPrice(item).toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            )}
          </View>
          
          {hasActiveDiscount(item._id) && getTimeRemaining(item._id) && (
            <Text style={styles.timeRemainingText}>
              {getTimeRemaining(item._id)}
            </Text>
          )}
          
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
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                placeholder="1"
                placeholderTextColor="#a7a7a7"
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
                <Ionicons name="add" size={16} color="#fff" />
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
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FilterModal />

      <LinearGradient
        colors={['#191414', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Ionicons name="person-circle" size={28} color="#1DB954" />
            <Text style={styles.welcomeText}>Hello, {user?.name || 'Guest'}!</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate("Checkout")}
            >
              <Ionicons name="time" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {
                const wishlistItems = products.filter(p => wishlist[p._id]);
                navigation.navigate("Wishlist", { items: wishlistItems });
              }}
            >
              <Ionicons name="heart" size={22} color="#1DB954" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate("CartHistory")}
            >
              <Ionicons name="cart" size={22} color="#fff" />
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
            <Ionicons name="search" size={20} color="#a7a7a7" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#a7a7a7"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#a7a7a7" />
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
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContent}>
          <Animated.View
            style={{
              transform: [{ rotate: loading ? '360deg' : '0deg' }]
            }}
          >
            <Ionicons name="reload" size={36} color="#1DB954" />
          </Animated.View>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1DB954']}
              tintColor="#1DB954"
            />
          }
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="search-outline" size={48} color="#a7a7a7" />
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
    backgroundColor: '#121212',
  },
  headerGradient: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIconButton: {
    marginLeft: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#1DB954',
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
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
  },
  filterButton: {
    backgroundColor: '#1DB954',
    width: 50,
    height: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    paddingVertical: 10,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#282828',
    borderRadius: 24,
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: '#1DB954',
  },
  categoryText: {
    color: '#a7a7a7',
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
    backgroundColor: '#212121',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  productCardAdded: {
    borderColor: '#1DB954',
    borderWidth: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 5,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 5,
  },
  inStockBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.8)',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(250, 173, 20, 0.8)',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
  },
  stockBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#1DB954',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  discountBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  productDetails: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 14,
    color: '#a7a7a7',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1DB954',
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#1DB954',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  productDescription: {
    color: '#a7a7a7',
    fontSize: 12,
    marginBottom: 12,
    height: 32,
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
    backgroundColor: '#333333',
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
    borderColor: '#333333',
    borderRadius: 8,
    textAlign: 'center',
    color: '#fff',
  },
  addToCartButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    marginRight: 5,
  },
  disabledButton: {
    backgroundColor: '#535353',
  },
  addToCartButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#212121',
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
    color: '#ffffff',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#ffffff',
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
    color: '#a7a7a7',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#282828',
    color: '#ffffff',
  },
  dividerLine: {
    width: 20,
    height: 1,
    backgroundColor: '#333333',
    marginHorizontal: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 24,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#333333',
  },
  resetButtonText: {
    color: '#a7a7a7',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#1DB954',
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
    color: '#a7a7a7',
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
    backgroundColor: '#1DB954',
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noResultsText: {
    fontSize: 16,
    color: '#a7a7a7',
    marginTop: 10,
    marginBottom: 16,
  },
  resetSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1DB954',
    borderRadius: 24,
  },
  resetSearchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Cart;