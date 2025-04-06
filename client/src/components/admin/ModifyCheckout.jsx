import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView
} from 'react-native';
import axiosInstance from "../../utils/axiosInstance";
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { sendPushNotification, sendLocalNotification } from '../../utils/notifications';

const Checkout = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [filteredCheckouts, setFilteredCheckouts] = useState([]);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const navigation = useNavigation();

  const fetchCheckouts = async () => {
    try {
      const response = await axiosInstance.get('/checkout/all');
      setCheckouts(response.data);
      applyFilters(response.data, searchQuery, filterStatus);
    } catch (error) {
      console.error('Error fetching checkouts:', error);
      Alert.alert('Error', 'Failed to fetch checkouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, []);

  const applyFilters = (data, query, status) => {
    let result = [...data];
    
    if (query) {
      result = result.filter(item => 
        item._id.toLowerCase().includes(query.toLowerCase()) ||
        item.user?.email?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (status !== 'All') {
      result = result.filter(item => item.status === status);
    }
    
    setFilteredCheckouts(result);
  };

  useEffect(() => {
    applyFilters(checkouts, searchQuery, filterStatus);
  }, [searchQuery, filterStatus, checkouts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckouts();
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.put(`/checkout/${selectedCheckout._id}`, {
        status: selectedStatus
      });
      
      if (selectedCheckout.user?.pushToken) {
        await sendPushNotification(
          selectedCheckout.user.pushToken,
          'Order Status Updated',
          `Your order #${selectedCheckout._id.substring(0, 8)} has been updated to ${selectedStatus}`,
          { 
            screen: 'notif',
            params: { checkoutId: selectedCheckout._id }
          }
        );
      } else {
        await sendLocalNotification(
          'Status Updated',
          `Order #${selectedCheckout._id.substring(0, 8)} updated to ${selectedStatus}`,
          { checkoutId: selectedCheckout._id }
        );
      }
      
      await fetchCheckouts();
      setModalVisible(false);
      Alert.alert('Success', 'Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#FF9800';
      case 'Shipped': return '#2196F3';
      case 'Delivered': return '#4CAF50';
      case 'Cancelled': return '#F44336';
      case 'Reviewed': return '#9C27B0';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <MaterialIcons name="pending-actions" size={16} color="white" />;
      case 'Shipped': return <FontAwesome5 name="shipping-fast" size={14} color="white" />;
      case 'Delivered': return <MaterialIcons name="check-circle" size={16} color="white" />;
      case 'Cancelled': return <MaterialIcons name="cancel" size={16} color="white" />;
      case 'Reviewed': return <MaterialIcons name="rate-review" size={16} color="white" />;
      default: return <Ionicons name="ellipsis-horizontal" size={16} color="white" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatusFilterButton = ({ status, count }) => {
    const getFilterIcon = (status) => {
      switch(status) {
        case 'All': return <Ionicons name="list" size={16} color={filterStatus === status ? 'white' : '#757575'} />;
        case 'Pending': return <MaterialIcons name="pending-actions" size={16} color={filterStatus === status ? 'white' : '#757575'} />;
        case 'Shipped': return <FontAwesome5 name="shipping-fast" size={14} color={filterStatus === status ? 'white' : '#757575'} />;
        case 'Delivered': return <MaterialIcons name="check-circle" size={16} color={filterStatus === status ? 'white' : '#757575'} />;
        case 'Cancelled': return <MaterialIcons name="cancel" size={16} color={filterStatus === status ? 'white' : '#757575'} />;
        default: return <Ionicons name="ellipsis-horizontal" size={16} color={filterStatus === status ? 'white' : '#757575'} />;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterStatus === status && styles.activeFilterButton
        ]}
        onPress={() => setFilterStatus(status)}
      >
        <View style={styles.filterButtonContent}>
          {getFilterIcon(status)}
          <Text 
            style={[
              styles.filterButtonText,
              filterStatus === status && styles.activeFilterText
            ]}
            numberOfLines={1}
          >
            {status} ({count})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.checkoutCard}>
      <View style={styles.cardHeader}>
        <View style={styles.orderIdContainer}>
          <Ionicons name="receipt-outline" size={18} color="#555" />
          <Text style={styles.orderId}>#{item._id.substring(0, 8)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          {getStatusIcon(item.status)}
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={16} color="#777" />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.user?.email || 'Unknown User'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#777" />
            <Text style={styles.infoText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={16} color="#777" />
            <Text style={styles.priceText}>₱{item.totalAmount?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cube-outline" size={16} color="#777" />
            <Text style={styles.infoText}>{item.items?.length || 0} items</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedCheckout(item);
            setDetailsModalVisible(true);
          }}
        >
          <Ionicons name="eye-outline" size={18} color="#2196F3" />
          <Text style={[styles.actionText, {color: '#2196F3'}]}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedCheckout(item);
            setSelectedStatus(item.status);
            setModalVisible(true);
          }}
        >
          <MaterialIcons name="update" size={18} color="#FF9800" />
          <Text style={[styles.actionText, {color: '#FF9800'}]}>Update Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Management</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <StatusFilterButton status="All" count={checkouts.length} />
          <StatusFilterButton 
            status="Pending" 
            count={checkouts.filter(item => item.status === 'Pending').length} 
          />
          <StatusFilterButton 
            status="Shipped" 
            count={checkouts.filter(item => item.status === 'Shipped').length} 
          />
          <StatusFilterButton 
            status="Delivered" 
            count={checkouts.filter(item => item.status === 'Delivered').length} 
          />
          <StatusFilterButton 
            status="Cancelled" 
            count={checkouts.filter(item => item.status === 'Cancelled').length} 
          />
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredCheckouts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF5722']}
            tintColor="#FF5722"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery || filterStatus !== 'All' ? 
                'Try changing your search or filters' : 
                'New orders will appear here'
              }
            </Text>
          </View>
        }
      />

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalDivider} />
            
            <View style={styles.orderInfoSection}>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Order ID:</Text>
                <Text style={styles.orderInfoValue}>#{selectedCheckout?._id.substring(0, 8)}</Text>
              </View>
              
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Customer:</Text>
                <Text style={styles.orderInfoValue}>{selectedCheckout?.user?.email || 'Unknown'}</Text>
              </View>
              
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Date:</Text>
                <Text style={styles.orderInfoValue}>
                  {selectedCheckout?.createdAt ? formatDate(selectedCheckout.createdAt) : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Amount:</Text>
                <Text style={styles.orderInfoValue}>
                ₱{selectedCheckout?.totalAmount?.toFixed(2) || '0.00'}
                </Text>
              </View>
              
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Current Status:</Text>
                <View style={[
                  styles.currentStatusBadge, 
                  { backgroundColor: getStatusColor(selectedCheckout?.status) + '20',
                    borderColor: getStatusColor(selectedCheckout?.status) }
                ]}>
                  {selectedCheckout && getStatusIcon(selectedCheckout.status)}
                  <Text style={[styles.currentStatusText, { color: getStatusColor(selectedCheckout?.status) }]}>
                    {selectedCheckout?.status}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.statusSelectLabel}>Select New Status:</Text>
            
            <View style={styles.statusOptions}>
              {['Pending', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status && {
                      backgroundColor: getStatusColor(status) + '20',
                      borderColor: getStatusColor(status),
                    }
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]}>
                    {getStatusIcon(status)}
                  </View>
                  <Text style={[
                    styles.statusOptionText,
                    selectedStatus === status && { color: getStatusColor(status), fontWeight: 'bold' }
                  ]}>
                    {status}
                  </Text>
                  {selectedStatus === status && (
                    <Ionicons name="checkmark-circle" size={22} color={getStatusColor(status)} style={styles.selectedIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleStatusUpdate}
                disabled={loading || selectedStatus === selectedCheckout?.status}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="update" size={18} color="white" style={{marginRight: 5}} />
                    <Text style={styles.buttonText}>Update Status</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.detailsModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalDivider} />
            
            <ScrollView style={styles.detailsScrollView}>
              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="information-circle-outline" size={20} color="#FF5722" />
                  <Text style={styles.detailsSectionTitle}>Order Information</Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Order ID:</Text>
                  <Text style={styles.detailsValue}>#{selectedCheckout?._id}</Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Date:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedCheckout?.createdAt ? formatDate(selectedCheckout.createdAt) : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <View style={[
                    styles.detailsStatusBadge, 
                    { backgroundColor: getStatusColor(selectedCheckout?.status) }
                  ]}>
                    {selectedCheckout && getStatusIcon(selectedCheckout.status)}
                    <Text style={styles.detailsStatusText}>{selectedCheckout?.status}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="person-outline" size={20} color="#FF5722" />
                  <Text style={styles.detailsSectionTitle}>Customer Details</Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Email:</Text>
                  <Text style={styles.detailsValue}>{selectedCheckout?.user?.email || 'Not available'}</Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Customer ID:</Text>
                  <Text style={styles.detailsValue}>{selectedCheckout?.user?._id || 'Not available'}</Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Shipping Address:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedCheckout?.shippingAddress || 'Not provided'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="cart-outline" size={20} color="#FF5722" />
                  <Text style={styles.detailsSectionTitle}>Order Items</Text>
                </View>
                
                {selectedCheckout?.items?.length > 0 ? (
                  selectedCheckout.items.map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <View style={styles.orderItemHeader}>
                        <Text style={styles.orderItemName} numberOfLines={2}>
                          {item.product?.name || 'Product Name'}
                        </Text>
                        <Text style={styles.orderItemPrice}>
                        ₱{item.price?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                      
                      <View style={styles.orderItemDetails}>
                        <Text style={styles.orderItemQuantity}>
                          Qty: {item.quantity || 1}
                        </Text>
                        <Text style={styles.orderItemTotal}>
                          Total: ₱{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noItemsText}>No items found</Text>
                )}
              </View>
              
              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="cash-outline" size={20} color="#FF5722" />
                  <Text style={styles.detailsSectionTitle}>Payment Details</Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Payment Method:</Text>
                  <Text style={styles.detailsValue}>
                    {selectedCheckout?.paymentMethod || 'Not specified'}
                  </Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Subtotal:</Text>
                  <Text style={styles.detailsValue}>
                  ₱{selectedCheckout?.subtotal?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Shipping Fee:</Text>
                  <Text style={styles.detailsValue}>
                  ₱{selectedCheckout?.shippingFee?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                
                <View style={styles.detailsItem}>
                  <Text style={styles.detailsLabel}>Tax:</Text>
                  <Text style={styles.detailsValue}>
                  ₱{selectedCheckout?.tax?.toFixed(2) || '0.00'}
                  </Text>
                </View>
                
                <View style={[styles.detailsItem, styles.totalItem]}>
                  <Text style={styles.totalLabel}>Total Amount:</Text>
                  <Text style={styles.totalValue}>
                  ₱{selectedCheckout?.totalAmount?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.detailsActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={() => {
                  setDetailsModalVisible(false);
                  setSelectedStatus(selectedCheckout?.status);
                  setModalVisible(true);
                }}
              >
                <MaterialIcons name="update" size={18} color="white" style={{marginRight: 5}} />
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#000000',
    padding: 16,
    paddingTop: 20,
    paddingBottom: 10,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 60,
  },
  filterContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    height: 36,
    justifyContent: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#FF5722',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
    marginLeft: 5,
  },
  activeFilterText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  checkoutCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginLeft: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    marginLeft: 6,
    color: '#777',
    fontSize: 14,
  },
  priceText: {
    marginLeft: 6,
    color: '#333',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionText: {
    marginLeft: 5,
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginTop: 10,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 5,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 420,
    maxHeight: '85%',
    elevation: 5,
  },
  detailsModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  orderInfoSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderInfoLabel: {
    width: 90,
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  orderInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusSelectLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    marginBottom: 10,
    color: '#333',
  },
  statusOptions: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
    color: '#555',
  },
  selectedIcon: {
    marginLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  updateButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  detailsScrollView: {
    maxHeight: 480,
  },
  detailsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 12,
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsLabel: {
    width: 120,
    fontSize: 14,
    color: '#757575',
  },
  detailsValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  detailsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
  },
  detailsStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemQuantity: {
    fontSize: 13,
    color: '#757575',
  },
  orderItemTotal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  noItemsText: {
    color: '#999',
    textAlign: 'center',
    padding: 10,
    fontStyle: 'italic',
  },
  totalItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    width: 120,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  }
});

export default Checkout;