import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Modal
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, resetRegisterSuccess } from "../../redux/slices/authSlice";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [dobDate, setDobDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [genderOptions] = useState(["Male", "Female", "Other", "Prefer not to say"]);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [favoriteGenre, setFavoriteGenre] = useState("");
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [genreOptions] = useState(["Pop", "Rock", "Hip Hop", "R&B", "Electronic", "Classical", "Jazz", "Country", "Other"]);
  
  // Animation states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const dispatch = useDispatch();
  const { loading, error, registerSuccess } = useSelector((state) => state.auth);

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Setup pulse animation for the register button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Setup rotation animation for the music icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleRegister = () => {
    if (!name || !email || !password || !dob || !gender || !phone || !address) {
      Alert.alert("Missing Information", "Please fill in all required fields to continue");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    
    // Basic password validation (at least 8 characters)
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long");
      return;
    }
    
    // Include favorite genre in the registration payload
    dispatch(registerUser({ 
      name, 
      email, 
      password, 
      dob, 
      gender, 
      phone, 
      address,
      favoriteGenre: favoriteGenre || "Not specified" 
    }));
  };

  // Format date for display
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dobDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDobDate(currentDate);
    setDob(formatDate(currentDate));
  };

  // Redirect to Login Screen after successful registration
  useEffect(() => {
    if (registerSuccess) {
      Alert.alert("Success", "Your music journey begins now! Please login to continue.");
      dispatch(resetRegisterSuccess()); // Reset the success flag
      navigation.navigate("Login"); // Navigate to Login Screen
    }
  }, [registerSuccess, navigation, dispatch]);

  // Show error message if registration fails
  useEffect(() => {
    if (error) {
      Alert.alert("Registration Failed", error.message || "Please try again later");
    }
  }, [error]);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleGenderDropdown = () => {
    setShowGenderDropdown(!showGenderDropdown);
    if (showGenreDropdown) setShowGenreDropdown(false);
  };

  const toggleGenreDropdown = () => {
    setShowGenreDropdown(!showGenreDropdown);
    if (showGenderDropdown) setShowGenderDropdown(false);
  };

  const selectGender = (option) => {
    setGender(option);
    setShowGenderDropdown(false);
  };

  const selectGenre = (option) => {
    setFavoriteGenre(option);
    setShowGenreDropdown(false);
  };

  // Rotate value for the music icon
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const renderMusicNote = (size, top, left, delay) => {
    const noteAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(noteAnim, {
              toValue: -100,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(noteAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    }, []);
    
    return (
      <Animated.View 
        style={{
          position: 'absolute',
          top,
          left,
          opacity: 0.5,
          transform: [{ translateY: noteAnim }]
        }}
      >
        <FontAwesome5 name="music" size={size} color="#1DB954" />
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#121212', '#1E1E1E', '#282828']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Background music notes animation */}
          {renderMusicNote(20, 100, 40, 0)}
          {renderMusicNote(16, 200, 300, 500)}
          {renderMusicNote(24, 300, 80, 1000)}
          {renderMusicNote(18, 400, 250, 1500)}
          {renderMusicNote(22, 500, 150, 2000)}
          
          <Animated.View 
            style={[
              styles.container,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.headerContainer}>
              {/* Large rotating music icon at the top */}
              <View style={styles.iconContainer}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <FontAwesome5 name="music" size={50} color="#1DB954" />
                </Animated.View>
              </View>
              
              <Text style={styles.headerText}>Start Your Music Journey</Text>
              <Text style={styles.subHeaderText}>
                Create an account to discover and share your favorite tunes
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <TextInput
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              </View>

              {/* Date of Birth Picker */}
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <Text style={dob ? styles.input : styles.placeholderText}>
                  {dob || "Date of Birth"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#1DB954" />
              </TouchableOpacity>

              {/* Date Picker Modal for Android */}
              {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                  value={dobDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
              
              {/* Date Picker for iOS */}
              {Platform.OS === 'ios' && (
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                      <DateTimePicker
                        value={dobDate}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        maximumDate={new Date()}
                        style={styles.datePicker}
                      />
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="people-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <TouchableOpacity 
                  style={styles.dropdownSelector} 
                  onPress={toggleGenderDropdown}
                >
                  <Text style={gender ? styles.input : styles.placeholderText}>
                    {gender || "Select Gender"}
                  </Text>
                  <Ionicons
                    name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              </View>

              {showGenderDropdown && (
                <View style={styles.dropdownContainer}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => selectGender(option)}
                    >
                      <Text style={styles.dropdownText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.inputContainer}>
                <FontAwesome5 name="headphones" size={18} color="#1DB954" style={styles.inputIcon} />
                <TouchableOpacity 
                  style={styles.dropdownSelector} 
                  onPress={toggleGenreDropdown}
                >
                  <Text style={favoriteGenre ? styles.input : styles.placeholderText}>
                    {favoriteGenre || "Favorite Music Genre"}
                  </Text>
                  <Ionicons
                    name={showGenreDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              </View>

              {showGenreDropdown && (
                <View style={styles.dropdownContainer}>
                  {genreOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => selectGenre(option)}
                    >
                      <Text style={styles.dropdownText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <TextInput
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#1DB954" style={styles.inputIcon} />
                <TextInput
                  placeholder="Address"
                  value={address}
                  onChangeText={setAddress}
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <FontAwesome5 name="music" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                      <Text style={styles.registerButtonText}>Join the Beat</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already jamming with us?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By joining, you agree to our Terms of Service and Privacy Policy
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(40, 40, 40, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: "#B3B3B3",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 40, 40, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#FFFFFF",
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: "#9CA3AF",
  },
  eyeIcon: {
    padding: 8,
  },
  dropdownSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  dropdownContainer: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    marginTop: -8,
    marginBottom: 16,
    overflow: "hidden",
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  dropdownText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  registerButton: {
    backgroundColor: "#1DB954",
    borderRadius: 50,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: "#B3B3B3",
  },
  loginLink: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1DB954",
    marginLeft: 4,
  },
  termsContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#B3B3B3",
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "#282828",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  datePicker: {
    width: "100%",
    backgroundColor: "#282828",
  },
  datePickerButton: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 15
  },
  datePickerButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16
  },
});

export default RegisterScreen;