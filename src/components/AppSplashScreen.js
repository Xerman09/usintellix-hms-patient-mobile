import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { THEME } from '../constants/theme';
import logoImg from '../../assets/logo.png';
import { ShieldIcon } from './Icons';

export default function AppSplashScreen({ onFinish }) {
  const [statusMessage, setStatusMessage] = useState('Initializing secure portal...');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade in & scale up logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();

    // 2. Subtle pulse loop on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        })
      ])
    ).start();

    // 3. Simulated connection progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1300,
      useNativeDriver: false
    }).start();

    const t1 = setTimeout(() => {
      setStatusMessage('Connecting to hospital network...');
    }, 500);

    const t2 = setTimeout(() => {
      setStatusMessage('Loading patient workspace...');
    }, 1000);

    const t3 = setTimeout(() => {
      // Fade out and call onFinish
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '100%']
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }]
          }
        ]}
      >
        {/* Hospital Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={logoImg}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Brand Names */}
        <Text style={styles.title}>USINTELLIX</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PATIENT PORTAL</Text>
        </View>
        <Text style={styles.subtitle}>Health & Medical Records Network</Text>

        {/* Loading Bar & Indicator */}
        <View style={styles.loadingSection}>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer HIPAA Notice */}
      <View style={styles.footer}>
        <View style={styles.securityRow}>
          <ShieldIcon size={14} color="#64748b" style={{ marginRight: 5 }} />
          <Text style={styles.securityText}>256-Bit Encrypted • HIPAA Compliant</Text>
        </View>
        <Text style={styles.versionText}>USIntellix Healthcare System v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 20 : 48
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6
  },
  logo: {
    width: 115,
    height: 115
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 2.5,
    marginBottom: 6
  },
  badge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  badgeText: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 36
  },
  loadingSection: {
    width: '80%',
    alignItems: 'center'
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500'
  },
  footer: {
    alignItems: 'center',
    width: '100%'
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  securityText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500'
  },
  versionText: {
    fontSize: 10,
    color: '#94a3b8'
  }
});
