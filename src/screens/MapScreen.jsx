import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  StatusBar,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import COLORS from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const API_KEY = 'AIzaSyBq4mftWSM9PiQUNl376pzHH6DMn2FK1Yg';

const MapScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [searchText, setSearchText] = useState('');
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [region, setRegion] = useState({
    latitude: 26.9124,
    longitude: 75.7873,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setMarkerLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      },
      error => console.log(error),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSelectedPlace(null);
    if (searchRef.current) {
      searchRef.current.setAddressText('');
    }
    if (inputRef.current) {
      inputRef.current.clear();
    }
  };

  const calculateDistance = () => {
    if (location && markerLocation) {
      const lat1 = location.latitude;
      const lon1 = location.longitude;
      const lat2 = markerLocation.latitude;
      const lon2 = markerLocation.longitude;

      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance.toFixed(2);
    }
    return '0.00';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="dark-content" />
      <View style={styles.container}>
        {/* Fixed Map Container - Centered */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {markerLocation && (
              <Marker
                coordinate={markerLocation}
                title="Location"
                description="Yahan hai!"
              />
            )}
          </MapView>

          {/* Back Button - Top Left */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Image
              source={require('../assets/images/back.png')}
              style={styles.imageIcons}
              resizeMode="contain"
              tintColor="#000"
            />
          </TouchableOpacity>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <GooglePlacesAutocomplete
                ref={searchRef}
                placeholder="Jagah dhundho..."
                placeholderTextColor="#999"
                fetchDetails={true}
                debounce={400}
                onPress={(data, details = null) => {
                  if (details) {
                    const { lat, lng } = details.geometry.location;
                    const name = data.main_text || data.description;
                    setSelectedPlace(name);
                    setMarkerLocation({ latitude: lat, longitude: lng });
                    setRegion({
                      latitude: lat,
                      longitude: lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                  }
                }}
                textInputProps={{
                  ref: inputRef,
                  onChangeText: text => {
                    setSearchText(text);
                  },
                  value: searchText,
                }}
                query={{
                  key: API_KEY,
                  language: 'hi',
                  components: 'country:in',
                }}
                styles={{
                  container: styles.autocompleteContainer,
                  textInput: styles.searchInput,
                  listView: styles.searchList,
                  row: styles.searchRow,
                  description: styles.searchDescription,
                }}
                renderLeftButton={() => (
                  <View style={styles.searchIcon}>
                    <Text style={{ fontSize: 18 }}>🔍</Text>
                  </View>
                )}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleClearSearch}
                  activeOpacity={0.6}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* My Location Button */}
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={getCurrentLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.locationBtnText}>📍 My Location</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Details Panel */}
        <View style={styles.detailsPanel}>
          {markerLocation ? (
            <>
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>📍 Selected Location:</Text>
                <Text style={styles.detailsValue}>
                  {selectedPlace ||
                    `${markerLocation.latitude.toFixed(
                      4,
                    )}, ${markerLocation.longitude.toFixed(4)}`}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>📏 Distance:</Text>
                <Text style={styles.distanceValue}>
                  {calculateDistance()} km
                </Text>
              </View>

              <TouchableOpacity style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Confirm Location</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Select a location to see details
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  mapContainer: {
    flex: 0,
    width: width - 30,
    height: height * 0.66,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },

  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  searchContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    zIndex: 999,
  },
  searchWrapper: {
    position: 'relative',
  },
  autocompleteContainer: {
    flex: 0,
    position: 'relative',
  },
  searchInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 45,
    paddingRight: 45,
    fontSize: 14,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
    color: '#333',
    fontWeight: '500',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 13,
    zIndex: 5,
  },
  searchList: {
    borderRadius: 10,
    marginTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: '#fff',
  },
  searchRow: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  searchDescription: {
    color: '#666',
    fontSize: 13,
  },

  backBtn: {
    position: 'absolute',
    top: 20,
    left: 15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1000,
  },
  imageIcons: {
    width: 22,
    height: 22,
  },

  clearBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 13,
  },
  clearBtnText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },

  locationBtn: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  locationBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Details Panel Styles
  detailsPanel: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },

  detailsRow: {
    marginVertical: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },

  distanceValue: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: 'bold',
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },

  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
