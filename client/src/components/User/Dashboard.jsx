import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
  ImageBackground,
  TextInput,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from "react-native";

const IMAGES = {
  taylorSwift: require('../../assets/artists/taylor_swift.jpg'),
  theWeeknd: require('../../assets/artists/the_weeknd.jpg'),
  brunomars: require('../../assets/artists/brunomars.jpg'),
  drake: require('../../assets/artists/drake.jpg'),
  billieEilish: require('../../assets/artists/billie_eilish.jpg'),
  
  tshirt: require('../../assets/merch/tshirt.jpg'),
  hoodie: require('../../assets/merch/hoodie.jpg'),
  poster: require('../../assets/merch/poster.jpg'),
  
  festival: require('../../assets/events/festival.jpg'),
  acoustic: require('../../assets/events/acoustic.jpg'),
  electronic: require('../../assets/events/electronic.jpg'),
  
  workout: require('../../assets/playlists/workout.png'),
  chill: require('../../assets/playlists/chill.jpg'),
  party: require('../../assets/playlists/party.png'),
  focus: require('../../assets/playlists/focus.png'),
  
  nowPlaying: require('../../assets/nowplaying.png'),
  userPlaceholder: require('../../assets/user_placeholder.png')
};

const { width, height } = Dimensions.get('window');

const featuredArtists = [
  { id: '1', name: 'Taylor Swift', image: IMAGES.taylorSwift, genre: 'Pop' },
  { id: '2', name: 'The Weeknd', image: IMAGES.theWeeknd, genre: 'R&B' },
  { id: '3', name: 'Bruno Mars', image: IMAGES.brunomars, genre: 'reggae' },
  { id: '4', name: 'Drake', image: IMAGES.drake, genre: 'Hip Hop' },
  { id: '5', name: 'Billie Eilish', image: IMAGES.billieEilish, genre: 'Alternative' },
];

const merchandise = [
  { id: '1', name: 'Artist T-Shirt', price: '₱500', image: IMAGES.tshirt },
  { id: '2', name: 'Concert Hoodie', price: '₱1000', image: IMAGES.hoodie },
  { id: '3', name: 'Signed Poster', price: '₱800', image: IMAGES.poster },
];

const upcomingEvents = [
  { id: '1', name: 'Summer Beats Festival', date: 'May 15, 2025', location: 'Central Park, NY', image: IMAGES.festival },
  { id: '2', name: 'Acoustic Night', date: 'June 2, 2025', location: 'The Blue Note, Chicago', image: IMAGES.acoustic },
  { id: '3', name: 'Electronic Weekend', date: 'June 25, 2025', location: 'Miami Beach', image: IMAGES.electronic },
];

const featuredPlaylists = [
  { id: '1', name: 'Workout Hits', tracks: '35 tracks', image: IMAGES.workout },
  { id: '2', name: 'Chill Vibes', tracks: '42 tracks', image: IMAGES.chill },
  { id: '3', name: 'Weekend Party', tracks: '28 tracks', image: IMAGES.party },
  { id: '4', name: 'Focus Flow', tracks: '50 tracks', image: IMAGES.focus },
];

// Login Screen Component
const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Simple validation
    if (username.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    
    // Here you would typically authenticate with your backend
    // For demo purposes, we're just simulating successful login
    
    // Set user as logged in and navigate to user dashboard
    navigation.navigate('UserDashboard');
  };

  return (
    <View style={loginStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={loginStyles.logoContainer}>
        <Icon name="music" size={50} color="#1DB954" />
        <Text style={loginStyles.logoText}>MelodyMix</Text>
        <Text style={loginStyles.subtext}>Sign in to access your account</Text>
      </View>
      
      <View style={loginStyles.formContainer}>
        <View style={loginStyles.inputContainer}>
          <Icon name="user" size={18} color="#B3B3B3" style={loginStyles.inputIcon} />
          <TextInput
            style={loginStyles.input}
            placeholder="Username or Email"
            placeholderTextColor="#B3B3B3"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        
        <View style={loginStyles.inputContainer}>
          <Icon name="lock" size={18} color="#B3B3B3" style={loginStyles.inputIcon} />
          <TextInput
            style={loginStyles.input}
            placeholder="Password"
            placeholderTextColor="#B3B3B3"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity style={loginStyles.forgotPassword}>
          <Text style={loginStyles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={loginStyles.loginButton} onPress={handleLogin}>
          <Text style={loginStyles.loginButtonText}>SIGN IN</Text>
        </TouchableOpacity>
        
        <View style={loginStyles.separator}>
          <View style={loginStyles.line} />
          <Text style={loginStyles.separatorText}>OR</Text>
          <View style={loginStyles.line} />
        </View>
        
        <View style={loginStyles.socialButtons}>
          <TouchableOpacity style={[loginStyles.socialButton, { backgroundColor: '#3b5998' }]}>
            <Icon name="facebook" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[loginStyles.socialButton, { backgroundColor: '#db4437' }]}>
            <Icon name="google" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[loginStyles.socialButton, { backgroundColor: '#000' }]}>
            <Icon name="apple" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={loginStyles.signupContainer}>
          <Text style={loginStyles.signupText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={loginStyles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity 
        style={loginStyles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={loginStyles.backButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

// User Dashboard Component (after login)
const UserDashboard = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Dashboard</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="ellipsis-v" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={userStyles.profileSection}>
          <Image source={IMAGES.userPlaceholder} style={userStyles.profileImage} />
          <Text style={userStyles.username}>Username</Text>
          <Text style={userStyles.memberStatus}>Premium Member</Text>
          
          <View style={userStyles.statsContainer}>
            <View style={userStyles.statItem}>
              <Text style={userStyles.statValue}>47</Text>
              <Text style={userStyles.statLabel}>Playlists</Text>
            </View>
            <View style={userStyles.statItem}>
              <Text style={userStyles.statValue}>182</Text>
              <Text style={userStyles.statLabel}>Following</Text>
            </View>
            <View style={userStyles.statItem}>
              <Text style={userStyles.statValue}>95</Text>
              <Text style={userStyles.statLabel}>Followers</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Library</Text>
          <View style={userStyles.menuGrid}>
            <TouchableOpacity style={userStyles.menuItem}>
              <View style={userStyles.menuIcon}>
                <Icon name="music" size={20} color="#1DB954" />
              </View>
              <Text style={userStyles.menuText}>Playlists</Text>
            </TouchableOpacity>
            <TouchableOpacity style={userStyles.menuItem}>
              <View style={userStyles.menuIcon}>
                <Icon name="history" size={20} color="#1DB954" />
              </View>
              <Text style={userStyles.menuText}>Recently Played</Text>
            </TouchableOpacity>
            <TouchableOpacity style={userStyles.menuItem}>
              <View style={userStyles.menuIcon}>
                <Icon name="heart" size={20} color="#1DB954" />
              </View>
              <Text style={userStyles.menuText}>Liked Songs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={userStyles.menuItem}>
              <View style={userStyles.menuIcon}>
                <Icon name="microphone-alt" size={20} color="#1DB954" />
              </View>
              <Text style={userStyles.menuText}>Artists</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Orders</Text>
          <View style={userStyles.emptyState}>
            <Icon name="shopping-bag" size={40} color="#1DB954" />
            <Text style={userStyles.emptyStateText}>No orders yet</Text>
            <TouchableOpacity style={userStyles.browseButton}>
              <Text style={userStyles.browseButtonText}>Browse Shop</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={userStyles.ticketContainer}>
            <ImageBackground source={IMAGES.festival} style={userStyles.ticketImage}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={userStyles.ticketGradient}
              >
                <View style={userStyles.ticketContent}>
                  <Text style={userStyles.ticketTitle}>Summer Beats Festival</Text>
                  <Text style={userStyles.ticketDate}>May 15, 2025</Text>
                  <View style={userStyles.ticketBadge}>
                    <Text style={userStyles.ticketBadgeText}>1 Ticket</Text>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={userStyles.settingsList}>
            <TouchableOpacity style={userStyles.settingsItem}>
              <Icon name="user-cog" size={18} color="#1DB954" />
              <Text style={userStyles.settingsText}>Edit Profile</Text>
              <Icon name="chevron-right" size={16} color="#B3B3B3" />
            </TouchableOpacity>
            <TouchableOpacity style={userStyles.settingsItem}>
              <Icon name="credit-card" size={18} color="#1DB954" />
              <Text style={userStyles.settingsText}>Payment Methods</Text>
              <Icon name="chevron-right" size={16} color="#B3B3B3" />
            </TouchableOpacity>
            <TouchableOpacity style={userStyles.settingsItem}>
              <Icon name="bell" size={18} color="#1DB954" />
              <Text style={userStyles.settingsText}>Notifications</Text>
              <Icon name="chevron-right" size={16} color="#B3B3B3" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={userStyles.settingsItem}
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="sign-out-alt" size={18} color="#ff4d4d" />
              <Text style={[userStyles.settingsText, { color: '#ff4d4d' }]}>Sign Out</Text>
              <Icon name="chevron-right" size={16} color="#B3B3B3" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const HomeDashboard = ({ navigation }) => {
  const [currentTab, setCurrentTab] = useState('Home');
  const scrollY = new Animated.Value(0);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const searchBarTranslate = useState(new Animated.Value(-50))[0];

  // Header opacity for scroll effect
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    // Animate content fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  const toggleSearch = () => {
    if (!showSearch) {
      setShowSearch(true);
      Animated.timing(searchBarTranslate, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(searchBarTranslate, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true
      }).start(() => setShowSearch(false));
    }
  };

  // Function to handle tab navigation with login check
  const handleTabPress = (tabName) => {
    // If user tries to access Shop tab or other protected areas
    if ((tabName === 'Shop' || tabName === 'Library') && !isLoggedIn) {
      // Prompt for login
      Alert.alert(
        "Login Required",
        `Please log in to access the ${tabName} area.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => navigation.navigate('Login') }
        ]
      );
    } else {
      setCurrentTab(tabName);
      // Navigate to appropriate screen (for actual implementation)
    }
  };

  const renderArtistItem = ({ item }) => (
    <TouchableOpacity style={styles.artistCard}>
      <Image 
        source={item.image} 
        style={styles.artistImage} 
      />
      <Text style={styles.artistName}>{item.name}</Text>
      <Text style={styles.artistGenre}>{item.genre}</Text>
    </TouchableOpacity>
  );

  const renderMerchandiseItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.merchCard}
      onPress={() => {
        if (!isLoggedIn) {
          Alert.alert(
            "Login Required",
            "Please log in to view merchandise details and make purchases.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Log In", onPress: () => navigation.navigate('Login') }
            ]
          );
        } else {
      
        }
      }}
    >
      <Image 
        source={item.image} 
        style={styles.merchImage} 
      />
      <Text style={styles.merchName}>{item.name}</Text>
      <Text style={styles.merchPrice}>{item.price}</Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.eventCard}>
      <ImageBackground 
        source={item.image} 
        style={styles.eventImage}
        imageStyle={{ borderRadius: 12 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.eventGradient}
        >
          <Text style={styles.eventName}>{item.name}</Text>
          <View style={styles.eventInfo}>
            <Icon name="calendar" size={12} color="#1DB954" style={styles.eventIcon} />
            <Text style={styles.eventDate}>{item.date}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Icon name="map-marker-alt" size={12} color="#1DB954" style={styles.eventIcon} />
            <Text style={styles.eventLocation}>{item.location}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity style={styles.playlistCard}>
      <Image 
        source={item.image} 
        style={styles.playlistImage} 
      />
      <View style={styles.playlistContent}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistTracks}>{item.tracks}</Text>
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Icon name="play" size={16} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <Text style={styles.headerTitle}>MelodyMix</Text>
      </Animated.View>
      
      {/* Main Content */}
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="music" size={26} color="#1DB954" />
            <Text style={styles.logoText}>MelodyMix</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
              <Icon name="search" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="bell" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Icon name="user" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        {showSearch && (
          <Animated.View 
            style={[
              styles.searchContainer, 
              { transform: [{ translateY: searchBarTranslate }] }
            ]}
          >
            <Icon name="search" size={16} color="#B3B3B3" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search artists, songs, or albums"
              placeholderTextColor="#B3B3B3"
              autoFocus
            />
          </Animated.View>
        )}
        
        {/* Now Playing */}
        <TouchableOpacity style={styles.nowPlayingBar}>
          <Image 
            source={IMAGES.nowPlaying} 
            style={styles.nowPlayingImage} 
          />
          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingSong}>Blinding Lights</Text>
            <Text style={styles.nowPlayingArtist}>The Weeknd</Text>
          </View>
          <View style={styles.playControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Icon name="step-backward" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playPauseButton}>
              <Icon name="pause" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Icon name="step-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {/* Featured Artists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Artists</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredArtists}
            renderItem={renderArtistItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artistList}
          />
        </View>
        
        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={upcomingEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventList}
          />
        </View>
        
        {/* Merchandise */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Merchandise</Text>
            <TouchableOpacity 
              onPress={() => {
                if (!isLoggedIn) {
                  navigation.navigate('Login');
                } else {
                  // Navigate to full shop if logged in
                }
              }}
            >
              <Text style={styles.seeAllText}>Shop All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={merchandise}
            renderItem={renderMerchandiseItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.merchList}
          />
        </View>
        
        {/* Featured Playlists */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Playlists</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.playlistsContainer}>
            {featuredPlaylists.map(item => renderPlaylistItem({ item }))}
          </View>
        </View>
        
        {/* Spacing for bottom tabs */}
        <View style={{ height: 80 }} />
      </Animated.ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'Home' && styles.activeTab]} 
          onPress={() => handleTabPress('Home')}
        >
          <Icon name="home" size={20} color={currentTab === 'Home' ? '#1DB954' : '#B3B3B3'} />
          <Text style={[styles.tabText, currentTab === 'Home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'Explore' && styles.activeTab]}
          onPress={() => handleTabPress('Explore')}
        >
          <Icon name="compass" size={20} color={currentTab === 'Explore' ? '#1DB954' : '#B3B3B3'} />
          <Text style={[styles.tabText, currentTab === 'Explore' && styles.activeTabText]}>Explore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'Library' && styles.activeTab]}
          onPress={() => handleTabPress('Library')}
        >
          <Icon name="book" size={20} color={currentTab === 'Library' ? '#1DB954' : '#B3B3B3'} />
          <Text style={[styles.tabText, currentTab === 'Library' && styles.activeTabText]}>Library</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'Shop' && styles.activeTab]}
          onPress={() => handleTabPress('Shop')}
        >
          <Icon name="shopping-bag" size={20} color={currentTab === 'Shop' ? '#1DB954' : '#B3B3B3'} />
          <Text style={[styles.tabText, currentTab === 'Shop' && styles.activeTabText]}>Shop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Existing styles from your code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 5,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#1DB954',
    fontSize: 14,
  },
  artistList: {
    paddingRight: 16,
  },
  artistCard: {
    width: 110,
    marginRight: 12,
    alignItems: 'center',
  },
  artistImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 8,
  },
  artistName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistGenre: {
    color: '#B3B3B3',
    fontSize: 12,
    textAlign: 'center',
  },
  eventList: {
    paddingRight: 16,
  },
  eventCard: {
    width: 280,
    height: 160,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  eventName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventIcon: {
    marginRight: 6,
  },
  eventDate: {
    color: '#ddd',
    fontSize: 12,
  },
  eventLocation: {
    color: '#ddd',
    fontSize: 12,
  },
  merchList: {
    paddingRight: 16,
  },
  merchCard: {
    width: 140,
    marginRight: 16,
  },
  merchImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  merchName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  merchPrice: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  playlistsContainer: {
    marginBottom: 16,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#282828',
    borderRadius: 8,
    padding: 8,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  playlistContent: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  playlistTracks: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowPlayingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 10,
  },
  nowPlayingImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  nowPlayingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nowPlayingSong: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  nowPlayingArtist: {
    color: '#B3B3B3',
    fontSize: 12,
  },
  playControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  playPauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  bottomTabs: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#282828',
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 4,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#1DB954',
  },
  activeTabText: {
    color: '#1DB954',
  }
});

// Login screen styles
const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtext: {
    color: '#B3B3B3',
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 50,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#1DB954',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#1DB954',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  separatorText: {
    color: '#B3B3B3',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  signupLink: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#B3B3B3',
    fontSize: 14,
  }
});

// User Dashboard styles
const userStyles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberStatus: {
    color: '#1DB954',
    fontSize: 14,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#282828',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#282828',
    borderRadius: 8,
  },
  emptyStateText: {
    color: '#B3B3B3',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  browseButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  ticketContainer: {
    marginTop: 10,
  },
  ticketImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ticketGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  ticketContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  ticketDate: {
    color: '#ddd',
    fontSize: 12,
  },
  ticketBadge: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ticketBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsList: {
    backgroundColor: '#282828',
    borderRadius: 8,
    marginTop: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingsText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  }
});

export default HomeDashboard;
