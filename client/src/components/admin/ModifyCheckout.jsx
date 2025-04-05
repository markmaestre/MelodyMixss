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
  RefreshControl 
} from 'react-native';
import axiosInstance from "../../utils/axiosInstance";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { sendPushNotification, sendLocalNotification } from '../../utils/notifications';

const Checkout = () => {
  const [checkouts, setCheckouts] = useState([]);
  const [selectedCheckout, setSelectedCheckout] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchCheckouts = async () => {
    try {
      const response = await axiosInstance.get('/checkout/all');
      setCheckouts(response.data);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckouts();
  };

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      
      // Update status in backend
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
      case 'Pending': return '#FFA500';
      case 'Shipped': return '#4169E1';
      case 'Delivered': return '#32CD32';
      case 'Cancelled': return '#FF0000';
      case 'Reviewed': return '#800080';
      default: return '#000000';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.checkoutItem}
      onPress={() => {
        setSelectedCheckout(item);
        setSelectedStatus(item.status);
        setModalVisible(true);
      }}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.orderId}>Order #{item._id.substring(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.userText}>
        User: {item.user?.email || item.user?._id || 'Unknown User'}
      </Text>
      <Text style={styles.amountText}>Total: ${item.totalAmount?.toFixed(2) || '0.00'}</Text>
      <Text style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
      <View style={styles.viewDetails}>
        <Text style={styles.detailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Management</Text>
      
      <FlatList
        data={checkouts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            
            <View style={styles.orderInfoContainer}>
              <Text style={styles.orderInfoLabel}>Order ID:</Text>
              <Text style={styles.orderInfoValue}>#{selectedCheckout?._id.substring(0, 8)}</Text>
            </View>
            
            <View style={styles.orderInfoContainer}>
              <Text style={styles.orderInfoLabel}>Current Status:</Text>
              <Text style={[styles.orderInfoValue, { color: getStatusColor(selectedCheckout?.status) }]}>
                {selectedCheckout?.status}
              </Text>
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
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={styles.statusOptionText}>{status}</Text>
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
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Update</Text>
                )}
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
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  checkoutItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
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
  userText: {
    color: '#666',
    marginBottom: 3,
    fontSize: 14,
  },
  amountText: {
    fontWeight: 'bold',
    marginBottom: 3,
    fontSize: 15,
  },
  dateText: {
    color: '#999',
    fontSize: 12,
    marginBottom: 5,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  detailsText: {
    color: '#666',
    marginRight: 5,
    fontSize: 14,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  orderInfoContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  orderInfoLabel: {
    fontWeight: 'bold',
    width: 100,
    color: '#666',
  },
  orderInfoValue: {
    flex: 1,
  },
  statusSelectLabel: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#666',
  },
  statusOptions: {
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusOptionText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Checkout;