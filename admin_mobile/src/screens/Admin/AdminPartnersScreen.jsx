import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { theme } from '../../styles/theme';
import hrService from '../../services/hrService';
import partnerService from '../../services/partnerService';
import PartnerFormModal from '../../components/modals/PartnerFormModal';

// 9 Color Themes matching the Web Admin Portal (Image 1)
const HR_PALETTES = [
  { bg: '#fef2f2', iconBg: '#fee2e2', iconColor: '#ef4444', text: '#7f1d1d', border: '#fca5a5' }, // Priyadharshini
  { bg: '#eff6ff', iconBg: '#dbeafe', iconColor: '#3b82f6', text: '#1e3a8a', border: '#93c5fd' }, // Ganesh
  { bg: '#ecfdf5', iconBg: '#d1fae5', iconColor: '#10b981', text: '#064e3b', border: '#6ee7b7' }, // Hema
  { bg: '#fdf4ff', iconBg: '#fae8ff', iconColor: '#d946ef', text: '#701a75', border: '#f0abfc' }, // Mohammed
  { bg: '#fffbeb', iconBg: '#fef3c7', iconColor: '#f59e0b', text: '#78350f', border: '#fcd34d' }, // Agila
  { bg: '#f5f3ff', iconBg: '#ede9fe', iconColor: '#8b5cf6', text: '#4c1d95', border: '#c4b5fd' }, // Sandeep
  { bg: '#f0fdfa', iconBg: '#ccfbf1', iconColor: '#14b8a6', text: '#134e4a', border: '#5eead4' }, // AnbuSelvan
  { bg: '#fff1f2', iconBg: '#ffe4e6', iconColor: '#f43f5e', text: '#881337', border: '#fda4af' }, // Sabari
  { bg: '#fff7ed', iconBg: '#ffedd5', iconColor: '#f97316', text: '#7c2d12', border: '#fdba74' }, // Nandhini
];

export default function AdminPartnersScreen() {
  const [hrs, setHrs] = useState([]);
  const [loadingHrs, setLoadingHrs] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected HR for Partner details
  const [selectedHr, setSelectedHr] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);

  // Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [partnerViewMode, setPartnerViewMode] = useState('table'); // 'table' or 'card'

  const loadHrs = useCallback(async () => {
    try {
      const data = await hrService.getHrs();
      setHrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading HRs for Partner Management:', err);
    } finally {
      setLoadingHrs(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHrs();
  }, [loadHrs]);

  const loadPartnersForHr = useCallback(async (hr) => {
    if (!hr) return;
    setLoadingPartners(true);
    try {
      const hrId = hr.id || hr._id;
      const data = await partnerService.getPartners(hrId);
      setPartners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading partners for HR:', err);
    } finally {
      setLoadingPartners(false);
    }
  }, []);

  const handleSelectHr = (hr) => {
    setSelectedHr(hr);
    loadPartnersForHr(hr);
  };

  const handleBackToHrs = () => {
    setSelectedHr(null);
    setPartners([]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedHr) {
      loadPartnersForHr(selectedHr);
      setRefreshing(false);
    } else {
      loadHrs();
    }
  };

  const handleSharePartnerLink = async (partner) => {
    const link = `https://jobs.forgeindiaconnect.in?ref=${partner.referralCode}`;
    try {
      await Share.share({
        message: `Forge India Connect Job Portal - Partner Link for ${partner.name}: ${link}`,
      });
    } catch (err) {
      console.error('Error sharing partner link:', err);
    }
  };

  const handleDeletePartner = (partner) => {
    Alert.alert(
      'Remove Partner',
      `Delete partner ${partner.name}? Their referral link will stop tracking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const hrId = selectedHr.id || selectedHr._id;
              const agentId = partner.id || partner._id;
              await partnerService.deletePartner(hrId, agentId);
              loadPartnersForHr(selectedHr);
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete partner');
            }
          },
        },
      ]
    );
  };

  // Filtered HR list
  const filteredHrs = useMemo(() => {
    if (!searchQuery.trim()) return hrs;
    const q = searchQuery.toLowerCase();
    return hrs.filter((hr) => {
      return (
        (hr.name && hr.name.toLowerCase().includes(q)) ||
        (hr.referralCode && hr.referralCode.toLowerCase().includes(q)) ||
        (hr.email && hr.email.toLowerCase().includes(q))
      );
    });
  }, [hrs, searchQuery]);

  return (
    <View style={styles.container}>
      {/* ---------------------------------------------------- */}
      {/* VIEW 1: HR LIST GRID (MATCHES ADMIN WEBSITE IMAGE 1) */}
      {/* ---------------------------------------------------- */}
      {!selectedHr ? (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header matching Admin Website */}
          <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>Partner Management</Text>
            <Text style={styles.headerSubtitle}>
              Select an HR to view and manage their partners.
            </Text>
          </View>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search HR by name or referral code..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingHrs && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.loadingText}>Loading HR accounts...</Text>
            </View>
          ) : filteredHrs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👤+</Text>
              <Text style={styles.emptyTitle}>No HR accounts found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'No HRs match your search.'
                  : 'Add HR accounts from the HR Management tab.'}
              </Text>
            </View>
          ) : (
            /* Responsive Grid of Colored HR Cards matching Website Image 1 */
            <View style={styles.hrGrid}>
              {filteredHrs.map((hr, idx) => {
                const palette = HR_PALETTES[idx % HR_PALETTES.length];
                return (
                  <TouchableOpacity
                    key={String(hr.id || hr._id || idx)}
                    style={[
                      styles.hrCard,
                      {
                        backgroundColor: palette.bg,
                        borderColor: palette.border,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectHr(hr)}
                  >
                    <View style={styles.hrCardInner}>
                      {/* Left Icon with matching tint */}
                      <View
                        style={[
                          styles.hrCardIconBox,
                          { backgroundColor: palette.iconBg },
                        ]}
                      >
                        <Text style={[styles.hrCardIconText, { color: palette.iconColor }]}>
                          👤⁺
                        </Text>
                      </View>

                      {/* HR Details */}
                      <View style={styles.hrCardInfo}>
                        <Text
                          style={[styles.hrCardName, { color: palette.text }]}
                          numberOfLines={1}
                        >
                          {hr.name}
                        </Text>
                        <Text style={styles.hrCardRef} numberOfLines={1}>
                          HR Ref: {hr.referralCode || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* ---------------------------------------------------- */
        /* VIEW 2: PARTNERS UNDER SELECTED HR                   */
        /* ---------------------------------------------------- */
        <View style={styles.selectedHrContainer}>
          {/* Sub-Header with Back Button & Add Partner */}
          <View style={styles.subHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackToHrs}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>← Back to HR List</Text>
            </TouchableOpacity>

            <View style={styles.subHeaderTitleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subHeaderTitle}>
                  Partners for {selectedHr.name}
                </Text>
                <Text style={styles.subHeaderRef}>
                  HR Referral Code: {selectedHr.referralCode}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addPartnerBtn}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.addPartnerBtnText}>+ Add Partner</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Table / Cards */}
            <View style={styles.partnerViewControls}>
              <View style={styles.countPill}>
                <Text style={styles.countText}>
                  {partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}
                </Text>
              </View>

              <View style={styles.viewToggleGroup}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    partnerViewMode === 'table' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setPartnerViewMode('table')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      partnerViewMode === 'table' && styles.toggleBtnTextActive,
                    ]}
                  >
                    📋 Table
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    partnerViewMode === 'card' && styles.toggleBtnActive,
                  ]}
                  onPress={() => setPartnerViewMode('card')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      partnerViewMode === 'card' && styles.toggleBtnTextActive,
                    ]}
                  >
                    🗂️ Cards
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Partner Content */}
          {loadingPartners ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0f172a" />
              <Text style={styles.loadingText}>
                Loading partners for {selectedHr.name}...
              </Text>
            </View>
          ) : partners.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.emptyContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyTitle}>No partners found</Text>
              <Text style={styles.emptySub}>
                Tap "+ Add Partner" to recruit a partner/agent under {selectedHr.name}.
              </Text>
            </ScrollView>
          ) : partnerViewMode === 'table' ? (
            /* PARTNERS TABLE VIEW */
            <ScrollView
              style={styles.tableScrollVertical}
              contentContainerStyle={styles.tableScrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              <View style={styles.tableCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View>
                    {/* Header */}
                    <View style={styles.tableHeaderRow}>
                      <View style={[styles.cell, styles.colPartnerName]}>
                        <Text style={styles.headerColText}>Partner Name</Text>
                      </View>
                      <View style={[styles.cell, styles.colPartnerEmail]}>
                        <Text style={styles.headerColText}>Email / Mobile</Text>
                      </View>
                      <View style={[styles.cell, styles.colPartnerRef]}>
                        <Text style={styles.headerColText}>Referral Code</Text>
                      </View>
                      <View style={[styles.cell, styles.colPartnerClicks]}>
                        <Text style={styles.headerColText}>Clicks</Text>
                      </View>
                      <View style={[styles.cell, styles.colPartnerApps]}>
                        <Text style={styles.headerColText}>Candidates</Text>
                      </View>
                      <View style={[styles.cell, styles.colPartnerActions]}>
                        <Text style={styles.headerColText}>Actions</Text>
                      </View>
                    </View>

                    {/* Rows */}
                    {partners.map((p, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <View
                          key={String(p.id || p._id || idx)}
                          style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                        >
                          <View style={[styles.cell, styles.colPartnerName]}>
                            <Text style={styles.partnerNameText}>{p.name}</Text>
                          </View>

                          <View style={[styles.cell, styles.colPartnerEmail]}>
                            <Text style={styles.partnerEmailText}>{p.email}</Text>
                            {p.mobile ? (
                              <Text style={styles.partnerMobileText}>{p.mobile}</Text>
                            ) : null}
                          </View>

                          <View style={[styles.cell, styles.colPartnerRef]}>
                            <View style={styles.refBadge}>
                              <Text style={styles.refBadgeText}>{p.referralCode}</Text>
                            </View>
                          </View>

                          <View style={[styles.cell, styles.colPartnerClicks]}>
                            <Text style={styles.clicksText}>{p.linkClicks || 0}</Text>
                          </View>

                          <View style={[styles.cell, styles.colPartnerApps]}>
                            <Text style={styles.appsText}>
                              {p.candidatesApplied || 0}
                            </Text>
                            <Text style={styles.closedSubText}>
                              {p.closedCandidates || 0} closed
                            </Text>
                          </View>

                          <View style={[styles.cell, styles.colPartnerActions]}>
                            <View style={styles.actionBtnRow}>
                              <TouchableOpacity
                                style={styles.shareIconBtn}
                                onPress={() => handleSharePartnerLink(p)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.actionBtnText}>📤 Share Link</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.deleteIconBtn}
                                onPress={() => handleDeletePartner(p)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.deleteIconText}>🗑️</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            /* PARTNERS CARD VIEW */
            <ScrollView
              style={styles.cardScroll}
              contentContainerStyle={styles.cardListContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {partners.map((p, idx) => (
                <View key={String(p.id || p._id || idx)} style={styles.partnerCard}>
                  <View style={styles.partnerCardHeader}>
                    <View style={styles.partnerAvatar}>
                      <Text style={styles.partnerAvatarText}>
                        {(p.name || 'P').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardPartnerName}>{p.name}</Text>
                      <Text style={styles.cardPartnerEmail}>{p.email}</Text>
                      {p.mobile ? (
                        <Text style={styles.cardPartnerMobile}>{p.mobile}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cardRefRow}>
                    <Text style={styles.cardRefLabel}>Partner Referral:</Text>
                    <View style={styles.refBadge}>
                      <Text style={styles.refBadgeText}>{p.referralCode}</Text>
                    </View>
                  </View>

                  <View style={styles.cardStatsGrid}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Clicks</Text>
                      <Text style={styles.statValBlue}>{p.linkClicks || 0}</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>Candidates</Text>
                      <Text style={styles.statValGreen}>{p.candidatesApplied || 0}</Text>
                      <Text style={styles.statSubText}>
                        {p.closedCandidates || 0} closed
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={styles.cardShareBtn}
                      onPress={() => handleSharePartnerLink(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardShareBtnText}>📤 Share Link</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => handleDeletePartner(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardDeleteBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Add Partner Modal */}
          <PartnerFormModal
            visible={addModalVisible}
            hr={selectedHr}
            onClose={() => setAddModalVisible(false)}
            onSaveSuccess={() => {
              loadPartnersForHr(selectedHr);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#64748b',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },

  /* HR GRID STYLES - Matches Image 1 */
  hrGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  hrCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    ...theme.shadows.sm,
  },
  hrCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hrCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  hrCardIconText: {
    fontSize: 20,
    fontWeight: '800',
  },
  hrCardInfo: {
    flex: 1,
  },
  hrCardName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  hrCardRef: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  /* SELECTED HR VIEW STYLES */
  selectedHrContainer: {
    flex: 1,
  },
  subHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  backBtnText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  subHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subHeaderRef: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addPartnerBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    ...theme.shadows.sm,
  },
  addPartnerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  partnerViewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  countPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    ...theme.shadows.sm,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleBtnTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },

  /* PARTNERS TABLE STYLES */
  tableScrollVertical: {
    flex: 1,
  },
  tableScrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  headerColText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 14,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#fafcff',
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  colPartnerName: {
    width: 140,
  },
  colPartnerEmail: {
    width: 180,
  },
  colPartnerRef: {
    width: 130,
  },
  colPartnerClicks: {
    width: 90,
  },
  colPartnerApps: {
    width: 120,
  },
  colPartnerActions: {
    width: 160,
  },
  partnerNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  partnerEmailText: {
    fontSize: 12,
    color: '#475569',
  },
  partnerMobileText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  refBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  refBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  clicksText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  appsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  closedSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareIconBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteIconBtn: {
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 6,
  },
  deleteIconText: {
    fontSize: 13,
  },

  /* PARTNERS CARD STYLES */
  cardScroll: {
    flex: 1,
  },
  cardListContent: {
    padding: 14,
  },
  partnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  partnerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cardPartnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardPartnerEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  cardPartnerMobile: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  cardRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  cardRefLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  cardStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  statValBlue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
  statValGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  statSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  cardShareBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardShareBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardDeleteBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cardDeleteBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
