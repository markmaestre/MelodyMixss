import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/slices/authSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

const Profile = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const loading = useSelector((state) => state.auth.loading);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    dob: user?.dob ? new Date(user.dob) : new Date(),
    gender: user?.gender || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  const [image, setImage] = useState(user?.image || null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleChange('dob', selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      Alert.alert('Error', 'Please enter your current password to change it');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('dob', formData.dob.toISOString());
    formDataToSend.append('gender', formData.gender);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('address', formData.address);
    
    if (formData.currentPassword) {
      formDataToSend.append('currentPassword', formData.currentPassword);
    }
    if (formData.newPassword) {
      formDataToSend.append('newPassword', formData.newPassword);
    }
    
    if (image && !image.startsWith('http')) {
      formDataToSend.append('image', {
        uri: image,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
    }

    try {
      await dispatch(updateUserProfile({
        userId: user._id,
        formData: formDataToSend
      })).unwrap();
      
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={formData.name}
        onChangeText={(text) => handleChange('name', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => handleChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={styles.input} 
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{formData.dob.toLocaleDateString()}</Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={formData.dob}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={formData.gender}
        onChangeText={(text) => handleChange('gender', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={formData.phone}
        onChangeText={(text) => handleChange('phone', text)}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Address"
        value={formData.address}
        onChangeText={(text) => handleChange('address', text)}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.sectionTitle}>Change Password</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        secureTextEntry
        value={formData.currentPassword}
        onChangeText={(text) => handleChange('currentPassword', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={formData.newPassword}
        onChangeText={(text) => handleChange('newPassword', text)}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={formData.confirmPassword}
        onChangeText={(text) => handleChange('confirmPassword', text)}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Update Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  placeholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    justifyContent: 'center',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;
