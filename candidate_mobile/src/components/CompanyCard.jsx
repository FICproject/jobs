import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { globalStyles } from '../styles/globalStyles';

const BANK_LOGOS = {
  axis: require('../assets/images/logos/axis_bank.png'),
  idfc: require('../assets/images/logos/idfc_first_bank.png'),
  kotak: require('../assets/images/logos/kotak_bank.png'),
  bandhan: require('../assets/images/logos/bandhan_bank.png'),
  aditya: require('../assets/images/logos/aditya_birla.jpg'),
  birla: require('../assets/images/logos/aditya_birla.jpg'),
  'mahindra finance': require('../assets/images/logos/mahindra_finance.png'),
  yes: require('../assets/images/logos/Yes_Bank_Logo.jpg'),
  hdfc: require('../assets/images/logos/Hdfc.jpg'),
  tata: require('../assets/images/logos/tata_aig.png'),
};

const getBankLogo = (name) => {
  const lower = (name || '').toLowerCase();
  for (const key of Object.keys(BANK_LOGOS)) {
    if (lower.includes(key)) return BANK_LOGOS[key];
  }
  return null;
};

export const CompanyCard = ({ company, onPress }) => {
  const localLogo = getBankLogo(company.name);
  const logoUrl = company.logo ? company.logo.replace('http://', 'https://') : null;
  const logoSource = localLogo || (logoUrl ? { uri: logoUrl } : null);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: company.bgColor }, globalStyles.shadowMd]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.logoBox}>
          {logoSource ? (
            <Image
              source={logoSource}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.logoText, { color: company.logoTextColor || '#0F172A' }]}>
              {company.logoText || company.shortName || company.name?.charAt(0)}
            </Text>
          )}
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.bankName}>{company.name}</Text>
          <Text style={styles.positionsText}>
            {company.openPositionsCount || 0} Open Positions
          </Text>
        </View>
      </View>

      {/* Description */}
      {!!company.description && (
        <Text style={styles.description}>{company.description}</Text>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer CTA */}
      <View style={styles.footerRow}>
        <Text style={styles.ctaText}>View {company.name} Jobs</Text>
        <Text style={styles.arrowIcon}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleCol: {
    flex: 1,
  },
  bankName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  positionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 21,
    marginBottom: 16,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrowIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

