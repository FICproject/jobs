import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import jobService from '../../services/jobService';
import itTrainingService from '../../services/itTrainingService';
import apiClient from '../../services/api';

const getCompanyColor = (companyName) => {
  const name = (companyName || '').toLowerCase();
  if (name.includes('idfc')) return '#991b1b';
  if (name.includes('bandhan')) return '#0369a1';
  if (name.includes('hdfc')) return '#1d4ed8';
  if (name.includes('aditya birla')) return '#b91c1c';
  if (name.includes('kotak')) return '#003366';
  if (name.includes('mahindra finance') || name.includes('mahindra')) return '#e11d48';
  if (name.includes('axis')) return '#831843';
  if (name.includes('icici')) return '#ea580c';
  if (name.includes('yes bank')) return '#0284c7';
  if (name.includes('tata aig') || name.includes('tata')) return '#1e3a8a';
  if (name.includes('fic') || name.includes('pan india')) return '#d97706';
  return '#334155';
};

const getCompanyLogoSource = (companyName, logoUrl) => {
  const name = (companyName || '').toLowerCase();
  const url = (logoUrl || '').toLowerCase();

  if (name.includes('fic') || name.includes('pan india')) {
    return require('../../assets/images/logo.png');
  }
  if (name.includes('axis') || url.includes('axis')) {
    return require('../../assets/images/logos/axis_bank.png');
  }
  if (name.includes('mahindra') || url.includes('mahindra')) {
    return require('../../assets/images/logos/mahindra_finance.png');
  }
  if (name.includes('kotak') || url.includes('kotak')) {
    return require('../../assets/images/logos/kotak_bank.png');
  }
  if (name.includes('bandhan') || url.includes('bandhan')) {
    return require('../../assets/images/logos/bandhan_bank.png');
  }
  if (name.includes('idfc') || url.includes('idfc')) {
    return require('../../assets/images/logos/idfc_first_bank.png');
  }
  if (name.includes('aditya birla') || url.includes('aditya')) {
    return require('../../assets/images/logos/aditya_birla.jpg');
  }
  if (name.includes('hdfc') || url.includes('hdfc')) {
    return require('../../assets/images/logos/Hdfc.jpg');
  }
  if (name.includes('tata') || url.includes('tata')) {
    return require('../../assets/images/logos/tata_aig.png');
  }
  if (name.includes('yes bank') || url.includes('yes')) {
    return require('../../assets/images/logos/Yes_Bank_Logo.jpg');
  }
  if (logoUrl && !logoUrl.toLowerCase().endsWith('.svg')) {
    return { uri: logoUrl };
  }
  return null;
};

export default function HrIncentiveSlotScreen({ currentUser }) {
  const [slotItems, setSlotItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set Partner Incentive Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [formFreeJob, setFormFreeJob] = useState('');
  const [formPaidJob, setFormPaidJob] = useState('');
  const [formProcessIncentives, setFormProcessIncentives] = useState({});
  const [savingPartner, setSavingPartner] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const hrId = currentUser?.id || currentUser?._id;

  const loadData = useCallback(async () => {
    try {
      const [jobsData, itData, globalIncRes, partnerIncRes] = await Promise.all([
        jobService.getJobs().catch(() => []),
        itTrainingService.getItProcesses().catch(() => []),
        apiClient.get('/api/settings/it-training-incentives').then((r) => r.data).catch(() => ({})),
        apiClient.get(`/api/partner-incentives?hrId=${hrId}`).then((r) => r.data).catch(() => []),
      ]);

      const jobs = Array.isArray(jobsData) ? jobsData : [];
      const itProcesses = Array.isArray(itData) ? itData : [];
      const globalIncentives = globalIncRes || { 'PROCESS 1': 10000, 'PROCESS 2': 15000, 'PROCESS 3': 10000 };
      const partnerIncentives = Array.isArray(partnerIncRes) ? partnerIncRes : [];

      // Build Combined IT Training card matching website
      let combinedItCard = null;
      const placementProcesses = itProcesses.filter((p) => p.itCategory === 'Placement');
      const uniqueProcesses = [];
      const seenNames = new Set();

      (placementProcesses.length > 0 ? placementProcesses : [
        { id: 'it_proc_1', processName: 'PROCESS 1' },
        { id: 'it_proc_1790335410107', processName: 'process 2' },
        { id: 'it_proc_2', processName: 'PROCESS 3' },
      ]).forEach((proc) => {
        const nameUpper = (proc.processName || '').toUpperCase().trim();
        if (nameUpper && !seenNames.has(nameUpper)) {
          seenNames.add(nameUpper);
          const amt =
            globalIncentives[nameUpper] ||
            (nameUpper.includes('2') ? 15000 : 10000);
          uniqueProcesses.push({
            ...proc,
            hrIncentiveAmount: amt,
          });
        }
      });

      uniqueProcesses.sort((a, b) => (a.processName || '').localeCompare(b.processName || ''));

      combinedItCard = {
        id: 'combined-it-training',
        isCombinedItTraining: true,
        title: 'FIC IT Training & 100% Placement Programme',
        companyName: 'PAN India Opportunities',
        processes: uniqueProcesses,
      };

      const combinedList = [combinedItCard, ...jobs].map((item) => {
        const pRecord = partnerIncentives.find((p) => p.jobId === item.id) || {};
        if (item.isCombinedItTraining) {
          return {
            ...item,
            partnerProcessIncentives: pRecord.processIncentives || {},
          };
        }
        return {
          ...item,
          partnerIncentiveFree: pRecord.freeJobIncentive || 0,
          partnerIncentivePaid: pRecord.paidJobIncentive || 0,
        };
      });

      setSlotItems(combinedList);
    } catch (err) {
      console.error('Error loading incentive slots:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hrId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenPartnerModal = (item) => {
    setSelectedItem(item);
    if (item.isCombinedItTraining) {
      setFormProcessIncentives(item.partnerProcessIncentives || {});
    } else {
      setFormFreeJob(String(item.partnerIncentiveFree || ''));
      setFormPaidJob(String(item.partnerIncentivePaid || ''));
    }
    setPartnerModalVisible(true);
  };

  const handleSavePartnerIncentive = async () => {
    if (!selectedItem) return;
    setSavingPartner(true);
    try {
      const payload = {
        hrId,
        jobId: selectedItem.id,
        freeJobIncentive: Number(formFreeJob) || 0,
        paidJobIncentive: Number(formPaidJob) || 0,
        processIncentives: formProcessIncentives,
      };

      await apiClient.post('/api/partner-incentives', payload);

      setSlotItems((prev) =>
        prev.map((item) => {
          if (item.id === selectedItem.id) {
            if (item.isCombinedItTraining) {
              return { ...item, partnerProcessIncentives: formProcessIncentives };
            }
            return {
              ...item,
              partnerIncentiveFree: Number(formFreeJob) || 0,
              partnerIncentivePaid: Number(formPaidJob) || 0,
            };
          }
          return item;
        })
      );

      setPartnerModalVisible(false);
      setSuccessToast('Partner incentive saved successfully!');
      setTimeout(() => setSuccessToast(''), 3000);
    } catch (err) {
      Alert.alert('Error', 'Failed to save partner incentive. Please try again.');
    } finally {
      setSavingPartner(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header matching Website in Image 1 */}
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Incentive Slot</Text>
          <Text style={styles.headerSub}>
            View all active job requirements and the incentive you earn for each successful selection.
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loadingText}>Loading incentive slots...</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {slotItems.map((item) => {
              const themeColor = getCompanyColor(item.companyName);

              return (
                <View
                  key={item.id}
                  style={[styles.slotCard, { backgroundColor: themeColor }]}
                >
                  {/* Top Row: White Logo Box + Titles */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.whiteLogoBox}>
                      {(() => {
                        const logoSrc = getCompanyLogoSource(item.companyName, item.companyLogo);
                        if (logoSrc) {
                          return (
                            <Image
                              source={logoSrc}
                              style={styles.logoImg}
                              resizeMode="contain"
                            />
                          );
                        }
                        return (
                          <Text style={[styles.monogramText, { color: themeColor }]}>
                            {item.companyName ? item.companyName.charAt(0).toUpperCase() : '💼'}
                          </Text>
                        );
                      })()}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={1}>
                        {item.companyName}
                      </Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Mid Section: Your Incentive per Candidate */}
                  <View style={styles.incentiveSection}>
                    <Text style={styles.incentiveSectionLabel}>
                      Your Incentive per Candidate:
                    </Text>

                    {item.isCombinedItTraining ? (
                      <View style={styles.processesList}>
                        {item.processes.map((proc, pIdx) => (
                          <View key={proc.id || pIdx} style={styles.translucentPill}>
                            <Text style={styles.pillLeftText}>
                              {proc.processName}
                            </Text>
                            <Text style={styles.pillRightText}>
                              Rs. {proc.hrIncentiveAmount || 0}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.regularPillsRow}>
                        <View style={styles.translucentBadge}>
                          <Text style={styles.badgeText}>
                            Free Job: <Text style={styles.badgeBold}>Rs. {item.hrIncentiveFree || 0}</Text>
                          </Text>
                        </View>
                        <View style={styles.translucentBadge}>
                          <Text style={styles.badgeText}>
                            Paid Job: <Text style={styles.badgeBold}>Rs. {item.hrIncentivePaid || 0}</Text>
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Bottom Button matching Website */}
                  <TouchableOpacity
                    style={styles.setPartnerBtn}
                    onPress={() => handleOpenPartnerModal(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.setPartnerBtnText, { color: themeColor }]}>
                      Set Partner Incentive
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Success Toast */}
      {successToast.length > 0 && (
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>✓ {successToast}</Text>
        </View>
      )}

      {/* Set Partner Incentive Modal */}
      <Modal
        visible={partnerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPartnerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPartnerModalVisible(false)}
        >
          <View
            style={styles.modalPanel}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Set Partner Incentive</Text>
              <TouchableOpacity
                onPress={() => setPartnerModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {selectedItem && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Job Preview Box */}
                <View style={styles.modalPreviewBox}>
                  <Text style={styles.previewTitle}>{selectedItem.title}</Text>
                  <Text style={styles.previewCompany}>{selectedItem.companyName}</Text>
                </View>

                {selectedItem.isCombinedItTraining ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.formSectionLabel}>Set Process Incentives:</Text>
                    {selectedItem.processes.map((proc, idx) => (
                      <View key={proc.id || idx} style={styles.formGroup}>
                        <View style={styles.labelRow}>
                          <Text style={styles.inputLabel}>{proc.processName}</Text>
                          <Text style={styles.yourIncentiveBadge}>
                            Your Incentive: Rs. {proc.hrIncentiveAmount || 0}
                          </Text>
                        </View>
                        <TextInput
                          style={styles.textInput}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor="#94a3b8"
                          value={String(formProcessIncentives[proc.processName] ?? '')}
                          onChangeText={(val) =>
                            setFormProcessIncentives((prev) => ({
                              ...prev,
                              [proc.processName]: Number(val) || 0,
                            }))
                          }
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.formGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.inputLabel}>Free Job Incentive</Text>
                        <Text style={styles.yourIncentiveBadge}>
                          Your Incentive: Rs. {selectedItem.hrIncentiveFree || 0}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        value={formFreeJob}
                        onChangeText={setFormFreeJob}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <View style={styles.labelRow}>
                        <Text style={styles.inputLabel}>Paid Job Incentive</Text>
                        <Text style={styles.yourIncentiveBadge}>
                          Your Incentive: Rs. {selectedItem.hrIncentivePaid || 0}
                        </Text>
                      </View>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        value={formPaidJob}
                        onChangeText={setFormPaidJob}
                      />
                    </View>
                  </View>
                )}

                {/* Modal Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setPartnerModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={handleSavePartnerIncentive}
                    disabled={savingPartner}
                    activeOpacity={0.7}
                  >
                    {savingPartner ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalSaveText}>Save Partner Incentive</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },
  headerArea: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 17,
  },
  centerContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 14,
  },

  // Slot Card matching Website Image 1
  slotCard: {
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  whiteLogoBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoImg: {
    width: 36,
    height: 36,
  },
  monogramText: {
    fontSize: 20,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 19,
  },
  cardSub: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12,
  },
  incentiveSection: {
    marginBottom: 14,
  },
  incentiveSectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  processesList: {
    flexDirection: 'column',
    gap: 6,
  },
  translucentPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pillLeftText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  pillRightText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  regularPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  translucentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '600',
  },
  badgeBold: {
    fontWeight: '800',
  },
  setPartnerBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  setPartnerBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },

  // Toast
  toastBox: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalPanel: {
    width: '92%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  modalBody: {
    padding: 16,
  },
  modalPreviewBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  previewCompany: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  yourIncentiveBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingBottom: 6,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSaveBtn: {
    flex: 1.5,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
