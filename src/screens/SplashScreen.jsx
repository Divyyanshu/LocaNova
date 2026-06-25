import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Image,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import React, { useEffect, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import COLORS from '../constants/Colors';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isSmallDevice = width < 375;
const isLargeDevice = width > 430;

const SplashScreen = ({ navigation }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    const splashTimer = setTimeout(() => {
      navigation.replace('Home');
    }, 3500);

    return () => clearTimeout(splashTimer);
  }, [navigation]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.background, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />

        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: spin },
                { translateY: floatY },
              ],
            },
          ]}
        >
          <View style={styles.glowBackground} />

          <View style={styles.circle}>
            <Image
              source={require('../assets/icons/appIcon.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Text Container */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>LocaNova</Text>
          <Text style={styles.tagline}>Discover Locally, Plan Later</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Your journey starts here</Text>
        </Animated.View>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={150} />
          <AnimatedDot delay={300} />
        </View>

        {/* Version Text */}
        <Animated.Text
          style={[
            styles.versionText,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          v1.0.0
        </Animated.Text>
      </LinearGradient>
    </SafeAreaView>
  );
};

const AnimatedDot = ({ delay }) => {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 800,
          delay: delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const scale = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.3, 0.6],
  });

  const opacity = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  blob: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.08,
  },

  blob1: {
    width: isSmallDevice ? 250 : isLargeDevice ? 350 : 300,
    height: isSmallDevice ? 250 : isLargeDevice ? 350 : 300,
    backgroundColor: COLORS.primary,
    top: -100,
    right: -50,
  },

  blob2: {
    width: isSmallDevice ? 150 : isLargeDevice ? 250 : 200,
    height: isSmallDevice ? 150 : isLargeDevice ? 250 : 200,
    backgroundColor: COLORS.primaryDark,
    bottom: -50,
    left: -50,
  },

  // Logo Container
  logoContainer: {
    marginBottom: isSmallDevice ? 30 : isLargeDevice ? 60 : 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glowBackground: {
    position: 'absolute',
    width: isSmallDevice ? 140 : isLargeDevice ? 180 : 160,
    height: isSmallDevice ? 140 : isLargeDevice ? 180 : 160,
    borderRadius: isSmallDevice ? 70 : isLargeDevice ? 90 : 80,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },

  circle: {
    width: isSmallDevice ? 110 : isLargeDevice ? 150 : 130,
    height: isSmallDevice ? 110 : isLargeDevice ? 150 : 130,
    borderRadius: isSmallDevice ? 55 : isLargeDevice ? 75 : 65,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },

  image: {
    width: isSmallDevice ? 70 : isLargeDevice ? 100 : 90,
    height: isSmallDevice ? 70 : isLargeDevice ? 100 : 90,
  },

  // Text Container
  textContainer: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 50 : isLargeDevice ? 80 : 70,
  },

  appName: {
    fontSize: isSmallDevice ? 28 : isLargeDevice ? 38 : 32,
    fontWeight: isIOS ? '700' : '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  tagline: {
    fontSize: isSmallDevice ? 13 : isLargeDevice ? 17 : 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  divider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    marginVertical: 12,
    borderRadius: 1.5,
  },

  subtitle: {
    fontSize: isSmallDevice ? 11 : isLargeDevice ? 13 : 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '400',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // Dots Container
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: isSmallDevice ? 30 : isLargeDevice ? 50 : 40,
  },

  dot: {
    width: isSmallDevice ? 10 : isLargeDevice ? 14 : 12,
    height: isSmallDevice ? 10 : isLargeDevice ? 14 : 12,
    borderRadius: isSmallDevice ? 5 : isLargeDevice ? 7 : 6,
    backgroundColor: COLORS.textSecondary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  // Version Text
  versionText: {
    position: 'absolute',
    bottom: isIOS ? 24 : 20,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: isIOS ? '500' : '600',
    letterSpacing: 0.3,
  },
});

export default SplashScreen;
