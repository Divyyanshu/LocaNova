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
  Dimensions,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showNotification } from '../services/notifeeService';
import COLORS from '../constants/Colors';
import { API_KEYS } from '../config/apiKeys';

const { width, height } = Dimensions.get('window');
const API_KEY = API_KEYS.GOOGLE_MAPS;
const TRAVEL_MODES = [
  {
    key: 'walking',
    label: 'Walk',
    icon: require('../assets/images/direction.png'),
    color: '#10B981',
    speedKmh: 5,
  },
  {
    key: 'bicycling',
    label: 'Bike',
    icon: require('../assets/images/mapper.png'),
    color: '#F59E0B',
    speedKmh: 15,
  },
  {
    key: 'driving',
    label: 'Bus',
    icon: require('../assets/images/map.png'),
    color: '#3B82F6',
    speedKmh: 30,
  },
];

// Haversine straight-line distance (km)
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatTime = minutes => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatDist = km =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

const RouteScreen = ({ navigation, route }) => {
  const { startCoords, endCoords } = route?.params || {};

  // Animated values
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const mapRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [origin, setOrigin] = useState(startCoords || null);
  const [destination] = useState(endCoords || null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [selectedMode, setSelectedMode] = useState('walking');
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState(null);
  const [notifSent, setNotifSent] = useState(false);

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    requestLocation();
    // Entry animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    // Pulse for current-location dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // ── Fetch route whenever origin, destination or mode changes ─────────────
  useEffect(() => {
    if (origin && destination) {
      fetchRoute(origin, destination, selectedMode);
    }
  }, [origin, destination, selectedMode]);

  // ── Send notification once route is loaded ───────────────────────────────
  useEffect(() => {
    if (routeInfo && !notifSent) {
      setNotifSent(true);
      const mode = TRAVEL_MODES.find(m => m.key === selectedMode);
      showNotification({
        title: 'Route Ready',
        body: `${routeInfo.distanceText} away · ${routeInfo.durationText} by ${mode?.label}`,
      });
    }
  }, [routeInfo]);

  // ── Fit map to show full route ────────────────────────────────────────────
  useEffect(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 80, right: 40, bottom: 260, left: 40 },
        animated: true,
      });
    }
  }, [routeCoords]);

  const requestLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED)
          getCurrentLocation();
        else {
          setError('Location permission denied');
          setLoading(false);
        }
      } else {
        getCurrentLocation();
      }
    } catch {
      setError('Permission error');
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ latitude, longitude });
        if (!startCoords) {
          setOrigin({ latitude, longitude, name: 'My Location' });
        }
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setLoading(false);
      },
      () => {
        // Fallback: use Jaipur centre
        const fallback = { latitude: 26.9124, longitude: 75.7873 };
        setCurrentLocation(fallback);
        if (!startCoords) setOrigin({ ...fallback, name: 'My Location' });
        setRegion({ ...fallback, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // ── Google Directions API ─────────────────────────────────────────────────
  const fetchRoute = async (from, to, mode) => {
    if (!from || !to) return;
    setRouteLoading(true);
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${from.latitude},${from.longitude}` +
        `&destination=${to.latitude},${to.longitude}` +
        `&mode=${mode}` +
        `&key=${API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        setRouteInfo({
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          distanceValue: leg.distance.value / 1000, // km
          durationValue: leg.duration.value / 60, // minutes
          startAddress: leg.start_address,
          endAddress: leg.end_address,
        });
      } else {
        // Fallback: straight line
        setRouteCoords([
          { latitude: from.latitude, longitude: from.longitude },
          { latitude: to.latitude, longitude: to.longitude },
        ]);
        const km = haversineKm(
          from.latitude,
          from.longitude,
          to.latitude,
          to.longitude,
        );
        const spd = TRAVEL_MODES.find(m => m.key === mode)?.speedKmh || 5;
        setRouteInfo({
          distanceText: formatDist(km),
          durationText: formatTime((km / spd) * 60),
          distanceValue: km,
          durationValue: (km / spd) * 60,
          startAddress: from.name || 'Start',
          endAddress: to.name || 'Destination',
        });
      }
    } catch {
      setError('Could not fetch route');
    } finally {
      setRouteLoading(false);
    }
  };

  // Google encoded polyline decoder
  const decodePolyline = encoded => {
    const pts = [];
    let idx = 0,
      lat = 0,
      lng = 0;
    while (idx < encoded.length) {
      let shift = 0,
        result = 0,
        b;
      do {
        b = encoded.charCodeAt(idx++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(idx++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;
      pts.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return pts;
  };

  const activeModeColor =
    TRAVEL_MODES.find(m => m.key === selectedMode)?.color || COLORS.primary;

  // ── Displacement (straight-line from current → destination) ──────────────
  const displacement =
    currentLocation && destination
      ? haversineKm(
          currentLocation.latitude,
          currentLocation.longitude,
          destination.latitude,
          destination.longitude,
        )
      : null;

  // ── Stat cards data ───────────────────────────────────────────────────────
  const stats = routeInfo
    ? [
        {
          label: 'Route Distance',
          value: routeInfo.distanceText,
          icon: require('../assets/images/direction.png'),
          color: '#3B82F6',
        },
        {
          label: 'Travel Time',
          value: routeInfo.durationText,
          icon: require('../assets/images/interface.png'),
          color: '#10B981',
        },
        {
          label: 'Displacement',
          value: displacement ? formatDist(displacement) : '—',
          icon: require('../assets/images/mapper.png'),
          color: '#F59E0B',
        },
        {
          label: 'Mode',
          value: TRAVEL_MODES.find(m => m.key === selectedMode)?.label,
          icon: require('../assets/images/map.png'),
          color: activeModeColor,
        },
      ]
    : [];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      {/* MAP */}
      <View style={styles.mapWrapper}>
        {region && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={region}
            showsUserLocation={false}
            showsTraffic={true}
          >
            {/* Current location marker */}
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={10}
              >
                <View style={styles.currentDot}>
                  <Animated.View
                    style={[
                      styles.currentDotPulse,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                  <View style={styles.currentDotInner} />
                </View>
              </Marker>
            )}

            {/* Origin marker */}
            {origin && (
              <Marker
                coordinate={origin}
                title={origin.name || 'Start'}
                zIndex={8}
              >
                <View
                  style={[styles.pinWrapper, { backgroundColor: '#10B981' }]}
                >
                  <Image
                    source={require('../assets/images/direction.png')}
                    style={styles.pinIcon}
                  />
                </View>
              </Marker>
            )}

            {/* Destination marker */}
            {destination && (
              <Marker
                coordinate={destination}
                title={destination.name || 'Destination'}
                zIndex={8}
              >
                <View
                  style={[styles.pinWrapper, { backgroundColor: '#EF4444' }]}
                >
                  <Image
                    source={require('../assets/images/map.png')}
                    style={styles.pinIcon}
                  />
                </View>
              </Marker>
            )}

            {/* Route polyline */}
            {routeCoords.length > 1 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={activeModeColor}
                strokeWidth={4}
                lineDashPattern={
                  selectedMode === 'walking' ? [8, 6] : undefined
                }
              />
            )}
          </MapView>
        )}

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Image
            source={require('../assets/images/back.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Route loading overlay */}
        {routeLoading && (
          <View style={styles.routeLoadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.routeLoadingText}>Fetching route...</Text>
          </View>
        )}
      </View>

      {/* BOTTOM SHEET */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetScroll}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Route header */}
          <View style={styles.routeHeader}>
            <View style={styles.routeEndpoints}>
              <View style={styles.endpointRow}>
                <View
                  style={[styles.endpointDot, { backgroundColor: '#10B981' }]}
                />
                <Text style={styles.endpointLabel} numberOfLines={1}>
                  {origin?.name || 'Starting Point'}
                </Text>
              </View>
              <View style={styles.endpointLine} />
              <View style={styles.endpointRow}>
                <View
                  style={[styles.endpointDot, { backgroundColor: '#EF4444' }]}
                />
                <Text style={styles.endpointLabel} numberOfLines={1}>
                  {destination?.name || routeInfo?.endAddress || 'Destination'}
                </Text>
              </View>
            </View>
          </View>

          {/* Travel mode selector */}
          <View style={styles.modeRow}>
            {TRAVEL_MODES.map(mode => {
              const active = selectedMode === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    styles.modeBtn,
                    active && {
                      backgroundColor: mode.color,
                      borderColor: mode.color,
                    },
                  ]}
                  onPress={() => setSelectedMode(mode.key)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={mode.icon}
                    style={styles.modeBtnIcon}
                    resizeMode="contain"
                    tintColor={active ? '#fff' : '#64748B'}
                  />
                  <Text
                    style={[styles.modeBtnText, active && { color: '#fff' }]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stats grid */}
          {stats.length > 0 && (
            <View style={styles.statsGrid}>
              {stats.map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconBox,
                      { backgroundColor: s.color + '20' },
                    ]}
                  >
                    <Image
                      source={s.icon}
                      style={[styles.statIcon, { tintColor: s.color }]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Per-mode time estimates */}
          {routeInfo && (
            <View style={styles.timeEstimatesCard}>
              <Text style={styles.timeEstimatesTitle}>Time Estimates</Text>
              {TRAVEL_MODES.map(mode => {
                const spd = mode.speedKmh;
                const km = routeInfo.distanceValue;
                const min = (km / spd) * 60;
                const active = selectedMode === mode.key;
                return (
                  <TouchableOpacity
                    key={mode.key}
                    style={[styles.timeRow, active && styles.timeRowActive]}
                    onPress={() => setSelectedMode(mode.key)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.timeRowIcon,
                        { backgroundColor: mode.color + '20' },
                      ]}
                    >
                      <Image
                        source={mode.icon}
                        style={[styles.timeIcon, { tintColor: mode.color }]}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.timeRowLabel}>{mode.label}</Text>
                    <View style={styles.timeRowRight}>
                      <Text
                        style={[
                          styles.timeRowValue,
                          active && { color: mode.color },
                        ]}
                      >
                        {formatTime(min)}
                      </Text>
                      <Text style={styles.timeRowDist}>{formatDist(km)}</Text>
                    </View>
                    {active && (
                      <View
                        style={[
                          styles.timeRowActiveDot,
                          { backgroundColor: mode.color },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Displacement info */}
          {displacement !== null && (
            <View style={styles.displacementCard}>
              <Image
                source={require('../assets/images/mapper.png')}
                style={styles.dispIcon}
                resizeMode="contain"
                tintColor="#F59E0B"
              />
              <View style={styles.dispText}>
                <Text style={styles.dispTitle}>Straight-line Displacement</Text>
                <Text style={styles.dispValue}>
                  {formatDist(displacement)} from your location
                </Text>
              </View>
            </View>
          )}

          {/* Confirm / Go button */}
          <TouchableOpacity
            style={[styles.goBtn, { backgroundColor: activeModeColor }]}
            activeOpacity={0.85}
            onPress={() =>
              showNotification({
                title: 'Navigation Started',
                body: `Head to ${destination?.name || 'destination'} · ${
                  routeInfo?.durationText || ''
                }`,
              })
            }
          >
            <Image
              source={require('../assets/images/direction.png')}
              style={styles.goBtnIcon}
              resizeMode="contain"
              tintColor="#fff"
            />
            <Text style={styles.goBtnText}>Start Navigation</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default RouteScreen;

// ── STYLES ──────────────────────────────────────────────────────────────────
const SHEET_HEIGHT = height * 0.52;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Map
  mapWrapper: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  map: { ...StyleSheet.absoluteFillObject },

  // Back button
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  backIcon: { width: 20, height: 20 },

  // Route loading
  routeLoadingOverlay: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  routeLoadingText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Current location dot
  currentDot: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDotPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.3)',
  },
  currentDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Markers
  pinWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  pinIcon: { width: 18, height: 18, tintColor: '#fff' },

  // Bottom sheet
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetScroll: { paddingHorizontal: 16, paddingBottom: 12 },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },

  // Route header
  routeHeader: { marginBottom: 14 },
  routeEndpoints: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  endpointDot: { width: 10, height: 10, borderRadius: 5 },
  endpointLabel: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '600' },
  endpointLine: {
    width: 2,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginLeft: 4,
    borderRadius: 1,
  },

  // Mode selector
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modeBtnIcon: { width: 16, height: 16 },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: { width: 18, height: 18 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  // Time estimates card
  timeEstimatesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timeEstimatesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
    marginBottom: 4,
  },
  timeRowActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  timeRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeIcon: { width: 18, height: 18 },
  timeRowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
  timeRowRight: { alignItems: 'flex-end' },
  timeRowValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  timeRowDist: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  timeRowActiveDot: { width: 8, height: 8, borderRadius: 4 },

  // Displacement card
  displacementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dispIcon: { width: 24, height: 24 },
  dispText: { flex: 1, gap: 2 },
  dispTitle: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  dispValue: { fontSize: 14, fontWeight: '800', color: '#B45309' },

  // Go button
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  goBtnIcon: { width: 20, height: 20 },
  goBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
