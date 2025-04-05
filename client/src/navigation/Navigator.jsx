import * as React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../components/User/Login";
import Register from "../components/User/Register";
import Home from "../components/User/Home";
import Cart from "../components/User/Cart";
import Checkout from "../components/User/Checkout";
import Profile from "../components/User/Profile";
import CartHistory from "../components/User/CartHistory";
import Review from "../components/User/Review";
import Dashboard from "../components/User/Dashboard";
import AdminHome from "../components/admin/AdminHome";
import Product from "../components/admin/Product";
import ModifyCheckout from "../components/admin/ModifyCheckout";
import Notifications from "../components/admin/Notifications";
import DiscountManagement from "../components/admin/DiscountManagement";
import DiscountNotifications from "../components/admin/DiscountNotifications";

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: '#2196F3',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerShown: false, 
};

const Navigator = () => (
  
  <Stack.Navigator initialRouteName="Dashboard" screenOptions={screenOptions}>
     {/* users */}
    <Stack.Screen name="Dashboard" component={Dashboard} />
    <Stack.Screen name="Cart" component={Cart} />
    <Stack.Screen name="Checkout" component={Checkout} />
    <Stack.Screen name="CartHistory" component={CartHistory} />
    <Stack.Screen name="ReviewsHistory" component={Review} />
    <Stack.Screen name="EditProfile" component={Profile} />
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="Register" component={Register} />
    <Stack.Screen name="Home" component={Home} />
   
    {/* admin */}
    <Stack.Screen name="adminDashboard" component={AdminHome} />
    <Stack.Screen name="Products" component={Product} />
    <Stack.Screen name="Notif" component={Notifications} />
    <Stack.Screen name="Status" component={ModifyCheckout} />
    <Stack.Screen name="Discount" component={DiscountManagement} />
    <Stack.Screen name="discountNotif" component={DiscountNotifications} />
   
  </Stack.Navigator>
);

export default Navigator;