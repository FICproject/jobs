import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, globalStyles } from '../../styles/globalStyles';

export const ApplicationSuccessScreen = ({ route, navigation }) => {
  const { jobTitle, company, applicationId, paymentId, paymentAmount } = route.params || {};

  return (
    <View style={[globalStyles.container, styles.container]}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.subtitle}>
          Your application for <Text style={styles.highlight}>{jobTitle}</Text> at{' '}
          <Text style={styles.highlight}>{company}</Text> was successfully sent.
        </Text>

        <View style={styles.refBox}>
          <Text style={styles.refLabel}>Application Reference</Text>
          <Text style={styles.refValue}>{applicationId || 'FIC-849201'}</Text>
        </View>

        {paymentId && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Razorpay Payment Reference</Text>
            <Text style={styles.paymentValue}>
              {paymentId.startsWith('FREE_') ? 'Exempt / Free Flow' : paymentId}
            </Text>
            <Text style={styles.paymentAmountText}>
              Fee Paid: ₹{paymentAmount !== undefined ? paymentAmount : 49}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 36,
    color: COLORS.accent,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  highlight: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  refBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  refLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  refValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  paymentBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  paymentLabel: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  paymentAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 4,
  },
  homeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
