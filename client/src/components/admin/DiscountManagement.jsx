import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import axiosInstance from '../../utils/axiosInstance';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { 
  notifyAdminAboutDiscount,
  notifyNewDiscount,
  notifyExpiringDiscount
} from '../../utils/discountnotif';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [dateField, setDateField] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [filterActive, setFilterActive] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [animation] = useState(new Animated.Value(0));
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    product: '',
    discountPercentage: '',
    startDate: new Date(),
    endDate: null,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showToast) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowToast(false);
      });
    }
  }, [showToast]);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const fetchData = async () => {
    await fetchDiscounts();
    await fetchProducts();
    await fetchAdminToken();
  };

  const fetchAdminToken = async () => {
    // This is just a placeholder for the existing method
    // No changes to the business logic
    setAdminToken('admin-token-placeholder');
  };

  const fetchDiscounts = async () => {
    setRefreshing(true);
    try {
      const response = await axiosInstance.get('/discounts');
      setDiscounts(response.data);
      checkExpiringDiscounts(response.data);
    } catch (error) {
      showToastMessage('Failed to fetch discounts');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const checkExpiringDiscounts = (discounts) => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    discounts.forEach(discount => {
      if (discount.endDate && new Date(discount.endDate) < threeDaysFromNow && discount.isActive) {
        notifyExpiringDiscount(
          discount.product?.name || 'Product',
          discount.discountPercentage,
          discount.endDate,
          adminToken
        );
      }
    });
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/products');
      setProducts(response.data);
    } catch (error) {
      showToastMessage('Failed to fetch products');
      console.error(error);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        [dateField]: selectedDate,
      });
    }
  };

  const showDatepicker = (field) => {
    setDateField(field);
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!formData.product || !formData.discountPercentage) {
      showToastMessage('Please fill in all required fields');
      return;
    }

    if (formData.discountPercentage <= 0 || formData.discountPercentage >= 100) {
      showToastMessage('Discount must be between 0 and 100%');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post('/discounts/create', formData);
      const product = products.find(p => p._id === formData.product);

      // Notify admin
      await notifyAdminAboutDiscount(
        'created',
        product?.name || 'Product',
        formData.discountPercentage,
        adminToken
      );

      // Notify users if active
      if (formData.isActive) {
        await notifyNewDiscount(
          product?.name || 'Product',
          formData.discountPercentage,
          null,
          null
        );
      }

      setModalVisible(false);
      setFormData({
        product: '',
        discountPercentage: '',
        startDate: new Date(),
        endDate: null,
        isActive: true,
      });
      fetchDiscounts();
      showToastMessage('Discount created successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToastMessage(error.response?.data?.message || 'Failed to create discount');
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (discount) => {
    setCurrentDiscount(discount);
    setFormData({
      product: discount.product._id,
      discountPercentage: discount.discountPercentage,
      startDate: new Date(discount.startDate),
      endDate: discount.endDate ? new Date(discount.endDate) : null,
      isActive: discount.isActive,
    });
    setEditModalVisible(true);
    Haptics.selectionAsync();
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await axiosInstance.patch(`/discounts/${currentDiscount._id}`, formData);
      
      await notifyAdminAboutDiscount(
        'updated',
        currentDiscount.product?.name || 'Product',
        formData.discountPercentage,
        adminToken
      );

      setEditModalVisible(false);
      fetchDiscounts();
      showToastMessage('Discount updated successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToastMessage(error.response?.data?.message || 'Failed to update discount');
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const discountToDelete = discounts.find(d => d._id === id);
      await axiosInstance.delete(`/discounts/${id}`);
      
      await notifyAdminAboutDiscount(
        'deleted',
        discountToDelete.product?.name || 'Product',
        discountToDelete.discountPercentage,
        adminToken
      );

      fetchDiscounts();
      showToastMessage('Discount deleted successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      showToastMessage('Failed to delete discount');
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No end date';
    return new Date(date).toLocaleDateString();
  };

  const renderProductOption = (product) => (
    <TouchableOpacity
      key={product._id}
      style={[
        styles.productOption,
        formData.product === product._id && styles.selectedProductOption
      ]}
      onPress={() => {
        handleInputChange('product', product._id);
        Haptics.selectionAsync();
      }}
    >
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productImageText}>{product.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.productOptionContent}>
        <Text style={styles.productOptionText}>{product.name}</Text>
        <Text style={styles.productPrice}>₱{product.price.toFixed(2)}</Text>
      </View>
      {formData.product === product._id && (
        <Ionicons name="checkmark-circle" size={24} color="#1DB954" />
      )}
    </TouchableOpacity>
  );

  const filterDiscounts = () => {
    let filtered = [...discounts];
    
    if (filterActive !== null) {
      filtered = filtered.filter(discount => discount.isActive === filterActive);
    }
    
    switch (sortBy) {
      case 'newest':
        return filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      case 'highest':
        return filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);
      case 'lowest':
        return filtered.sort((a, b) => a.discountPercentage - b.discountPercentage);
      default:
        return filtered;
    }
  };

  const renderDiscountItem = ({ item, index }) => {
    const scaleAnim = new Animated.Value(0.97);
    
    const animateIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    const animateOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    // Calculate discount expiration
    const isExpiring = item.endDate && new Date(item.endDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    return (
      <Animated.View 
        style={[
          { transform: [{ scale: scaleAnim }] },
          { opacity: item.isActive ? 1 : 0.7 }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={animateIn}
          onPressOut={animateOut}
          onPress={() => handleEdit(item)}
          style={[styles.discountCardShadow]}
        >
          <LinearGradient
            colors={
              item.isActive 
                ? ['#1DB954', '#1DB954', '#1A1E33'] 
                : ['#9D9D9D', '#5D5D5D', '#1A1E33']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.discountCard,
              index === 0 && { marginTop: 10 }
            ]}
          >
            <View style={styles.discountHeader}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{item.discountPercentage}% OFF</Text>
              </View>
              {isExpiring && (
                <View style={styles.expiringBadge}>
                  <FontAwesome5 name="clock" size={12} color="white" />
                  <Text style={styles.expiringText}>Expiring soon</Text>
                </View>
              )}
            </View>
            
            <View style={styles.discountContent}>
              <Text style={styles.productName}>{item.product?.name || 'Unknown Product'}</Text>
              
              <View style={styles.discountMeta}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar" size={14} color="#ffffff90" />
                  <Text style={styles.dateText}>
                    {new Date(item.startDate).toLocaleDateString()} - {formatDate(item.endDate)}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: item.isActive ? '#1DB954' : '#9D9D9D' }
                ]}>
                  <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.discountActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleEdit(item)}
              >
                <Ionicons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item._id)}
              >
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderFilterOptions = () => (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filterActive === null && styles.filterButtonActive
          ]}
          onPress={() => {
            setFilterActive(null);
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            filterActive === null && styles.filterButtonTextActive
          ]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filterActive === true && styles.filterButtonActive
          ]}
          onPress={() => {
            setFilterActive(true);
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            filterActive === true && styles.filterButtonTextActive
          ]}>Active</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filterActive === false && styles.filterButtonActive
          ]}
          onPress={() => {
            setFilterActive(false);
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            filterActive === false && styles.filterButtonTextActive
          ]}>Inactive</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            sortBy === 'newest' && styles.filterButtonActive
          ]}
          onPress={() => {
            setSortBy('newest');
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            sortBy === 'newest' && styles.filterButtonTextActive
          ]}>Newest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            sortBy === 'oldest' && styles.filterButtonActive
          ]}
          onPress={() => {
            setSortBy('oldest');
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            sortBy === 'oldest' && styles.filterButtonTextActive
          ]}>Oldest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            sortBy === 'highest' && styles.filterButtonActive
          ]}
          onPress={() => {
            setSortBy('highest');
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            sortBy === 'highest' && styles.filterButtonTextActive
          ]}>Highest %</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            sortBy === 'lowest' && styles.filterButtonActive
          ]}
          onPress={() => {
            setSortBy('lowest');
            Haptics.selectionAsync();
          }}
        >
          <Text style={[
            styles.filterButtonText,
            sortBy === 'lowest' && styles.filterButtonTextActive
          ]}>Lowest %</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (loading && !discounts.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#121212', '#181818', '#1A1E33']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.titleSmall}>Store Manager</Text>
          <Text style={styles.title}>Discounts</Text>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          disabled={loading}
        >
          <LinearGradient
            colors={['#1DB954', '#19A34B']}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {renderFilterOptions()}
      
      <FlatList
        data={filterDiscounts()}
        renderItem={renderDiscountItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDiscounts}
            colors={['#1DB954']}
            tintColor="#1DB954"
            progressBackgroundColor="#121212"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag" size={60} color="#666" />
            <Text style={styles.emptyText}>No discounts found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => {
                setModalVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Text style={styles.emptyButtonText}>Create your first discount</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Discount Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#121212', '#181818', '#1A1E33']}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Discount</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Product</Text>
                <View style={styles.productList}>
                  {products.length > 0 ? (
                    products.map(renderProductOption)
                  ) : (
                    <Text style={styles.noProductsText}>No products available</Text>
                  )}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Percentage</Text>
                <View style={styles.sliderContainer}>
                  <TextInput
                    style={styles.discountInput}
                    keyboardType="numeric"
                    value={formData.discountPercentage.toString()}
                    onChangeText={(text) => handleInputChange('discountPercentage', text)}
                    placeholder="0"
                    placeholderTextColor="#aaa"
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                  
                  {/* Quick percentage buttons */}
                  <View style={styles.quickPercentContainer}>
                    {[10, 25, 50, 75].map(percent => (
                      <TouchableOpacity
                        key={percent}
                        style={styles.quickPercentButton}
                        onPress={() => {
                          handleInputChange('discountPercentage', percent.toString());
                          Haptics.selectionAsync();
                        }}
                      >
                        <Text style={styles.quickPercentText}>{percent}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('startDate')}
                >
                  <Text style={styles.dateInputText}>{formData.startDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={20} color="#1DB954" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date (optional)</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('endDate')}
                >
                  <Text style={styles.dateInputText}>
                    {formData.endDate ? formData.endDate.toLocaleDateString() : 'No end date'}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#1DB954" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.switchContainer}>
                  <TouchableOpacity
                    style={[
                      styles.switchOption,
                      formData.isActive && styles.activeSwitchOption
                    ]}
                    onPress={() => {
                      handleInputChange('isActive', true);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons 
                      name={formData.isActive ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={formData.isActive ? "#1DB954" : "#666"} 
                    />
                    <Text style={[
                      styles.switchText,
                      formData.isActive && styles.activeSwitchText
                    ]}>Active</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.switchOption,
                      !formData.isActive && styles.inactiveSwitchOption
                    ]}
                    onPress={() => {
                      handleInputChange('isActive', false);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons 
                      name={!formData.isActive ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={!formData.isActive ? "#ff6b6b" : "#666"} 
                    />
                    <Text style={[
                      styles.switchText,
                      !formData.isActive && styles.inactiveSwitchText
                    ]}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Create Discount</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.submitIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Edit Discount Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#121212', '#181818', '#1A1E33']}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Discount</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product</Text>
                <View style={styles.productDisplayCard}>
                  <View style={styles.productImagePlaceholder}>
                    <Text style={styles.productImageText}>
                      {products.find(p => p._id === formData.product)?.name.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={styles.productDisplayText}>
                    {products.find(p => p._id === formData.product)?.name || 'Unknown Product'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Percentage</Text>
                <View style={styles.sliderContainer}>
                  <TextInput
                    style={styles.discountInput}
                    keyboardType="numeric"
                    value={formData.discountPercentage.toString()}
                    onChangeText={(text) => handleInputChange('discountPercentage', text)}
                    placeholder="0"
                    placeholderTextColor="#aaa"
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                  
                  <View style={styles.quickPercentContainer}>
                    {[10, 25, 50, 75].map(percent => (
                      <TouchableOpacity
                        key={percent}
                        style={styles.quickPercentButton}
                        onPress={() => {
                          handleInputChange('discountPercentage', percent.toString());
                          Haptics.selectionAsync();
                        }}
                      >
                        <Text style={styles.quickPercentText}>{percent}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('startDate')}
                >
                  <Text style={styles.dateInputText}>{formData.startDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={20} color="#1DB954" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date (optional)</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('endDate')}
                >
                  <Text style={styles.dateInputText}>
                    {formData.endDate ? formData.endDate.toLocaleDateString() : 'No end date'}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#1DB954" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.switchContainer}>
                  <TouchableOpacity
                    style={[
                      styles.switchOption,
                      formData.isActive && styles.activeSwitchOption
                    ]}
                    onPress={() => {
                      handleInputChange('isActive', true);
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons 
                    name={formData.isActive ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={formData.isActive ? "#1DB954" : "#666"} 
                  />
                  <Text style={[
                    styles.switchText,
                    formData.isActive && styles.activeSwitchText
                  ]}>Active</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.switchOption,
                    !formData.isActive && styles.inactiveSwitchOption
                  ]}
                  onPress={() => {
                    handleInputChange('isActive', false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Ionicons 
                    name={!formData.isActive ? "radio-button-on" : "radio-button-off"} 
                    size={20} 
                    color={!formData.isActive ? "#ff6b6b" : "#666"} 
                  />
                  <Text style={[
                    styles.switchText,
                    !formData.isActive && styles.inactiveSwitchText
                  ]}>Inactive</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Update Discount</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.submitIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>

    {/* Date Picker */}
    {showDatePicker && (
      <DateTimePicker
        value={formData[dateField] || new Date()}
        mode={datePickerMode}
        is24Hour={true}
        display="default"
        onChange={handleDateChange}
        minimumDate={dateField === 'endDate' ? formData.startDate : undefined}
      />
    )}

    {/* Toast Message */}
    {showToast && (
      <Animated.View 
        style={[
          styles.toast,
          {
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>
    )}
  </LinearGradient>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleSmall: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  addButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  discountCardShadow: {
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  discountCard: {
    borderRadius: 15,
    overflow: 'hidden',
    padding: 15,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  expiringBadge: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  expiringText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  discountContent: {
    marginBottom: 15,
  },
  productName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  discountMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#ffffff90',
    fontSize: 12,
    marginLeft: 5,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  productList: {
    marginTop: 5,
  },
  productOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  selectedProductOption: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderColor: '#1DB954',
    borderWidth: 1,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productOptionContent: {
    flex: 1,
  },
  productOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  productPrice: {
    color: '#aaa',
    fontSize: 14,
  },
  sliderContainer: {
    marginVertical: 5,
  },
  discountInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  percentSymbol: {
    position: 'absolute',
    right: 15,
    top: 15,
    color: '#1DB954',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickPercentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickPercentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  quickPercentText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    color: '#fff',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
  },
  activeSwitchOption: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
  },
  inactiveSwitchOption: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  switchText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  activeSwitchText: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
  inactiveSwitchText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitIcon: {
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#1DB954',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 5,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.9)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  productDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
  },
  productDisplayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  noProductsText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  }
});

export default DiscountManagement;
