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
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import RNGeocoding from 'react-native-geocoding';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import COLORS from '../constants/Colors';
import { showNotification } from '../services/notifeeService';
import { API_KEYS } from '../config/apiKeys';
RNGeocoding.init({
  apiKey: API_KEYS.GOOGLE_MAPS,
  language: 'en',
});

const { width } = Dimensions.get('window');
const UNSPLASH_API_KEY = API_KEYS.UNSPLAH;

const temperatureData = {
  labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
  datasets: [
    {
      data: [12, 15, 18, 22, 20, 16],
      color: (opacity = 1) => `rgba(244, 196, 48, ${opacity})`,
      strokeWidth: 3,
    },
  ],
};

const accuracyData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  datasets: [
    {
      data: [45, 52, 38, 65, 48, 72],
      color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
    },
  ],
};

const locationStatsData = [
  {
    name: 'GPS',
    population: 65,
    color: '#F4C430',
    legendFontColor: '#0F172A',
    legendFontSize: 12,
  },
  {
    name: 'Network',
    population: 25,
    color: '#1E3A8A',
    legendFontColor: '#0F172A',
    legendFontSize: 12,
  },
  {
    name: 'Cached',
    population: 10,
    color: '#3B82F6',
    legendFontColor: '#0F172A',
    legendFontSize: 12,
  },
];

const HomeScreen = ({ navigation }) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const scrollAnim = useState(new Animated.Value(0))[0];

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

  // Photo states
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoadingLocation(true);

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'LocaNova Location Permission',
            message: 'LocaNova needs access to your location',
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
      setLocationError('Permission error');
      setLoadingLocation(false);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      setLoadingAddress(true);
      const API_KEY = API_KEYS.GOOGLE_MAPS;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${API_KEY}`,
      );

      const json = await response.json();

      if (json.status === 'OK' && json.results?.length > 0) {
        const result = json.results[0];

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

        setAddress(result.formatted_address);
        setCity(extractedCity || 'N/A');
        setState(extractedState || 'N/A');
        setCountry(extractedCountry || 'N/A');
        setPostalCode(extractedPostalCode || 'N/A');
        setStreet(extractedStreet || 'N/A');

        if (extractedCity) {
          fetchLocationPhotos(extractedCity);
        }
      }
    } catch (error) {
      console.log('Geocoding error:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const fetchLocationPhotos = async locationName => {
    try {
      setLoadingPhotos(true);
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${locationName}&per_page=8&order_by=popular&client_id=${UNSPLASH_API_KEY}`,
      );

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const photoData = data.results.map(photo => ({
          id: photo.id,
          url: photo.urls.small,
          fullUrl: photo.urls.regular,
          alt: photo.alt_description,
          photographer: photo.user.name,
        }));
        setPhotos(photoData);
      }
    } catch (error) {
      console.log('Photo fetch error:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const getCurrentLocation = () => {
    setLoadingLocation(true);

    let timeoutId;
    let requestComplete = false;

    Geolocation.getCurrentPosition(
      position => {
        if (!requestComplete) {
          requestComplete = true;
          clearTimeout(timeoutId);
          handleLocationSuccess(position);
        }
      },
      error => {
        if (!requestComplete) {
          attemptNetworkLocation();
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    timeoutId = setTimeout(() => {
      if (!requestComplete) {
        requestComplete = true;
        attemptNetworkLocation();
      }
    }, 12000);

    const attemptNetworkLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          requestComplete = true;
          handleLocationSuccess(position);
        },
        error => {
          requestComplete = true;
          setLocationError('Location Services disabled');
          setLoadingLocation(false);
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 },
      );
    };

    const handleLocationSuccess = position => {
      const { latitude, longitude, accuracy } = position.coords;
      setLatitude(latitude);
      setLongitude(longitude);
      setAccuracy(accuracy);
      setLoadingLocation(false);
      reverseGeocode(latitude, longitude);
    };
  };

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // Main Location Card
  const MainLocationCard = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      style={styles.mainCard}
    >
      <View style={styles.mainCardContent}>
        <View style={styles.mainCardTop}>
          <View style={styles.citySection}>
            <Text style={styles.mainCity}>{city}</Text>
            <Text style={styles.mainCountry}>
              {state}, {country}
            </Text>
          </View>
          <View style={styles.accuracyBox}>
            <Image
              source={require('../assets/images/direction.png')}
              style={styles.accuracyIcon}
              resizeMode="contain"
            />
            <Text style={styles.accuracyValue}>{accuracy?.toFixed(0)}m</Text>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
          </View>
        </View>

        <View style={styles.mainCardDetails}>
          <View style={styles.detailItem}>
            <Image
              source={require('../assets/images/map.png')}
              style={styles.detailIcon}
              resizeMode="contain"
            />
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {address?.substring(0, 40)}...
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailItemSmall}>
              <Text style={styles.detailLabelSmall}>Latitude</Text>
              <Text style={styles.detailValueSmall}>
                {latitude?.toFixed(4)}
              </Text>
            </View>
            <View style={styles.detailItemSmall}>
              <Text style={styles.detailLabelSmall}>Longitude</Text>
              <Text style={styles.detailValueSmall}>
                {longitude?.toFixed(4)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  // Info Cards in Grid
  const InfoGrid = () => (
    <View style={styles.gridContainer}>
      <LinearGradient colors={['#F5F7FA', '#FFFFFF']} style={styles.gridCard}>
        <View style={styles.gridIconContainer}>
          <Image
            source={require('../assets/images/interface.png')}
            style={styles.gridIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.gridLabel}>City</Text>
        <Text style={styles.gridValue}>{city}</Text>
      </LinearGradient>

      <LinearGradient colors={['#F5F7FA', '#FFFFFF']} style={styles.gridCard}>
        <View style={styles.gridIconContainer}>
          <Image
            source={require('../assets/images/map.png')}
            style={styles.gridIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.gridLabel}>State</Text>
        <Text style={styles.gridValue}>{state}</Text>
      </LinearGradient>

      <LinearGradient colors={['#F5F7FA', '#FFFFFF']} style={styles.gridCard}>
        <View style={styles.gridIconContainer}>
          <Image
            source={require('../assets/images/mapper.png')}
            style={styles.gridIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.gridLabel}>Country</Text>
        <Text style={styles.gridValue}>{country}</Text>
      </LinearGradient>

      <LinearGradient colors={['#F5F7FA', '#FFFFFF']} style={styles.gridCard}>
        <View style={styles.gridIconContainer}>
          <Image
            source={require('../assets/images/direction.png')}
            style={styles.gridIcon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.gridLabel}>Postal</Text>
        <Text style={styles.gridValue}>{postalCode}</Text>
      </LinearGradient>
    </View>
  );

  // Charts Section
  const ChartsSection = () => (
    <View>
      {/* Temperature Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Image
            source={require('../assets/images/direction.png')}
            style={styles.chartIcon}
            resizeMode="contain"
          />
          <Text style={styles.chartTitle}>Temperature Trend</Text>
        </View>
        <LineChart
          data={temperatureData}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(79, 172, 254, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#F4C430',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Accuracy Bar Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Image
            source={require('../assets/images/mapper.png')}
            style={styles.chartIcon}
            resizeMode="contain"
          />
          <Text style={styles.chartTitle}>Accuracy by Day</Text>
        </View>
        <BarChart
          data={accuracyData}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(30, 58, 138, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={styles.chart}
        />
      </View>

      {/* Pie Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Image
            source={require('../assets/images/interface.png')}
            style={styles.chartIcon}
            resizeMode="contain"
          />
          <Text style={styles.chartTitle}>Location Source</Text>
        </View>
        <PieChart
          data={locationStatsData}
          width={width - 40}
          height={200}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor={'population'}
          backgroundColor={'transparent'}
          paddingLeft={'15'}
          style={styles.chart}
        />
      </View>
    </View>
  );

  // Photo Gallery
  const PhotoGallery = () =>
    photos.length > 0 ? (
      <View style={styles.galleryCard}>
        <View style={styles.galleryHeader}>
          <Image
            source={require('../assets/images/back.png')}
            style={styles.galleryIcon}
            resizeMode="contain"
          />
          <Text style={styles.galleryTitle}>
            Location Photos ({photos.length})
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
        >
          {photos.map(photo => (
            <View key={photo.id} style={styles.photoItemContainer}>
              <LinearGradient
                colors={['rgba(244,196,48,0.2)', 'rgba(30,58,138,0.2)']}
                style={styles.photoGradient}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              </LinearGradient>
              <Text style={styles.photoCredit} numberOfLines={1}>
                © {photo.photographer}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    ) : null;

  if (loadingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
          { useNativeDriver: false },
        )}
      >
        {/* Header */}
        <LinearGradient colors={['#FFFFFF', '#1E3A8A']} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Image
                source={require('../assets/images/map.png')}
                style={styles.headerIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.headerGreeting}>LocaNova</Text>
            <Text style={styles.headerSubtitle}>
              Your - Location - Dashboard
            </Text>
          </View>
        </LinearGradient>

        {/* Main Card */}
        <View style={styles.mainCardWrapper}>
          {locationError ? (
            <LinearGradient
              colors={['#FFE5E5', '#FFF0F0']}
              style={styles.errorCard}
            >
              <Text style={styles.errorText}>⚠️ {locationError}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={getCurrentLocation}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <MainLocationCard />
          )}
        </View>

        {/* Info Grid */}
        <View style={styles.section}>
          <InfoGrid />
        </View>

        {/* Charts */}
        <View style={styles.section}>
          <ChartsSection />
        </View>

        {/* Photos */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <PhotoGallery />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={getCurrentLocation}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.actionBtn}
              >
                <Image
                  source={require('../assets/images/direction.png')}
                  style={styles.actionBtnIcon}
                  resizeMode="contain"
                />
                <Text style={styles.actionBtnText}>Refresh</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => navigation.navigate('Map')}
            >
              <LinearGradient
                colors={[COLORS.accentDark, COLORS.accent]}
                style={styles.actionBtn}
              >
                <Image
                  source={require('../assets/images/mapper.png')}
                  style={styles.actionBtnIcon}
                  resizeMode="contain"
                />
                <Text style={styles.actionBtnText}>Map</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={showNotification}
            >
              <LinearGradient
                colors={[COLORS.success, '#10B981']}
                style={styles.actionBtn}
              >
                <Image
                  source={require('../assets/images/bell.png')}
                  style={styles.actionBtnIcon}
                  resizeMode="contain"
                />
                <Text style={styles.actionBtnText}>Notify</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#1E3A8A',
  },
  headerContent: {
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  headerGreeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Main Card
  mainCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 20,
  },
  mainCard: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    elevation: 10,
  },
  mainCardContent: {
    gap: 16,
  },
  mainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  citySection: {
    flex: 1,
  },
  mainCity: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  mainCountry: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  accuracyBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  accuracyIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  accuracyLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  mainCardDetails: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  detailIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginTop: 2,
  },
  detailTextContainer: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailItemSmall: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 10,
  },
  detailLabelSmall: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  detailValueSmall: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },

  // Error Card
  errorCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
    marginBottom: 14,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 13,
  },

  // Grid
  section: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: (width - 48) / 2,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    elevation: 4,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  gridIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridIcon: {
    width: 22,
    height: 22,
    tintColor: COLORS.primary,
  },
  gridLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Charts
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  chartIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chart: {
    borderRadius: 16,
  },

  // Gallery
  galleryCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  galleryIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  galleryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  photoScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  photoItemContainer: {
    marginRight: 12,
    alignItems: 'center',
  },
  photoGradient: {
    width: 130,
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoCredit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
    paddingHorizontal: 2,
    maxWidth: 130,
  },

  // Action Buttons
  buttonsSection: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    flexDirection: 'row',
  },
  actionBtnIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
    marginRight: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
