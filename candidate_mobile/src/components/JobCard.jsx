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

const formatTrainingSummaryTag = (trainingPeriod) => {
  if (!trainingPeriod || typeof trainingPeriod !== 'string') return null;
  const parts = trainingPeriod.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const firstPhase = parts[0].replace(/^Phase\s*\d+\s*:\s*/i, '');
    const durationMatch = firstPhase.match(/([\d\-\s]+(?:months?|month|mon|years?|year|yr|weeks?|week|days?|day|m|w|d))/i);
    if (durationMatch) {
      return `🎓 Training: ${durationMatch[1].trim()} (${parts.length} Phases)`;
    }
    return `🎓 Training: ${parts.length} Structured Phases`;
  }
  const clean = trainingPeriod.replace(/^Phase\s*\d+\s*:\s*/i, '');
  if (clean.length > 30) {
    return '🎓 Training Program Included';
  }
  return `🎓 Training: ${clean}`;
};

export const JobCard = ({ job, companyColor, onViewDetails, onApplyNow }) => {
  const cardBgColor = companyColor || job.bgColor || '#991B1B';
  const logoSource = getBankLogo(job.company || job.companyName) || (job.companyLogo ? { uri: job.companyLogo } : null);
  const trainingSummaryTag = job.trainingTag || formatTrainingSummaryTag(job.trainingPeriod);
  const expText = job.experience || job.experienceTag || 'Fresher & Experience';
  const salaryText = job.salary || job.ctcDisplay;

  return (
    <View style={[styles.card, { backgroundColor: cardBgColor }, globalStyles.shadowMd]}>
      {/* Clickable Card Body Area */}
      <TouchableOpacity
        onPress={onViewDetails}
        activeOpacity={0.88}
        style={styles.cardClickableArea}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.logoBadge}>
            {logoSource ? (
              <Image
                source={logoSource}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.logoIcon}>🏛️</Text>
            )}
          </View>
          <View style={styles.titleColumn}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={styles.companyName}>{job.company || job.companyName}</Text>
          </View>
        </View>

        {/* Chips Row */}
        <View style={styles.chipsRow}>
          <View style={styles.chipPill}>
            <Text style={styles.chipText}>💼 {expText}</Text>
          </View>
          {salaryText ? (
            <View style={[styles.chipPill, styles.salaryChipPill]}>
              <Text style={styles.salaryChipText}>{salaryText}</Text>
            </View>
          ) : null}
          {trainingSummaryTag ? (
            <View style={[styles.chipPill, styles.trainingChipPill]}>
              <Text style={styles.trainingChipText}>{trainingSummaryTag}</Text>
            </View>
          ) : null}
        </View>

        {/* Description Snippet */}
        {job.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {job.description}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* Subtle Divider */}
      <View style={styles.divider} />

      {/* Footer Buttons Row */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={onViewDetails}
          activeOpacity={0.8}
        >
          <Text style={styles.viewDetailsBtnText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyNowBtn}
          onPress={onApplyNow}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyNowBtnText, { color: cardBgColor }]}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardClickableArea: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoIcon: {
    fontSize: 22,
  },
  titleColumn: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  salaryChipPill: {
    backgroundColor: 'rgba(167, 243, 208, 0.2)',
    borderColor: 'rgba(167, 243, 208, 0.3)',
  },
  salaryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  trainingChipPill: {
    backgroundColor: 'rgba(253, 230, 138, 0.2)',
    borderColor: 'rgba(253, 230, 138, 0.3)',
  },
  trainingChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE047',
  },
  descriptionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 19,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewDetailsBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  applyNowBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  applyNowBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
