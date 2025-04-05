import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { removeToken } from "../../utils/auth";
import { logoutUser } from "../../redux/slices/authSlice";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleLogout = async () => {
    await removeToken();
    dispatch(logoutUser());
    navigation.replace("Login");
  };

  const goToProducts = () => {
    navigation.navigate("Products"); 
  };

  const goToCheckoutManagement = () => {
    navigation.navigate("Status");
  };

  const goToDiscountManagement = () => {
    navigation.navigate("Discount");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
        <Text style={styles.roleText}>Administrator</Text>
      </View>
      
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card}
          onPress={goToProducts}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="cube-outline" size={32} color="#2196F3" />
          </View>
          <Text style={styles.cardTitle}>Manage Products</Text>
          <Text style={styles.cardDescription}>Add, edit or remove products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.card}
          onPress={goToCheckoutManagement}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="cart-outline" size={32} color="#4CAF50" />
          </View>
          <Text style={styles.cardTitle}>Manage Orders</Text>
          <Text style={styles.cardDescription}>View and update orders</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={goToDiscountManagement}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="pricetag-outline" size={32} color="#E91E63" />
          </View>
          <Text style={styles.cardTitle}>Manage Discounts</Text>
          <Text style={styles.cardDescription}>Create and manage discounts</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 30,
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 18,
    color: '#666',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  cardIcon: {
    backgroundColor: '#f0f8ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    marginTop: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default AdminDashboard;