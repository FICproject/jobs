import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function LogoutVectorIcon({ color = '#ef4444', size = 16 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          left: 1,
          width: size * 0.52,
          height: size * 0.85,
          borderWidth: 1.8,
          borderRightWidth: 0,
          borderColor: color,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.3,
          width: size * 0.55,
          height: 1.8,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          width: size * 0.34,
          height: size * 0.34,
          borderTopWidth: 1.8,
          borderRightWidth: 1.8,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

function HamburgerVectorIcon({ color = '#ffffff', size = 18 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'space-evenly', alignItems: 'center' }}>
      <View style={{ width: size * 0.9, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: size * 0.9, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: size * 0.9, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

export default function AdminHeader({ currentUser, onLogout, onOpenMenu }) {
  const insets = useSafeAreaInsets();

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.topRow}>
        {/* Brand Left: Logo & FIC RecruitPro (Matching website in screenshot) */}
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
          <View style={styles.titleRow}>
            <Text style={styles.brandFIC}>FIC </Text>
            <Text style={styles.brandPro}>RecruitPro</Text>
          </View>
        </View>

        {/* Right Action Pill with Logout [-> and Hamburger ☰ (Matching website in screenshot) */}
        <View style={styles.rightPill}>
          <TouchableOpacity
            style={styles.pillBtn}
            onPress={handleLogoutPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
          >
            <LogoutVectorIcon color="#ef4444" size={16} />
          </TouchableOpacity>

          <View style={styles.pillDivider} />

          <TouchableOpacity
            style={styles.pillBtn}
            onPress={onOpenMenu}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          >
            <HamburgerVectorIcon color="#ffffff" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.8,
    borderColor: '#f59e0b',
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandFIC: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  brandPro: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: -0.2,
  },
  rightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 10,
  },
  pillBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  pillDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

