import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, resetLoginSuccess } from "../../redux/slices/authSlice";
import { registerForPushNotifications, savePushToken } from "../../utils/notifications";
import Icon from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pushToken, setPushToken] = useState(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  
  const dispatch = useDispatch();
  const { loading, error, loginSuccess, user } = useSelector((state) => state.auth);

  // Pulse animation for logo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Animate components on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInputs = () => {
    let isValid = true;
    
    // Validate email
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    // Validate password
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateInputs()) {
      // Animate error shake
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
      return;
    }
    
    try {
      const token = await registerForPushNotifications();
      setPushToken(token);
      console.log("Generated Push Token:", token);
      
      dispatch(loginUser({ email, password, pushToken: token }));
    } catch (err) {
      Alert.alert("Notification Error", "Could not register for push notifications");
    }
  };

  useEffect(() => {
    if (loginSuccess) {
      Alert.alert("Success", "Login successful!");
      dispatch(resetLoginSuccess());
      
      if (user && user.role === "admin") {
        navigation.navigate("adminDashboard");
      } else {
        navigation.navigate("Home");
      }
      
      if (pushToken && user) {
        savePushToken(user._id, pushToken);
      }
    }
  }, [loginSuccess, navigation, dispatch, pushToken, user]);

  useEffect(() => {
    if (error) {
      if (error.message && error.message.toLowerCase().includes("password")) {
        setPasswordError(error.message || "Incorrect password");
        setEmailError("");
      } else if (error.message && error.message.toLowerCase().includes("email")) {
        setEmailError(error.message || "Email not found or invalid");
        setPasswordError("");
      } else {
        Alert.alert("Login Failed", error.message || "Something went wrong. Please try again.");
      }
      
      // Animate error shake
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [error]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <LinearGradient
        colors={['#121212', '#181818', '#212121']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidView}
        >
          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <Animated.View style={{
                transform: [{ scale: pulseAnim }]
              }}>
                <View style={styles.logoCircle}>
                  <Icon name="music" size={40} color="#fff" style={styles.logoIcon} />
                </View>
              </Animated.View>
              <Text style={styles.appName}>MelodyMix</Text>
              <Text style={styles.tagline}>Your rhythm, your world</Text>
            </View>
            
            <Text style={styles.welcomeText}>Log in to continue</Text>

            <View style={[
              styles.inputContainer,
              isFocused.email && styles.inputContainerFocused
            ]}>
              <Icon name="envelope" size={18} color={isFocused.email ? "#1DB954" : "#B3B3B3"} style={styles.inputIcon} />
              <TextInput
                placeholder="Email or username"
                placeholderTextColor="#B3B3B3"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                onFocus={() => setIsFocused({...isFocused, email: true})}
                onBlur={() => setIsFocused({...isFocused, email: false})}
                style={[styles.input, isFocused.email && styles.inputFocused]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError ? (
              <Animated.Text 
                style={[styles.errorText, {transform: [{translateX: slideAnim}]}]}
              >
                {emailError}
              </Animated.Text>
            ) : null}

            <View style={[
              styles.inputContainer,
              isFocused.password && styles.inputContainerFocused
            ]}>
              <Icon name="lock" size={18} color={isFocused.password ? "#1DB954" : "#B3B3B3"} style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#B3B3B3"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                onFocus={() => setIsFocused({...isFocused, password: true})}
                onBlur={() => setIsFocused({...isFocused, password: false})}
                secureTextEntry={!showPassword}
                style={[styles.input, isFocused.password && styles.inputFocused, { flex: 1 }]}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon name={showPassword ? "eye-slash" : "eye"} size={18} color="#B3B3B3" />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Animated.Text 
                style={[styles.errorText, {transform: [{translateX: slideAnim}]}]}
              >
                {passwordError}
              </Animated.Text>
            ) : null}

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => navigation.navigate("ForgotPassword")}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>LOG IN</Text>
              )}
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialLoginContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="facebook" size={18} color="#fff" />
                <Text style={styles.socialButtonText}>FACEBOOK</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="google" size={18} color="#fff" />
                <Text style={styles.socialButtonText}>GOOGLE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.socialButton}>
                <Icon name="apple" size={18} color="#fff" />
                <Text style={styles.socialButtonText}>APPLE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("Register")}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
  },
  keyboardAvoidView: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  logoIcon: {
    color: "#fff",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "#B3B3B3",
    fontStyle: "italic",
  },
  formContainer: {
    paddingHorizontal: 24,
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingVertical: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
    color: "#fff",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 4,
    marginBottom: 6,
    paddingHorizontal: 15,
    backgroundColor: "#282828",
    height: 50,
    marginTop: 10,
  },
  inputContainerFocused: {
    borderColor: "#1DB954",
    backgroundColor: "#333",
  },
  inputIcon: {
    marginRight: 12
  },
  eyeIcon: {
    padding: 8
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#fff",
  },
  inputFocused: {
    color: "#fff",
  },
  errorText: {
    color: "#f15e6c",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 5
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 25,
    marginTop: 5,
  },
  forgotPasswordText: {
    color: "#B3B3B3",
    fontSize: 14
  },
  loginButton: {
    borderRadius: 30,
    height: 50,
    marginBottom: 20,
    backgroundColor: "#1DB954",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "rgba(29, 185, 84, 0.5)",
    elevation: 0
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  orText: {
    color: "#B3B3B3",
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: "bold",
  },
  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: "30%",
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10
  },
  registerText: {
    color: "#B3B3B3",
    fontSize: 14
  },
  registerLink: {
    color: "#1DB954",
    fontSize: 14,
    fontWeight: "bold"
  }
});

export default LoginScreen;