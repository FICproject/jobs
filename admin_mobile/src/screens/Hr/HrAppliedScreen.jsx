import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  TextInput,
  ScrollView,
  Share,
} from 'react-native';
import UpdateStatusModal from '../../components/modals/UpdateStatusModal';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import hrService from '../../services/hrService';
import applicationService from '../../services/applicationService';

export default function HrAppliedScreen({ currentUser, initialFilter = 'All' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter || 'All');
  const [dateFilter, setDateFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  // Modals for HR Actions
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);

  const referralCode = currentUser?.referralCode || 'HR-27394';

  const loadData = useCallback(async () => {
    try {
      if (referralCode) {
        const data = await hrService.getHrDashboard(referralCode);
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching HR applications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [referralCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const applications = useMemo(() => stats?.applications || [], [stats]);

  const handleUpdateStatusSuccess = async (appId, newStatus, adminNotes) => {
    await applicationService.updateApplicationStatus(appId, newStatus, adminNotes);
    loadData();
  };

  // Filtered Applications matching website logic
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return applications.filter((app) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (app.candidateName && app.candidateName.toLowerCase().includes(q)) ||
        (app.candidateMobile && app.candidateMobile.includes(q)) ||
        (app.jobTitle && app.jobTitle.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === 'Processing') {
        matchesStatus = !app.status || ['Applied', 'Shortlisted', 'Follow up'].includes(app.status);
      } else if (statusFilter !== 'All') {
        matchesStatus = app.status === statusFilter;
      }

      let matchesDate = true;
      if (dateFilter !== 'All' && app.appliedAt) {
        const appDate = new Date(app.appliedAt);
        const appDateStart = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate()).getTime();
        if (dateFilter === 'Today') {
          matchesDate = appDateStart === todayStart;
        } else if (dateFilter === 'Yesterday') {
          const yesterday = todayStart - 86400000;
          matchesDate = appDateStart === yesterday;
        } else if (dateFilter === 'Last 7 Days') {
          const sevenDaysAgo = todayStart - 604800000;
          matchesDate = appDateStart >= sevenDaysAgo;
        } else if (dateFilter === 'This Month') {
          matchesDate =
            appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [applications, searchTerm, statusFilter, dateFilter]);

  // Export CSV matching web logic
  const handleExportCSV = () => {
    if (!filteredApplications.length) return;
    const headers = [
      'Name',
      'Mobile',
      'Email',
      'City',
      'Experience',
      'Job Title',
      'Company',
      'Status',
      'Applied At',
    ];
    const rows = filteredApplications.map((app) => [
      app.candidateName || '',
      app.candidateMobile || 'N/A',
      app.candidateEmail || 'N/A',
      app.candidateLocation || 'N/A',
      app.candidateExperience || 'N/A',
      app.jobTitle || '',
      app.companyName || '',
      app.status || '',
      app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN') : 'N/A',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${val}"`).join(','))
      .join('\n');

    Share.share({
      title: `Candidates_Export_${new Date().toISOString().split('T')[0]}.csv`,
      message: csvContent,
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Applied':
        return { bg: '#f1f5f9', text: '#0f172a', border: 'transparent' };
      case 'Shortlisted':
        return { bg: '#d1fae5', text: '#047857', border: 'transparent' };
      case 'Interview Scheduled':
        return { bg: '#dbeafe', text: '#1d4ed8', border: 'transparent' };
      case 'Selected':
      case 'Converted':
        return { bg: '#ecfdf5', text: '#047857', border: '#10b981' };
      case 'Rejected':
      case 'Not Interested':
        return { bg: '#ffe4e6', text: '#be123c', border: 'transparent' };
      case 'Follow up':
        return { bg: '#fef3c7', text: '#b45309', border: 'transparent' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: 'transparent' };
    }
  };

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Title & Export Row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.screenTitle}>Your Candidates</Text>
          <Text style={styles.candidateCount}>
            Showing {filteredApplications.length} candidate{filteredApplications.length === 1 ? '' : 's'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportCSV}
          activeOpacity={0.8}
        >
          <Text style={styles.exportIcon}>📥</Text>
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or phone..."
          placeholderTextColor="#94a3b8"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Horizontal Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsRow}
      >
        {[
          { label: 'All Statuses', value: 'All' },
          { label: 'Processing', value: 'Processing' },
          { label: 'Applied', value: 'Applied' },
          { label: 'Interview Scheduled', value: 'Interview Scheduled' },
          { label: 'Selected', value: 'Selected' },
          { label: 'Rejected', value: 'Rejected' },
        ].map((item) => {
          const isSelected = statusFilter === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setStatusFilter(item.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  isSelected && styles.filterPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date Filter Horizontal Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePillsRow}
      >
        {['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'This Month'].map((period) => {
          const val = period === 'All Time' ? 'All' : period;
          const isSelected = dateFilter === val;
          return (
            <TouchableOpacity
              key={period}
              style={[styles.datePill, isSelected && styles.datePillActive]}
              onPress={() => setDateFilter(val)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.datePillText,
                  isSelected && styles.datePillTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCandidateCard = ({ item: app }) => {
    const isExpanded = expandedId === (app.id || app._id);
    const initial = app.candidateName ? app.candidateName.charAt(0).toUpperCase() : '?';
    const appliedDate = app.appliedAt
      ? new Date(app.appliedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'N/A';

    const badgeStyle = getStatusBadgeStyle(app.status);

    return (
      <View style={[styles.candidateCard, isExpanded && styles.candidateCardExpanded]}>
        {/* Accordion Header Row */}
        <TouchableOpacity
          style={styles.cardHeaderRow}
          onPress={() => toggleExpand(app.id || app._id)}
          activeOpacity={0.7}
        >
          {/* Avatar circle */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          {/* Candidate Info */}
          <View style={styles.candidateHeaderInfo}>
            <Text style={styles.candidateName} numberOfLines={1}>
              {app.candidateName}
            </Text>
            <Text style={styles.candidateMobile}>{app.candidateMobile || 'N/A'}</Text>
          </View>

          {/* Job Info */}
          <View style={styles.jobHeaderInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {app.jobTitle}
            </Text>
            <Text style={styles.companyName} numberOfLines={1}>
              {app.companyName || 'Corporate Partner'}
            </Text>
          </View>

          {/* Status & Chevron */}
          <View style={styles.headerRightCol}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: badgeStyle.bg,
                  borderColor: badgeStyle.border,
                  borderWidth: badgeStyle.border === 'transparent' ? 0 : 1,
                },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                {app.status || 'Applied'}
              </Text>
            </View>
            <View style={styles.dateAndChevron}>
              <Text style={styles.dateText}>{appliedDate}</Text>
              <Text style={styles.chevronIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Accordion Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Candidate Details Grid */}
            <View style={styles.detailsGrid}>
              {/* Full Name */}
              <View style={styles.detailBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                  <Text style={styles.boxIcon}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>FULL NAME</Text>
                  <Text style={styles.boxValue}>{app.candidateName}</Text>
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.detailBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                  <Text style={styles.boxIcon}>📞</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>MOBILE NUMBER</Text>
                  <Text style={styles.boxValue}>{app.candidateMobile || 'N/A'}</Text>
                </View>
              </View>

              {/* Date of Birth */}
              <View style={styles.detailBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Text style={styles.boxIcon}>🎂</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>DATE OF BIRTH</Text>
                  <Text style={styles.boxValue}>
                    {app.candidateDOB
                      ? new Date(app.candidateDOB).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* City */}
              <View style={styles.detailBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={styles.boxIcon}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>CITY</Text>
                  <Text style={styles.boxValue}>{app.candidateLocation || 'N/A'}</Text>
                </View>
              </View>

              {/* Experience */}
              <View style={styles.detailBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#fdf2f8' }]}>
                  <Text style={styles.boxIcon}>💼</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>EXPERIENCE</Text>
                  <Text style={styles.boxValue}>{app.candidateExperience || 'N/A'}</Text>
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.detailBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#fff7ed' }]}>
                  <Text style={styles.boxIcon}>✉️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.boxLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.boxValue} numberOfLines={1}>
                    {app.candidateEmail || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Contact Buttons */}
            <View style={styles.quickContactRow}>
              {app.candidateMobile ? (
                <TouchableOpacity
                  style={styles.callPill}
                  onPress={() => Linking.openURL(`tel:${app.candidateMobile}`)}
                >
                  <Text style={styles.callPillText}>📞 Call Candidate</Text>
                </TouchableOpacity>
              ) : null}

              {app.candidateMobile ? (
                <TouchableOpacity
                  style={styles.whatsappPill}
                  onPress={() => {
                    const msg = `Hello ${app.candidateName}, regarding your application for ${app.jobTitle} at Forge India Connect:`;
                    Linking.openURL(
                      `https://wa.me/91${app.candidateMobile.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
                    );
                  }}
                >
                  <Text style={styles.whatsappPillText}>💬 WhatsApp</Text>
                </TouchableOpacity>
              ) : null}

              {app.candidateEmail ? (
                <TouchableOpacity
                  style={styles.emailPill}
                  onPress={() => Linking.openURL(`mailto:${app.candidateEmail}`)}
                >
                  <Text style={styles.emailPillText}>✉️ Email</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* HR Actions Section */}
            <View style={styles.hrActionsCard}>
              <Text style={styles.hrActionsTitle}>HR Actions</Text>
              <View style={styles.hrActionsBtns}>
                <TouchableOpacity
                  style={styles.updateStatusBtn}
                  onPress={() => {
                    setSelectedApp(app);
                    setStatusModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.updateStatusBtnText}>Update Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.scheduleInterviewBtn}
                  onPress={() => {
                    setSelectedApp(app);
                    setInterviewModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scheduleInterviewBtnText}>Schedule Interview</Text>
                </TouchableOpacity>

                {app.candidateResumeUrl ? (
                  <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={() => Linking.openURL(app.candidateResumeUrl)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resumeBtnText}>📄 View Resume</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading candidates...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          ListHeaderComponent={renderHeader}
          renderItem={renderCandidateCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No candidates found.</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query, status, or date range filter.
              </Text>
            </View>
          }
        />
      )}

      {/* Status Modal */}
      <UpdateStatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        application={selectedApp}
        onUpdateStatus={handleUpdateStatusSuccess}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        visible={interviewModalVisible}
        onClose={() => setInterviewModalVisible(false)}
        application={selectedApp}
        onScheduledSuccess={() => {
          loadData();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  headerArea: {
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  candidateCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  exportIcon: {
    fontSize: 14,
  },
  exportText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 4,
  },
  filterPillsRow: {
    gap: 6,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  datePillsRow: {
    gap: 6,
    paddingBottom: 4,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  datePillActive: {
    backgroundColor: '#0f172a',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  candidateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  candidateCardExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderColor: '#cbd5e1',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  candidateHeaderInfo: {
    flex: 1.1,
    marginRight: 6,
  },
  candidateName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  candidateMobile: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  jobHeaderInfo: {
    flex: 1.1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  companyName: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateAndChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  chevronIcon: {
    fontSize: 9,
    color: '#64748b',
    marginLeft: 2,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  detailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '48%',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxIcon: {
    fontSize: 13,
  },
  boxLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  boxValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 1,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  callPill: {
    flex: 1,
    backgroundColor: '#eff6ff',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  callPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  whatsappPill: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  whatsappPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  emailPill: {
    flex: 1,
    backgroundColor: '#fff7ed',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  emailPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ea580c',
  },
  hrActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  hrActionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  hrActionsBtns: {
    flexDirection: 'column',
    gap: 8,
  },
  updateStatusBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
  },
  updateStatusBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleInterviewBtn: {
    backgroundColor: '#f8fafc',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  scheduleInterviewBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  resumeBtn: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  resumeBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
