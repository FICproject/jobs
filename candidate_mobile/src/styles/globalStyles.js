import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#1E3A8A',       // Deep Navy
  primaryLight: '#3B82F6',  // Vivid Blue
  accent: '#059669',        // Emerald Green
  accentLight: '#10B981',
  background: '#F8FAFC',    // Slate 50
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',   // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8',     // Slate 400
  border: '#E2E8F0',        // Slate 200
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  badgeBg: '#EFF6FF',
  badgeText: '#1D4ED8',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  shadowSm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
