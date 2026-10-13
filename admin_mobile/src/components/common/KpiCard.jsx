import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';

export default function KpiCard({ title, value, subtitle, icon, color = '#2563eb', onPress }) {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={[styles.value, { color }]}>{value ?? '0'}</Text>
        </View>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.iconText, { color }]}>{icon}</Text>
          </View>
        )}
      </View>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
});
