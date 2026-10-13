import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchCompanies, fetchJobs } from '../../services/jobService';

const BANK_LOGOS = {
  axis: require('../../assets/images/logos/axis_bank.png'),
  idfc: require('../../assets/images/logos/idfc_first_bank.png'),
  kotak: require('../../assets/images/logos/kotak_bank.png'),
  bandhan: require('../../assets/images/logos/bandhan_bank.png'),
  aditya: require('../../assets/images/logos/aditya_birla.jpg'),
  birla: require('../../assets/images/logos/aditya_birla.jpg'),
  'mahindra finance': require('../../assets/images/logos/mahindra_finance.png'),
  yes: require('../../assets/images/logos/Yes_Bank_Logo.jpg'),
  hdfc: require('../../assets/images/logos/Hdfc.jpg'),
  tata: require('../../assets/images/logos/tata_aig.png'),
};

const getBankLogo = (name) => {
  const lower = (name || '').toLowerCase();
  for (const key of Object.keys(BANK_LOGOS)) {
    if (lower.includes(key)) return BANK_LOGOS[key];
  }
  return null;
};

const getCompanyColor = (name) => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('idfc')) return '#991B1B';
  if (lowerName.includes('bandhan')) return '#0284C7';
  if (lowerName.includes('hdfc')) return '#1D4ED8';
  if (lowerName.includes('aditya birla')) return '#B91C1C';
  if (lowerName.includes('kotak')) return '#003366';
  if (lowerName.includes('mahindra finance')) return '#E11D48';
  if (lowerName.includes('axis')) return '#831843';
  if (lowerName.includes('icici')) return '#EA580C';
  if (lowerName.includes('tata')) return '#1E3A8A';
  if (lowerName.includes('yes bank')) return '#0284C7';
  return '#475569';
};

export const FicTrainingDetailsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { initialBankName } = route?.params || {};
  const [placementBanks, setPlacementBanks] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCompanies(), fetchJobs()]).then(([comps, jobs]) => {
      if (isMounted) {
        const mapped = comps.map((c) => ({
          ...c,
          bgColor: getCompanyColor(c.name),
        }));
        setPlacementBanks(mapped);
        setAllJobs(jobs || []);
        if (initialBankName) {
          const found = mapped.find((b) =>
            b.name.toLowerCase().includes(initialBankName.toLowerCase())
          );
          if (found) setSelectedBank(found);
        }
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [initialBankName]);

  useEffect(() => {
    const onBackPress = () => {
      if (selectedBank) {
        setSelectedBank(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, [selectedBank]);

  const handleBackPress = () => {
    if (selectedBank) {
      setSelectedBank(null);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" translucent />

      {/* Top Portal Header Bar */}
      <View
        style={[
          styles.topHeaderBar,
          { paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0, 36) + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitleFIC}>FIC </Text>
              <Text style={styles.brandTitleRecruit}>RecruitPro</Text>
            </View>
            <Text style={styles.brandSubtitle}>Candidate Portal</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading training details...</Text>
        </View>
      ) : selectedBank ? (
        /* VIEW 2: DEDICATED FULL PAGE 2: FIC TRAINING ROADMAP DETAILS FOR SELECTED BANK */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.modalCardContainer}>
            {/* TOP BLUE BUTTON MATCHING REFERENCE */}
            <TouchableOpacity
              style={styles.topBluePillContainer}
              onPress={() => setSelectedBank(null)}
              activeOpacity={0.8}
            >
              <View style={styles.topBluePill}>
                <Text style={styles.topBluePillText}>
                  🎖️ FIC Training 100% placement or Refund ▲
                </Text>
              </View>
            </TouchableOpacity>

            {/* BANK TITLE HEADER */}
            <View style={styles.bankHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bankTitleText}>{selectedBank.name}</Text>
                <Text style={styles.bankSubtitleText}>
                  FIC Placement & Training Guarantee Program
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtnCircle}
                onPress={() => setSelectedBank(null)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* DETAILS BODY - SUMMARY CARDS: COST & PERIOD (PER ROLE) */}
            <View style={styles.rolesListContainer}>
              {(() => {
                const cn = selectedBank.name.toLowerCase();
                const matchKey = cn.includes('mahindra finance')
                  ? 'mahindra finance'
                  : cn.includes('kotak')
                  ? 'kotak'
                  : cn.includes('aditya')
                  ? 'aditya'
                  : cn.includes('idfc')
                  ? 'idfc'
                  : cn.includes('axis')
                  ? 'axis'
                  : cn.includes('bandhan')
                  ? 'bandhan'
                  : cn.includes('hdfc')
                  ? 'hdfc'
                  : cn.includes('yes')
                  ? 'yes'
                  : cn.split(' ')[0];

                const bankJobs = allJobs.filter(
                  (j) =>
                    j.companyId === selectedBank.id ||
                    (j.companyName || '').toLowerCase().includes(matchKey)
                );

                if (bankJobs.length > 0) {
                  return bankJobs.map((job) => (
                    <View key={job.id} style={styles.roleCardContainer}>
                      {job.programName ? (
                        <View style={styles.programHeaderRow}>
                          <Text style={styles.programTitleText}>{job.programName}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.roleTitleText}>Role: {job.title}</Text>
                      <View style={styles.costPeriodGrid}>
                        <View style={styles.costBox}>
                          <Text style={styles.costBoxLabel}>💰 FIC TRAINING COST</Text>
                          <Text style={styles.costBoxValue}>
                            {job.interviewCrackFee ||
                              job.trainingFee ||
                              selectedBank.trainingFee ||
                              '2,20,000'}
                          </Text>
                        </View>
                        <View style={styles.periodBox}>
                          <Text style={styles.periodBoxLabel}>⏱️ FIC TRAINING PERIOD</Text>
                          <Text style={styles.periodBoxValue}>
                            {job.ficTrainingPeriod ||
                              selectedBank.trainingPeriod ||
                              '120 days'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ));
                }

                return (
                  <View style={styles.roleCardContainer}>
                    <Text style={styles.roleTitleText}>
                      Role: {selectedBank.name} Professional Trainee
                    </Text>
                    <View style={styles.costPeriodGrid}>
                      <View style={styles.costBox}>
                        <Text style={styles.costBoxLabel}>💰 FIC TRAINING COST</Text>
                        <Text style={styles.costBoxValue}>
                          {selectedBank.trainingFee ||
                            selectedBank.interviewCrackFee ||
                            '2,20,000'}
                        </Text>
                      </View>
                      <View style={styles.periodBox}>
                        <Text style={styles.periodBoxLabel}>⏱️ FIC TRAINING PERIOD</Text>
                        <Text style={styles.periodBoxValue}>
                          {selectedBank.trainingPeriod || '120 days'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* 4-STEP PAYMENT ROADMAP */}
            <View style={styles.roadmapSection}>
              <Text style={styles.roadmapHeading}>🗺️ 4-STEP PAYMENT ROADMAP</Text>
              <View style={styles.roadmapCard}>
                <View style={styles.stepBox}>
                  <Text style={styles.stepTitle}>Step 1: 50% Advance Payment</Text>
                  <Text style={styles.stepSub}>
                    Starting the process 50% payment advance
                  </Text>
                </View>

                <View style={styles.stepBox}>
                  <Text style={styles.stepTitle}>Step 2: Document Submission</Text>
                  <Text style={styles.stepSub}>
                    Document submission for verification
                  </Text>
                </View>

                <View style={styles.stepBox}>
                  <Text style={styles.stepTitle}>Step 3: Training Program</Text>
                  <Text style={styles.stepSub}>
                    Training & preparation sessions
                  </Text>
                </View>

                <View style={styles.stepBox}>
                  <Text style={styles.stepTitle}>Step 4: Balance Payment</Text>
                  <Text style={styles.stepSub}>
                    After selected 50% payment
                  </Text>
                </View>
              </View>
            </View>

            {/* GUARANTEE BADGE */}
            <View style={styles.guaranteeBanner}>
              <Text style={styles.guaranteeIcon}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>
                  100% Placement Guarantee or Full Refund
                </Text>
                <Text style={styles.guaranteeSub}>
                  Complete job guarantee upon successful training completion or 100% money back.
                </Text>
              </View>
            </View>

            {/* FOOTER ACTION BUTTON */}
            <TouchableOpacity
              style={styles.viewJobsFooterBtn}
              onPress={() =>
                navigation.navigate('Jobs', {
                  companyId: selectedBank.id,
                  companyName: selectedBank.name,
                })
              }
              activeOpacity={0.85}
            >
              <Text style={styles.viewJobsFooterBtnText}>
                View {selectedBank.name} Jobs & Apply →
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* VIEW 1: BANK SELECTION LIST */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Header Overview Card */}
          <View style={styles.headerOverviewCard}>
            <View style={styles.headerIconBadge}>
              <Text style={styles.headerRibbonIcon}>🏅</Text>
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.overviewTitle}>
                FIC Training 100% Placement or Refund
              </Text>
              <Text style={styles.overviewSub}>
                Select a bank or hiring partner below to view 100% job placement guarantee roles.
              </Text>
            </View>
          </View>

          {/* Bank List */}
          {placementBanks.map((company) => {
            const logo = getBankLogo(company.name);
            return (
              <TouchableOpacity
                key={company.id}
                style={[styles.bankRowCard, { backgroundColor: company.bgColor }]}
                onPress={() => setSelectedBank(company)}
                activeOpacity={0.85}
              >
                <View style={styles.bankLogoCircle}>
                  {logo ? (
                    <Image source={logo} style={styles.bankLogoImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.bankLogoText}>
                      {company.shortName || company.name.substring(0, 3).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View style={styles.bankInfoCol}>
                  <Text style={styles.bankNameText}>{company.name}</Text>
                  <Text style={styles.bankPositionsText}>
                    📍 {company.openPositionsCount || 1} Open Positions
                  </Text>
                </View>

                <View style={styles.clickHereBtn}>
                  <Text style={styles.clickHereText}>Click Here ›</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  topHeaderBar: {
    backgroundColor: '#0A1128',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFIC: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitleRecruit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  brandSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  headerOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerRibbonIcon: {
    fontSize: 22,
  },
  headerTextCol: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  overviewSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  bankRowCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bankLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
    padding: 2,
  },
  bankLogoImage: {
    width: '100%',
    height: '100%',
  },
  bankLogoText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  bankInfoCol: {
    flex: 1,
  },
  bankNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bankPositionsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  clickHereBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  clickHereText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* 2ND PAGE MODAL CARD STYLES */
  modalCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  topBluePillContainer: {
    marginBottom: 16,
  },
  topBluePill: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  topBluePillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 14,
    marginBottom: 16,
  },
  bankTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bankSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  rolesListContainer: {
    gap: 14,
    marginBottom: 18,
  },
  roleCardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  programHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 8,
    marginBottom: 10,
  },
  programTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  costPeriodGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  costBox: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 12,
  },
  costBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  costBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  periodBox: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    padding: 12,
  },
  periodBoxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  periodBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#047857',
  },
  roadmapSection: {
    marginBottom: 18,
  },
  roadmapHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  roadmapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 14,
    gap: 10,
  },
  stepBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 3,
  },
  stepSub: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  guaranteeBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  guaranteeIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
    marginBottom: 2,
  },
  guaranteeSub: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
  },
  viewJobsFooterBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  viewJobsFooterBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
});
