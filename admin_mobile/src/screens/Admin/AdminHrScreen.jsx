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
  Modal,
} from 'react-native';
import { theme } from '../../styles/theme';
import HrFormModal from '../../components/modals/HrFormModal';
import hrService from '../../services/hrService';
import applicationService from '../../services/applicationService';

export default function AdminHrScreen() {
  const [hrs, setHrs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedHrIncentives, setSelectedHrIncentives] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [hrData, appData] = await Promise.all([
        hrService.getHrs().catch(() => []),
        applicationService.getApplications().catch(() => []),
      ]);
      setHrs(Array.isArray(hrData) ? hrData : []);
      setApplications(Array.isArray(appData) ? appData : []);
    } catch (err) {
      console.error('Error loading HR team:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleShareReferral = async (hr) => {
    const mobileLink = hr?.mobileReferralUrl || `https://jobs.forgeindiaconnect.in?m.ref=${hr.referralCode}`;
    const webLink = hr?.webReferralUrl || `https://jobs.forgeindiaconnect.in?ref=${hr.referralCode}`;
    try {
      await Share.share({
        message: `Forge India Connect Job Portal - Referral for ${hr.name}:\n📱 Mobile App Link: ${mobileLink}\n💻 Web Link: ${webLink}`,
      });
    } catch (err) {
      console.error('Error sharing link:', err);
    }
  };

  const handleDeleteHr = (hr) => {
    Alert.alert(
      'Remove HR Executive',
      `Are you sure you want to remove ${hr.name} (${hr.email}) from HR access?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await hrService.deleteHr(hr._id || hr.id);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove HR');
            }
          },
        },
      ]
    );
  };

  // Filtered HRs based on search query
  const filteredHrs = useMemo(() => {
    if (!searchQuery.trim()) return hrs;
    const q = searchQuery.toLowerCase();
    return hrs.filter((hr) => {
      return (
        (hr.name && hr.name.toLowerCase().includes(q)) ||
        (hr.email && hr.email.toLowerCase().includes(q)) ||
        (hr.referralCode && hr.referralCode.toLowerCase().includes(q))
      );
    });
  }, [hrs, searchQuery]);

  // Compute applications and closed count for a given HR
  const getHrMetrics = (referralCode) => {
    if (!referralCode) return { count: 0, closed: 0, apps: [] };
    const hrApps = applications.filter((app) => app.referredBy === referralCode);
    const closed = hrApps.filter(
      (app) => app.status === 'Selected' || app.status === 'Hired' || app.status === 'Closed'
    ).length;
    return { count: hrApps.length, closed, apps: hrApps };
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching Admin Website */}
      <View style={styles.topHeader}>
        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>HR / Employees Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage HR accounts and view their referral links.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addHrBtn}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addHrBtnText}>+ Add HR</Text>
        </TouchableOpacity>
      </View>

      {/* Search & View Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search HR by name, email, referral code..."
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

        <View style={styles.switchRow}>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {filteredHrs.length} {filteredHrs.length === 1 ? 'HR Account' : 'HR Accounts'}
            </Text>
          </View>

          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
              onPress={() => setViewMode('table')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.toggleBtnText, viewMode === 'table' && styles.toggleBtnTextActive]}
              >
                📋 Table
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'card' && styles.toggleBtnActive]}
              onPress={() => setViewMode('card')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.toggleBtnText, viewMode === 'card' && styles.toggleBtnTextActive]}
              >
                🗂️ Cards
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading HR / Employees...</Text>
        </View>
      ) : filteredHrs.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No HR executives found</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? 'No HR accounts match your search query.'
              : 'Tap "+ Add HR" to create an HR executive account.'}
          </Text>
        </ScrollView>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW - MATCHES ADMIN WEBSITE EXACTLY */
        <ScrollView
          style={styles.tableScrollVertical}
          contentContainerStyle={styles.tableScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.cell, styles.colName]}>
                    <Text style={styles.headerColText}>Name</Text>
                  </View>
                  <View style={[styles.cell, styles.colEmail]}>
                    <Text style={styles.headerColText}>Email</Text>
                  </View>
                  <View style={[styles.cell, styles.colReferralCode]}>
                    <Text style={styles.headerColText}>Referral Code</Text>
                  </View>
                  <View style={[styles.cell, styles.colLinkClicks]}>
                    <Text style={styles.headerColText}>Link Clicks</Text>
                  </View>
                  <View style={[styles.cell, styles.colCandidates]}>
                    <Text style={styles.headerColText}>Candidates Applied</Text>
                  </View>
                  <View style={[styles.cell, styles.colIncentives]}>
                    <Text style={styles.headerColText}>Incentives Earned</Text>
                  </View>
                  <View style={[styles.cell, styles.colStatus]}>
                    <Text style={styles.headerColText}>Status</Text>
                  </View>
                  <View style={[styles.cell, styles.colActions]}>
                    <Text style={styles.headerColText}>Actions</Text>
                  </View>
                </View>

                {/* Table Rows */}
                {filteredHrs.map((hr, idx) => {
                  const isEven = idx % 2 === 0;
                  const metrics = getHrMetrics(hr.referralCode);

                  return (
                    <View
                      key={String(hr._id || hr.id || idx)}
                      style={[styles.tableRow, isEven ? styles.rowEven : styles.rowOdd]}
                    >
                      {/* Name */}
                      <View style={[styles.cell, styles.colName]}>
                        <Text style={styles.nameText} numberOfLines={1}>
                          {hr.name}
                        </Text>
                      </View>

                      {/* Email */}
                      <View style={[styles.cell, styles.colEmail]}>
                        <Text style={styles.emailText} numberOfLines={1}>
                          {hr.email}
                        </Text>
                      </View>

                      {/* Referral Code (Amber Badge) */}
                      <View style={[styles.cell, styles.colReferralCode]}>
                        <View style={styles.referralCodeBadge}>
                          <Text style={styles.referralCodeText}>{hr.referralCode}</Text>
                        </View>
                      </View>

                      {/* Link Clicks (Bold Blue) */}
                      <View style={[styles.cell, styles.colLinkClicks]}>
                        <Text style={styles.linkClicksText}>{hr.linkClicks || 0}</Text>
                      </View>

                      {/* Candidates Applied (Bold Green + closed count) */}
                      <View style={[styles.cell, styles.colCandidates]}>
                        <Text style={styles.candidatesCountText}>{metrics.count}</Text>
                        <Text style={styles.candidatesClosedText}>
                          {metrics.closed} closed
                        </Text>
                      </View>

                      {/* Incentives Earned (Bold Green) */}
                      <View style={[styles.cell, styles.colIncentives]}>
                        <Text style={styles.incentivesText}>
                          ₹{hr.incentives || 0}
                        </Text>
                      </View>

                      {/* Status (Active Badge) */}
                      <View style={[styles.cell, styles.colStatus]}>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>Active</Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={[styles.cell, styles.colActions]}>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={styles.candidateIncentivesBtn}
                            onPress={() => setSelectedHrIncentives({ hr, metrics })}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.candidateIncentivesBtnText}>
                              🎁 Candidate Incentives
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.iconBtnBlue}
                            onPress={() => handleShareReferral(hr)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.iconBtnText}>📤</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.iconBtnRed}
                            onPress={() => handleDeleteHr(hr)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.iconBtnText}>🗑️</Text>
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
        /* CARD VIEW */
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredHrs.map((hr, idx) => {
            const metrics = getHrMetrics(hr.referralCode);
            return (
              <View key={String(hr._id || hr.id || idx)} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(hr.name || 'HR').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.cardNameRow}>
                      <Text style={styles.cardHrName}>{hr.name}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>Active</Text>
                      </View>
                    </View>
                    <Text style={styles.cardHrEmail}>{hr.email}</Text>
                  </View>
                </View>

                {/* Referral Code Row */}
                <View style={styles.cardReferralBox}>
                  <Text style={styles.cardReferralLabel}>Referral Code:</Text>
                  <View style={styles.referralCodeBadge}>
                    <Text style={styles.referralCodeText}>{hr.referralCode}</Text>
                  </View>
                </View>

                {/* Metrics Stats Grid */}
                <View style={styles.cardStatsGrid}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Link Clicks</Text>
                    <Text style={styles.statValBlue}>{hr.linkClicks || 0}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Candidates</Text>
                    <Text style={styles.statValGreen}>{metrics.count}</Text>
                    <Text style={styles.statSubText}>{metrics.closed} closed</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Incentives</Text>
                    <Text style={styles.statValGreen}>₹{hr.incentives || 0}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    style={styles.cardIncentivesBtn}
                    onPress={() => setSelectedHrIncentives({ hr, metrics })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardIncentivesBtnText}>
                      🎁 Candidate Incentives
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardShareBtn}
                    onPress={() => handleShareReferral(hr)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardShareBtnText}>📤 Share Link</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardDeleteBtn}
                    onPress={() => handleDeleteHr(hr)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cardDeleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Add HR Modal */}
      <HrFormModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSaveSuccess={() => {
          loadData();
        }}
      />

      {/* Candidate Incentives Modal */}
      {selectedHrIncentives && (
        <Modal
          visible={!!selectedHrIncentives}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedHrIncentives(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Candidate Incentives</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedHrIncentives.hr.name} ({selectedHrIncentives.hr.referralCode})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedHrIncentives(null)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Stats Overview */}
              <View style={styles.modalStatsRow}>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>Total Applied</Text>
                  <Text style={styles.modalStatValBlue}>
                    {selectedHrIncentives.metrics.count}
                  </Text>
                </View>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>Hired / Closed</Text>
                  <Text style={styles.modalStatValGreen}>
                    {selectedHrIncentives.metrics.closed}
                  </Text>
                </View>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>Incentives</Text>
                  <Text style={styles.modalStatValGreen}>
                    ₹{selectedHrIncentives.hr.incentives || 0}
                  </Text>
                </View>
              </View>

              {/* Referred Candidates List */}
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={true}>
                {selectedHrIncentives.metrics.apps.length === 0 ? (
                  <View style={styles.emptyModalBox}>
                    <Text style={styles.emptyModalText}>No candidates applied through this referral code yet.</Text>
                  </View>
                ) : (
                  selectedHrIncentives.metrics.apps.map((app, i) => (
                    <View key={String(app.id || app._id || i)} style={styles.candidateItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.candidateItemName}>
                          {app.candidateName || 'Candidate'}
                        </Text>
                        <Text style={styles.candidateItemRole}>
                          {app.jobTitle || 'Role'} • {app.companyName || 'Company'}
                        </Text>
                        {app.appliedAt ? (
                          <Text style={styles.candidateItemDate}>
                            Applied: {new Date(app.appliedAt).toLocaleDateString()}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.candidateItemRight}>
                        <View
                          style={[
                            styles.appStatusPill,
                            app.status === 'Selected' || app.status === 'Hired'
                              ? styles.appStatusSuccess
                              : styles.appStatusDefault,
                          ]}
                        >
                          <Text
                            style={[
                              styles.appStatusText,
                              app.status === 'Selected' || app.status === 'Hired'
                                ? styles.appStatusSuccessText
                                : styles.appStatusDefaultText,
                            ]}
                          >
                            {app.status || 'Applied'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  addHrBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    ...theme.shadows.sm,
  },
  addHrBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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

  /* TABLE VIEW STYLES */
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
  colName: {
    width: 150,
  },
  colEmail: {
    width: 200,
  },
  colReferralCode: {
    width: 130,
  },
  colLinkClicks: {
    width: 110,
  },
  colCandidates: {
    width: 150,
  },
  colIncentives: {
    width: 140,
  },
  colStatus: {
    width: 100,
  },
  colActions: {
    width: 250,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emailText: {
    fontSize: 13,
    color: '#475569',
  },
  referralCodeBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  referralCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  linkClicksText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  candidatesCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  candidatesClosedText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  incentivesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateIncentivesBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  candidateIncentivesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  iconBtnBlue: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  iconBtnRed: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  iconBtnText: {
    fontSize: 13,
  },

  /* CARD VIEW STYLES */
  cardScroll: {
    flex: 1,
  },
  cardListContent: {
    padding: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: '800',
  },
  cardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHrName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardHrEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardReferralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  cardReferralLabel: {
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
  cardIncentivesBtn: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardIncentivesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardShareBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  cardShareBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDeleteBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 6,
  },
  cardDeleteBtnText: {
    fontSize: 12,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  modalStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  modalStatValBlue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 2,
  },
  modalStatValGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 2,
  },
  modalList: {
    padding: 14,
  },
  emptyModalBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyModalText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  candidateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  candidateItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  candidateItemRole: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  candidateItemDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  candidateItemRight: {
    marginLeft: 10,
  },
  appStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appStatusDefault: {
    backgroundColor: '#eff6ff',
  },
  appStatusDefaultText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  appStatusSuccess: {
    backgroundColor: '#ecfdf5',
  },
  appStatusSuccessText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
});
