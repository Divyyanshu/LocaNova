import { StyleSheet, Text, View, Animated, Easing, Image } from 'react-native';
import React, { useEffect, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import COLORS from '../constants/Colors';

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

    // Floating animation for logo
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

    // 3.5 seconds baad Home navigate hoga
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
    <LinearGradient
      colors={[COLORS.background, COLORS.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      {/* Animated Logo with Glow */}
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
        {/* Glow background */}
        <View style={styles.glowBackground} />

        <View style={styles.circle}>
          <Image
            source={require('../assets/icons/appIcon.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

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

      <View style={styles.dotsContainer}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={150} />
        <AnimatedDot delay={300} />
      </View>

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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.08,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    top: -100,
    right: -50,
  },
  blob2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primaryDark,
    bottom: -50,
    left: -50,
  },
  logoContainer: {
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
    blur: 40,
  },
  circle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  image: {
    width: 90,
    height: 90,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 70,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    marginVertical: 12,
    borderRadius: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '400',
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textSecondary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  versionText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
