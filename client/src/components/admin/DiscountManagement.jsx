import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Button, 
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl 
} from 'react-native';
import axiosInstance from '../../utils/axiosInstance';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { 
  notifyAdminAboutDiscount,
  notifyNewDiscount,
  notifyExpiringDiscount
} from '../../utils/discountnotif';

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

  const fetchData = async () => {
    await fetchDiscounts();
    await fetchProducts();
    await fetchAdminToken();
  };


  const fetchDiscounts = async () => {
    setRefreshing(true);
    try {
      const response = await axiosInstance.get('/discounts');
      setDiscounts(response.data);
      checkExpiringDiscounts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch discounts');
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
      Alert.alert('Error', 'Failed to fetch products');
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
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.discountPercentage <= 0 || formData.discountPercentage >= 100) {
      Alert.alert('Error', 'Discount must be between 0 and 100%');
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
      Alert.alert('Success', 'Discount created successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create discount');
      console.error(error);
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
      Alert.alert('Success', 'Discount updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update discount');
      console.error(error);
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
      Alert.alert('Success', 'Discount deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete discount');
      console.error(error);
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
      onPress={() => handleInputChange('product', product._id)}
    >
      <Text style={styles.productOptionText}>{product.name}</Text>
      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const renderDiscountItem = ({ item }) => (
    <View style={styles.discountItem}>
      <View style={styles.discountInfo}>
        <Text style={styles.productName}>{item.product?.name || 'Unknown Product'}</Text>
        <View style={styles.discountRow}>
          <Text style={styles.discountPercentage}>{item.discountPercentage}% OFF</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateText}>
            {new Date(item.startDate).toLocaleDateString()} - {formatDate(item.endDate)}
          </Text>
        </View>
      </View>
      <View style={styles.discountActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !discounts.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discount Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={discounts}
        renderItem={renderDiscountItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDiscounts}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No discounts found</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Discount</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
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
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={formData.discountPercentage.toString()}
                    onChangeText={(text) => handleInputChange('discountPercentage', text)}
                    placeholder="0-100%"
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('startDate')}
                >
                  <Text>{formData.startDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date (optional)</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('endDate')}
                >
                  <Text>{formData.endDate ? formData.endDate.toLocaleDateString() : 'Select date'}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
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
                    onPress={() => handleInputChange('isActive', true)}
                  >
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
                    onPress={() => handleInputChange('isActive', false)}
                  >
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
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Discount</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Discount</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Product</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>
                    {products.find(p => p._id === formData.product)?.name || 'Unknown Product'}
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Discount Percentage</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={formData.discountPercentage.toString()}
                    onChangeText={(text) => handleInputChange('discountPercentage', text)}
                    placeholder="0-100%"
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('startDate')}
                >
                  <Text>{formData.startDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>End Date (optional)</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => showDatepicker('endDate')}
                >
                  <Text>{formData.endDate ? formData.endDate.toLocaleDateString() : 'Select date'}</Text>
                  <Ionicons name="calendar" size={20} color="#666" />
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
                    onPress={() => handleInputChange('isActive', true)}
                  >
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
                    onPress={() => handleInputChange('isActive', false)}
                  >
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
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Discount</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={formData[dateField] || new Date()}
          mode={datePickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  discountItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discountInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  discountPercentage: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  discountActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  productList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  productOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedProductOption: {
    backgroundColor: '#E3F2FD',
  },
  productOptionText: {
    flex: 1,
  },
  productPrice: {
    color: '#666',
  },
  noProductsText: {
    padding: 12,
    color: '#999',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 12,
  },
  percentSymbol: {
    paddingHorizontal: 12,
    color: '#666',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  readOnlyField: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  readOnlyText: {
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  switchOption: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeSwitchOption: {
    backgroundColor: '#E8F5E9',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  inactiveSwitchOption: {
    backgroundColor: '#FFEBEE',
  },
  switchText: {
    color: '#666',
  },
  activeSwitchText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  inactiveSwitchText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DiscountManagement;