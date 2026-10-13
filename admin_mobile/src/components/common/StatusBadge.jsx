import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function StatusBadge({ status, size = 'normal' }) {
  const s = (status || '').toLowerCase();
  
  let bgColor = theme.colors.border;
  let textColor = theme.colors.textMain;
  let symbol = '●';

  if (s === 'active' || s === 'selected') {
    bgColor = theme.colors.statusSelectedBg;
    textColor = theme.colors.statusSelected;
    symbol = '✓';
  } else if (s.includes('interview') || s === 'shortlisted') {
    bgColor = s.includes('interview') ? theme.colors.statusInterviewBg : theme.colors.statusShortlistedBg;
    textColor = s.includes('interview') ? theme.colors.statusInterview : theme.colors.statusShortlisted;
    symbol = '●';
  } else if (s === 'applied' || s === 'under review') {
    bgColor = theme.colors.statusAppliedBg;
    textColor = theme.colors.statusApplied;
    symbol = '●';
  } else if (s === 'payment pending' || s === 'pending') {
    bgColor = '#fff7ed';
    textColor = '#ea580c';
    symbol = '●';
  } else if (s === 'rejected' || s === 'inactive') {
    bgColor = theme.colors.statusRejectedBg;
    textColor = theme.colors.statusRejected;
    symbol = '✕';
  }

  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.symbol, { color: textColor }]}>{symbol}</Text>
      <Text style={[styles.text, { color: textColor }, isSmall && styles.textSmall]}>
        {status || 'Unknown'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  symbol: {
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  textSmall: {
    fontSize: 10,
  },
});
