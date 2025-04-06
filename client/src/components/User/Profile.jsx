import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/slices/authSlice';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const SPOTIFY_GREEN = '#1DB954';
const SPOTIFY_BLACK = '#191414';
const SPOTIFY_DARK_GRAY = '#333333';
const SPOTIFY_LIGHT_GRAY = '#B3B3B3';

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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleChange = (name, value) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFormData({ ...formData, [name]: value });
  };

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
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
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
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

  const renderInputField = (placeholder, name, value, keyboardType = 'default', secureTextEntry = false, multiline = false) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{placeholder}</Text>
      <TextInput
        style={[
          styles.input, 
          multiline && styles.multilineInput
        ]}
        placeholder={`Enter your ${placeholder.toLowerCase()}`}
        placeholderTextColor={SPOTIFY_LIGHT_GRAY}
        value={value}
        onChangeText={(text) => handleChange(name, text)}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[SPOTIFY_BLACK, SPOTIFY_DARK_GRAY]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.backButton} />
          </View>

          <TouchableOpacity 
            onPress={pickImage} 
            style={styles.imageContainer}
            activeOpacity={0.8}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="person" size={50} color={SPOTIFY_LIGHT_GRAY} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeSection === 'profile' && styles.activeTabButton
              ]}
              onPress={() => setActiveSection('profile')}
            >
              <Text style={[
                styles.tabButtonText,
                activeSection === 'profile' && styles.activeTabButtonText
              ]}>
                Profile Info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeSection === 'security' && styles.activeTabButton
              ]}
              onPress={() => setActiveSection('security')}
            >
              <Text style={[
                styles.tabButtonText,
                activeSection === 'security' && styles.activeTabButtonText
              ]}>
                Security
              </Text>
            </TouchableOpacity>
          </View>

          {activeSection === 'profile' ? (
            <View style={styles.formSection}>
              {renderInputField('Name', 'name', formData.name)}
              {renderInputField('Email', 'email', formData.email, 'email-address')}
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.input} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {formData.dob.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {showDatePicker && (
                <DateTimePicker
                  value={formData.dob}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
              
              {renderInputField('Gender', 'gender', formData.gender)}
              {renderInputField('Phone', 'phone', formData.phone, 'phone-pad')}
              {renderInputField('Address', 'address', formData.address, 'default', false, true)}
            </View>
          ) : (
            <View style={styles.formSection}>
              <Text style={styles.securityNote}>
                Change your password below. Leave blank if you don't want to change it.
              </Text>
              {renderInputField('Current Password', 'currentPassword', formData.currentPassword, 'default', true)}
              {renderInputField('New Password', 'newPassword', formData.newPassword, 'default', true)}
              {renderInputField('Confirm New Password', 'confirmPassword', formData.confirmPassword, 'default', true)}
            </View>
          )}

          {!keyboardVisible && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: SPOTIFY_BLACK,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: SPOTIFY_GREEN,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SPOTIFY_DARK_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: SPOTIFY_GREEN,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: width / 2 - 80,
    backgroundColor: SPOTIFY_GREEN,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: SPOTIFY_BLACK,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: SPOTIFY_DARK_GRAY,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: SPOTIFY_GREEN,
  },
  tabButtonText: {
    color: SPOTIFY_LIGHT_GRAY,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formSection: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  input: {
    height: 50,
    backgroundColor: SPOTIFY_DARK_GRAY,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 13,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  securityNote: {
    color: SPOTIFY_LIGHT_GRAY,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: SPOTIFY_GREEN,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default Profile;