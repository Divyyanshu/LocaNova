import React, { useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../constants/Colors';

const HomeScreen = ({ navigation }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.logo}>
              <LinearGradient
                colors={[COLORS.white, '#F8F8F8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBg}
              >
                <Image
                  source={require('../assets/images/map.png')}
                  style={styles.image}
                  resizeMode="contain"
                  tintColor={COLORS.primaryDark}
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

        {/* Location Card - Premium Style */}
        <View style={styles.cardWrapper}>
          <LinearGradient colors={[COLORS.card, '#FAFAFA']} style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Image
                  source={require('../assets/images/interface.png')}
                  style={styles.imageIcons}
                  resizeMode="contain"
                  tintColor={COLORS.primary}
                />
              </View>
              <Text style={styles.cardTitle}>Current Location</Text>
            </View>

            <View style={styles.locationContainer}>
              <View style={styles.locationItem}>
                <View style={styles.locationLabelRow}>
                  <View style={styles.dotIndicator} />
                  <Text style={styles.locationLabel}>Latitude</Text>
                </View>
                <Text style={styles.locationValue}></Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.locationItem}>
                <View style={styles.locationLabelRow}>
                  <View style={styles.dotIndicator} />
                  <Text style={styles.locationLabel}>Longitude</Text>
                </View>
                <Text style={styles.locationValue}></Text>
              </View>
            </View>

            {/* Accuracy Info */}
            <View style={styles.accuracyBox}>
              <View style={styles.signalDot} />
              <Text style={styles.accuracyText}>
                Accuracy: <Text style={styles.accuracyValue}>Waiting...</Text>
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Buttons - Premium Style */}
        <View style={styles.buttonsContainer}>
          {/* Button 1 - Get Location */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Image
                  source={require('../assets/images/direction.png')}
                  style={styles.imageIconsbtn}
                  resizeMode="contain"
                />
                <Text style={styles.buttonText}>Get Current Location</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Button 2 - Open Map */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Map')}
          >
            <LinearGradient
              colors={[COLORS.primaryDark, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Image
                source={require('../assets/images/mapper.png')}
                style={styles.imageIconsbtn}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>Open Google Map</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Button 3 - Notification */}
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Image
                source={require('../assets/images/bell.png')}
                style={styles.imageIconsbtn}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>Send Notification</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Footer */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Image
              source={require('../assets/images/direction.png')}
              style={styles.imageIcons}
              resizeMode="contain"
            />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Image
              source={require('../assets/images/bell.png')}
              style={styles.imageIconsbtn}
              resizeMode="contain"
            />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Image
              source={require('../assets/images/mapper.png')}
              style={styles.imageIcons}
              resizeMode="contain"
            />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Maps</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 45,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },

  header: {
    alignItems: 'center',
  },

  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },

  logoBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 65,
    height: 65,
  },
  imageIcons: {
    width: 20,
    height: 20,
    tintColor: COLORS.textSecondary,
  },
  imageIconsbtn: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: COLORS.textSecondary,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 30,
  },
  badge: {
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
  },

  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  iconText: {
    fontSize: 28,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  locationContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
  },

  locationItem: {
    marginBottom: 12,
  },

  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },

  locationLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  locationValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    marginVertical: 12,
  },

  accuracyBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },

  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },

  accuracyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  accuracyValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  buttonsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },

  button: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexDirection: 'row',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  buttonText: {
    color: COLORS.buttonText,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  statItem: {
    alignItems: 'center',
  },

  statIconEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.border,
  },
});
