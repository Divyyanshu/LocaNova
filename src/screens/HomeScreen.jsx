import React, { useState, useEffect } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import RNGeocoding from 'react-native-geocoding';
import COLORS from '../constants/Colors';
import { showNotification } from '../services/notifeeService';
RNGeocoding.init({
  apiKey: 'AIzaSyDAQQ_gtTyOOfqPiR7t7pdPw7drgUuggN8',
  language: 'en',
});

const isIOS = Platform.OS === 'ios';

const HomeScreen = ({ navigation }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  // Location states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // Address states
  const [address, setAddress] = useState(null);
  const [city, setCity] = useState(null);
  const [state, setState] = useState(null);
  const [country, setCountry] = useState(null);
  const [postalCode, setPostalCode] = useState(null);
  const [street, setStreet] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [geocodingOrigin, setGeocodingOrigin] = useState(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);
      setLocationError(null);

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'LocaNova Location Permission',
            message: 'LocaNova needs access to your location to work properly',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setLocationError('Location permission denied');
          setLoadingLocation(false);
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.log('Permission error:', err);
      setLocationError('Error requesting permission');
      setLoadingLocation(false);
    }
  };
  const reverseGeocode = async (lat, lon) => {
    try {
      setLoadingAddress(true);
      setAddressError(null);

      const API_KEY = 'AIzaSyDAQQ_gtTyOOfqPiR7t7pdPw7drgUuggN8';

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${API_KEY}`,
      );

      const json = await response.json();
      console.log('Geocoding Response:', json);

      if (json.status === 'OK' && json.results?.length > 0) {
        const result = json.results[0];
        const fullAddress = result.formatted_address;

        let extractedCity = '',
          extractedState = '',
          extractedCountry = '',
          extractedPostalCode = '',
          extractedStreet = '';

        result.address_components?.forEach(component => {
          const types = component.types;
          if (types.includes('route')) extractedStreet = component.long_name;
          if (types.includes('locality')) extractedCity = component.long_name;
          if (types.includes('administrative_area_level_1'))
            extractedState = component.long_name;
          if (types.includes('country')) extractedCountry = component.long_name;
          if (types.includes('postal_code'))
            extractedPostalCode = component.long_name;
        });

        setAddress(fullAddress);
        setCity(extractedCity || 'N/A');
        setState(extractedState || 'N/A');
        setCountry(extractedCountry || 'N/A');
        setPostalCode(extractedPostalCode || 'N/A');
        setStreet(extractedStreet || 'N/A');
      } else {
        setAddressError(
          json.error_message || json.status || 'Failed to get address',
        );
      }
    } catch (error) {
      console.log('Geocoding error:', error);
      setAddressError('Network or server error');
    } finally {
      setLoadingAddress(false);
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        setLatitude(latitude);
        setLongitude(longitude);
        setAccuracy(accuracy);
        setLoadingLocation(false);
        reverseGeocode(latitude, longitude);
      },
      error => {
        console.log('Location Error:', error);
        setLocationError(error.message || 'Could not fetch location');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const AddressCard = () => {
    if (loadingAddress) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={styles.spinner}
          />
          <Text style={styles.loadingText}>Fetching address details...</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={styles.locationItem}>
          <View style={styles.labelRow}>
            <View style={styles.dot} />
            <Text style={styles.label}>Full Address</Text>
          </View>
          <Text style={[styles.value, { fontSize: 14.5 }]}>
            {address || 'Address not available'}
          </Text>
        </View>

        {addressError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{addressError}</Text>
            {geocodingOrigin && (
              <Text style={[styles.errorText, { fontSize: 11, marginTop: 6 }]}>
                Origin: {JSON.stringify(geocodingOrigin).slice(0, 180)}...
              </Text>
            )}
          </View>
        )}

        <View style={styles.separator} />

        {[
          { label: 'City', value: city },
          { label: 'State', value: state },
          { label: 'Country', value: country },
          { label: 'Pincode', value: postalCode },
          { label: 'Street', value: street },
        ].map((item, index) => (
          <React.Fragment key={index}>
            <View style={styles.locationItem}>
              <View style={styles.labelRow}>
                <View style={styles.dot} />
                <Text style={styles.label}>{item.label}</Text>
              </View>
              <Text style={styles.value}>{item.value || 'N/A'}</Text>
            </View>
            <View style={styles.separator} />
          </React.Fragment>
        ))}

        {/* Latitude & Longitude */}
        <View style={styles.locationItem}>
          <View style={styles.labelRow}>
            <View style={styles.dot} />
            <Text style={styles.label}>Latitude</Text>
          </View>
          <Text style={styles.value}>
            {latitude ? latitude.toFixed(6) : 'N/A'}
          </Text>
        </View>
        <View style={styles.separator} />

        <View style={styles.locationItem}>
          <View style={styles.labelRow}>
            <View style={styles.dot} />
            <Text style={styles.label}>Longitude</Text>
          </View>
          <Text style={styles.value}>
            {longitude ? longitude.toFixed(6) : 'N/A'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[COLORS.white, '#F8F8F8']}
                style={styles.logoBg}
              >
                <Image
                  source={require('../assets/images/map.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            <Text style={styles.title}>LocaNova</Text>
            <Text style={styles.subtitle}>Explore • Navigate • Discover</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Smart Location Companion</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Current Location Card */}
        <View style={styles.cardContainer}>
          <LinearGradient colors={[COLORS.card, '#FAFAFA']} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Image
                  source={require('../assets/images/interface.png')}
                  style={styles.cardIconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle}>Current Location</Text>
            </View>

            {loadingLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={styles.spinner}
                />
                <Text style={styles.loadingText}>
                  Fetching your location...
                </Text>
              </View>
            ) : locationError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{locationError}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.locationInfoBox}>
                <AddressCard />
                <View style={styles.statusBox}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    Accuracy:{' '}
                    <Text style={styles.statusValue}>
                      {accuracy ? `${accuracy.toFixed(0)}m` : '—'}
                    </Text>
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>
        <View style={styles.buttonsSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.7}
              style={styles.buttonWrapper}
              onPress={getCurrentLocation}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.button}
              >
                <Image
                  source={require('../assets/images/direction.png')}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.buttonText}>Refresh Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.7}
              style={styles.buttonWrapper}
              onPress={() => navigation.navigate('Map')}
            >
              <LinearGradient
                colors={[COLORS.primaryDark, COLORS.primary]}
                style={styles.button}
              >
                <Image
                  source={require('../assets/images/mapper.png')}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.buttonText}>Open Google Map</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.7}
              style={styles.buttonWrapper}
              onPress={showNotification}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.button}
              >
                <Image
                  source={require('../assets/images/bell.png')}
                  style={styles.buttonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.buttonText}>Send Notification</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Stats Footer - FIXED */}
        <View style={styles.statsWrapper}>
          <LinearGradient
            colors={[COLORS.card, '#FAFAFA']}
            style={styles.statsContainer}
          >
            <View style={styles.stat}>
              <Image
                source={require('../assets/images/direction.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Locations</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Image
                source={require('../assets/images/bell.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Notifications</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.stat}>
              <Image
                source={require('../assets/images/mapper.png')}
                style={styles.statIcon}
                resizeMode="contain"
              />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Maps</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },

  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  header: { alignItems: 'center' },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 12,
  },
  logoBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 65, height: 65 },
  title: { fontSize: 36, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  badge: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },

  cardContainer: { paddingHorizontal: 16, marginTop: -20, marginBottom: 24 },
  card: { borderRadius: 24, padding: 22, minHeight: 220, elevation: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconImage: { width: 24, height: 24, tintColor: COLORS.primary },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  spinner: { marginBottom: 16 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },

  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: {
    fontSize: 13,
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  locationInfoBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  locationItem: { paddingVertical: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  label: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
    marginVertical: 8,
  },

  statusBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  statusText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  statusValue: { color: COLORS.primary, fontWeight: '700' },

  buttonsSection: { paddingHorizontal: 16, marginBottom: 28, gap: 12 },
  buttonWrapper: { width: '100%' },
  button: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 54,
    elevation: 8,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: COLORS.buttonText,
  },
  buttonText: { color: COLORS.buttonText, fontSize: 15, fontWeight: '700' },

  statsWrapper: { paddingHorizontal: 16, marginBottom: 20 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 20,
    elevation: 6,
  },
  stat: { alignItems: 'center', flex: 1 },
  statIcon: {
    width: 24,
    height: 24,
    marginBottom: 8,
    tintColor: COLORS.textSecondary,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  statDivider: {
    width: 1,
    height: 45,
    backgroundColor: COLORS.border || '#ddd',
  },
});
