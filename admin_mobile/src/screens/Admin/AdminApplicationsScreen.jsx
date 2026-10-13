import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import { theme } from '../../styles/theme';
import StatusBadge from '../../components/common/StatusBadge';
import UpdateStatusModal from '../../components/modals/UpdateStatusModal';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import ManualApplicationModal from '../../components/modals/ManualApplicationModal';
import applicationService from '../../services/applicationService';
import hrService from '../../services/hrService';
import jobService from '../../services/jobService';

const STATUS_OPTIONS = [
  'All Statuses',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
];

const getDateCategory = (dateString) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isToday = isSameDay(d, now);
  const isYesterday = isSameDay(d, yesterday);

  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const isLast7Days = diffDays >= 0 && diffDays <= 7;

  const isThisMonth =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth();

  return { isToday, isYesterday, isLast7Days, isThisMonth };
};

export default function AdminApplicationsScreen({ onNavigateTab }) {
  const [applications, setApplications] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters matching web portal
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [hrFilter, setHrFilter] = useState('All'); // 'All' | 'Direct' | referralCode

  // Picker Modals
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [hrPickerVisible, setHrPickerVisible] = useState(false);

  // Action Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [appsData, hrsData, jobsData] = await Promise.all([
        applicationService.getApplications(),
        hrService.getHrs(),
        jobService.getJobs(),
      ]);
      // Exclude Payment Pending applications from Applied screen (handled exclusively in Payment screen)
      const validApps = (Array.isArray(appsData) ? appsData : []).filter(
        (app) => (app.status || '').toLowerCase() !== 'payment pending'
      );
      setApplications(validApps);
      setHrs(hrsData);
      setJobs(jobsData);
    } catch (err) {
      console.error('Error fetching admin applications data:', err);
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

  // Live counts for date filter pills (matching Image 1)
  const dateCounts = useMemo(() => {
    let today = 0;
    let yesterday = 0;
    let last7 = 0;
    let thisMonth = 0;

    applications.forEach((app) => {
      const cat = getDateCategory(app.appliedAt);
      if (cat) {
        if (cat.isToday) today++;
        if (cat.isYesterday) yesterday++;
        if (cat.isLast7Days) last7++;
        if (cat.isThisMonth) thisMonth++;
      }
    });

    return {
      all: applications.length,
      today,
      yesterday,
      last7,
      thisMonth,
    };
  }, [applications]);

  // Filtered applications list
  const filteredApplications = useMemo(() => {
    return applications
      .filter((app) => (app.status || '').toLowerCase() !== 'payment pending')
      .filter((app) => {
      // 1. Search Query
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (app.candidateName && app.candidateName.toLowerCase().includes(q)) ||
        (app.candidateMobile && app.candidateMobile.includes(q)) ||
        (app.candidateEmail && app.candidateEmail.toLowerCase().includes(q)) ||
        (app.applicationNumber && app.applicationNumber.toLowerCase().includes(q)) ||
        (app.id && app.id.toLowerCase().includes(q)) ||
        (app.jobTitle && app.jobTitle.toLowerCase().includes(q)) ||
        (app.companyName && app.companyName.toLowerCase().includes(q)) ||
        (app.candidateLocation && app.candidateLocation.toLowerCase().includes(q));

      // 2. Date Filter
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        const cat = getDateCategory(app.appliedAt);
        if (!cat) return false;
        if (dateFilter === 'today') return cat.isToday;
        if (dateFilter === 'yesterday') return cat.isYesterday;
        if (dateFilter === 'last7') return cat.isLast7Days;
        if (dateFilter === 'thisMonth') return cat.isThisMonth;
        return true;
      })();

      // 3. Status Filter
      const matchesStatus = (() => {
        if (statusFilter === 'All Statuses' || statusFilter === 'All') return true;
        return (app.status || '').toLowerCase() === statusFilter.toLowerCase();
      })();

      // 4. HR Reference Filter
      const matchesHr = (() => {
        if (hrFilter === 'All') return true;
        if (hrFilter === 'Direct') {
          return !app.referredBy || app.referredBy === 'Direct' || app.referredBy.trim() === '';
        }
        return app.referredBy === hrFilter;
      })();

      return matchesSearch && matchesDate && matchesStatus && matchesHr;
    });
  }, [applications, searchTerm, dateFilter, statusFilter, hrFilter]);

  // Export CSV functionality
  const handleExportCSV = async () => {
    if (!filteredApplications.length) {
      Alert.alert('Export CSV', 'No applications to export.');
      return;
    }

    try {
      const headers = [
        'App ID',
        'Candidate Name',
        'Mobile',
        'Email',
        'City',
        'DOB / Qualification',
        'Experience',
        'Applied Job',
        'Company',
        'Applied On',
        'HR Reference',
        'Status',
      ];

      const rows = filteredApplications.map((app) => {
        const hrObj = hrs.find((h) => h.referralCode === app.referredBy);
        const hrText = app.referredBy
          ? `${hrObj ? hrObj.name : 'HR'} (${app.referredBy})`
          : 'Direct';
        const appliedDate = app.appliedAt
          ? new Date(app.appliedAt).toLocaleDateString('en-IN')
          : 'N/A';

        return [
          app.applicationNumber || app.id || '',
          app.candidateName || '',
          app.candidateMobile || '',
          app.candidateEmail || '',
          app.candidateLocation || '',
          app.candidateQualification || '',
          app.candidateExperience || '',
          app.jobTitle || '',
          app.companyName || '',
          appliedDate,
          hrText,
          app.status || 'Applied',
        ];
      });

      const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`;
      const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\n');

      await Share.share({
        title: 'Candidates Applications Export',
        message: csvContent,
      });
    } catch (err) {
      Alert.alert('Export Error', err.message || 'Could not export CSV');
    }
  };

  const handleUpdateStatusSuccess = async (appId, newStatus, adminNotes) => {
    await applicationService.updateApplicationStatus(appId, newStatus, adminNotes);
    loadData();
  };

  const handleApprovePayment = (app) => {
    const candidateName =
      app.candidateName && app.candidateName !== 'Anonymous'
        ? app.candidateName
        : (app.candidateDetails?.name || 'this candidate');

    Alert.alert(
      'Manual Payment Approval',
      `Mark payment for ${candidateName} as Paid and update application status to 'Applied'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Mark Paid',
          style: 'default',
          onPress: async () => {
            try {
              const manualPaymentId = 'MANUAL_PAYMENT_' + Date.now();
              await applicationService.approvePayment(app.id, manualPaymentId);
              Alert.alert(
                'Payment Approved! 🎉',
                `Payment for ${candidateName} has been approved.\nApplication status updated to 'Applied'.`
              );
              loadData();
            } catch (err) {
              Alert.alert('Approval Error', err.message || 'Failed to approve payment.');
            }
          },
        },
      ]
    );
  };

  const handleCall = (mobile) => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call');
    });
  };

  const handleEmail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleViewResume = (resumeUrl) => {
    if (!resumeUrl) {
      Alert.alert('Resume', 'No resume file attached for this candidate.');
      return;
    }
    Linking.openURL(resumeUrl).catch(() => {
      Alert.alert('Error', 'Unable to open resume link');
    });
  };

  // Selected HR label display
  const selectedHrLabel = useMemo(() => {
    if (hrFilter === 'All') return 'All HR References';
    if (hrFilter === 'Direct') return 'Direct (No HR)';
    const hr = hrs.find((h) => h.referralCode === hrFilter);
    return hr ? `${hr.name} (${hr.referralCode})` : hrFilter;
  }, [hrFilter, hrs]);

  const hasActiveFilters =
    dateFilter !== 'all' ||
    searchTerm !== '' ||
    statusFilter !== 'All Statuses' ||
    hrFilter !== 'All';

  const resetAllFilters = () => {
    setDateFilter('all');
    setSearchTerm('');
    setStatusFilter('All Statuses');
    setHrFilter('All');
  };

  // Render Header & Filters
  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      {/* 1. Header Title & Manual Add Button */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.screenTitle}>Applications Pipeline</Text>
          <Text style={styles.screenSub}>
            Review candidate profiles, change status, and schedule interview rounds.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addManualBtn}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addManualBtnText}>+ Add Application (Manual)</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Date Filter Pills (Matching Image 1) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePillsContainer}
      >
        <TouchableOpacity
          style={[
            styles.datePill,
            styles.datePillAll,
            dateFilter === 'all' && styles.datePillAllActive,
          ]}
          onPress={() => setDateFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.datePillText,
              styles.datePillAllText,
              dateFilter === 'all' && styles.datePillAllActiveText,
            ]}
          >
            All Applications ({dateCounts.all})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.datePill,
            styles.datePillToday,
            dateFilter === 'today' && styles.datePillTodayActive,
          ]}
          onPress={() => setDateFilter('today')}
          activeOpacity={0.7}
        >
          <Text style={styles.datePillEmoji}>🗓️</Text>
          <Text
            style={[
              styles.datePillText,
              styles.datePillTodayText,
              dateFilter === 'today' && styles.datePillTodayActiveText,
            ]}
          >
            Today ({dateCounts.today})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.datePill,
            styles.datePillYesterday,
            dateFilter === 'yesterday' && styles.datePillYesterdayActive,
          ]}
          onPress={() => setDateFilter('yesterday')}
          activeOpacity={0.7}
        >
          <Text style={styles.datePillEmoji}>🗓️</Text>
          <Text
            style={[
              styles.datePillText,
              styles.datePillYesterdayText,
              dateFilter === 'yesterday' && styles.datePillYesterdayActiveText,
            ]}
          >
            Yesterday ({dateCounts.yesterday})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.datePill,
            styles.datePillLast7,
            dateFilter === 'last7' && styles.datePillLast7Active,
          ]}
          onPress={() => setDateFilter('last7')}
          activeOpacity={0.7}
        >
          <Text style={styles.datePillEmoji}>🗓️</Text>
          <Text
            style={[
              styles.datePillText,
              styles.datePillLast7Text,
              dateFilter === 'last7' && styles.datePillLast7ActiveText,
            ]}
          >
            Last 7 Days ({dateCounts.last7})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.datePill,
            styles.datePillMonth,
            dateFilter === 'thisMonth' && styles.datePillMonthActive,
          ]}
          onPress={() => setDateFilter('thisMonth')}
          activeOpacity={0.7}
        >
          <Text style={styles.datePillEmoji}>🗓️</Text>
          <Text
            style={[
              styles.datePillText,
              styles.datePillMonthText,
              dateFilter === 'thisMonth' && styles.datePillMonthActiveText,
            ]}
          >
            This Month ({dateCounts.thisMonth})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 3. Structured Filter Card (Matching Image 1) */}
      <View style={styles.filterCard}>
        {/* Search Candidate / App */}
        <View style={styles.filterFieldBlock}>
          <Text style={styles.filterFieldLabel}>SEARCH CANDIDATE / APP</Text>
          <View style={styles.searchInputRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Name, Phone, App ID..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
            />
            {searchTerm ? (
              <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearBtn}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Dropdown Filters Row */}
        <View style={styles.dropdownsRow}>
          {/* Status Filter */}
          <View style={styles.dropdownCol}>
            <Text style={styles.filterFieldLabel}>FILTER BY STATUS</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setStatusPickerVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                {statusFilter}
              </Text>
              <Text style={styles.dropdownChevron}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* HR Reference Filter */}
          <View style={styles.dropdownCol}>
            <Text style={styles.filterFieldLabel}>FILTER BY HR REFERENCE</Text>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => setHrPickerVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                {selectedHrLabel}
              </Text>
              <Text style={styles.dropdownChevron}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Row: Export CSV & Reset */}
        <View style={styles.filterCardActions}>
          <View style={styles.actionBtnsLeft}>
            <TouchableOpacity
              style={styles.exportCsvBtn}
              onPress={handleExportCSV}
              activeOpacity={0.8}
            >
              <Text style={styles.exportCsvIcon}>📥</Text>
              <Text style={styles.exportCsvBtnText}>Export CSV</Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.resetFiltersBtn}
                onPress={resetAllFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.resetFiltersText}>Reset Filters ✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.resultsBadge}>
            Showing {filteredApplications.length} of {applications.length}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render Candidate Application Card (Matching Image 1)
  // Render Candidate Application Card (Matching Image 1)
  const renderItem = ({ item: app }) => {
    const hrObj = hrs.find((h) => h.referralCode === app.referredBy);
    const resumeLink = app.candidateResumeUrl || app.resumeUrl;
    const appIdDisplay = app.applicationNumber || app.id || 'N/A';
    const candidateName =
      app.candidateName && app.candidateName !== 'Anonymous'
        ? app.candidateName
        : (app.candidateDetails?.name || app.candidateName || 'Anonymous Candidate');

    return (
      <View style={styles.card}>
        {/* App ID & Header */}
        <View style={styles.cardTopRow}>
          <View style={styles.appIdBadge}>
            <Text style={styles.appIdText}>{appIdDisplay}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusBadge status={app.status} />
          </View>
        </View>

        <Text style={styles.candidateName}>{candidateName}</Text>

        {/* Colorful details tags (Matching Image 1) */}
        <View style={styles.tagGrid}>
          {(app.candidateMobile || app.candidateDetails?.mobile || app.candidateDetails?.phone) ? (
            <TouchableOpacity
              style={[styles.tagPill, styles.tagMobile]}
              onPress={() => handleCall(app.candidateMobile || app.candidateDetails?.mobile || app.candidateDetails?.phone)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagMobileText}>
                📱 {app.candidateMobile || app.candidateDetails?.mobile || app.candidateDetails?.phone}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.tagPill, styles.tagMobile]}>
              <Text style={styles.tagMobileText}>📱 N/A</Text>
            </View>
          )}

          {(app.candidateEmail || app.candidateDetails?.email) ? (
            <TouchableOpacity
              style={[styles.tagPill, styles.tagEmail]}
              onPress={() => handleEmail(app.candidateEmail || app.candidateDetails?.email)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagEmailText} numberOfLines={1}>
                ✉️ {app.candidateEmail || app.candidateDetails?.email}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.tagPill, styles.tagEmail]}>
              <Text style={styles.tagEmailText} numberOfLines={1}>✉️ N/A</Text>
            </View>
          )}

          <View style={[styles.tagPill, styles.tagDob]}>
            <Text style={styles.tagDobText}>
              🎂 DOB: {app.candidateDob || app.dob || app.candidateDetails?.dob || app.candidateQualification || 'N/A'}
            </Text>
          </View>

          <View style={[styles.tagPill, styles.tagCity]}>
            <Text style={styles.tagCityText}>
              🏙️ City: {app.candidateLocation || app.candidateDetails?.location || app.candidateDetails?.city || 'N/A'}
            </Text>
          </View>

          <View style={[styles.tagPill, styles.tagExp]}>
            <Text style={styles.tagExpText}>
              💼 Experience: {app.candidateExperience || app.candidateDetails?.experience || 'Fresher'}
            </Text>
          </View>
        </View>

        {/* Applied Job & HR Reference Block */}
        <View style={styles.jobInfoCard}>
          <View style={styles.jobInfoRow}>
            <Text style={styles.jobInfoLabel}>Applied Job:</Text>
            <Text style={styles.jobInfoTitle}>{app.jobTitle || 'N/A'}</Text>
          </View>

          <View style={styles.jobInfoRow}>
            <Text style={styles.jobInfoLabel}>Company:</Text>
            <Text style={styles.jobInfoVal}>{app.companyName || 'Corporate Partner'}</Text>
          </View>

          <View style={styles.jobInfoRow}>
            <Text style={styles.jobInfoLabel}>Applied On:</Text>
            <Text style={styles.jobInfoVal}>
              {app.appliedAt
                ? new Date(app.appliedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.jobInfoRow}>
            <Text style={styles.jobInfoLabel}>HR Reference:</Text>
            <Text
              style={[
                styles.jobInfoVal,
                app.referredBy ? styles.hrRefHighlight : styles.hrRefDirect,
              ]}
            >
              {app.referredBy
                ? `${hrObj ? hrObj.name : 'HR'} (${app.referredBy})`
                : 'Direct'}
            </Text>
          </View>
        </View>

        {/* Admin/HR Note */}
        {app.adminNotes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Admin / HR Note:</Text>
            <Text style={styles.notesContent}>{app.adminNotes}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {resumeLink ? (
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() => handleViewResume(resumeLink)}
              activeOpacity={0.8}
            >
              <Text style={styles.resumeBtnText}>📄 Resume</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.statusBtn}
            onPress={() => {
              setSelectedApp(app);
              setStatusModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.statusBtnText}>Update Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interviewBtn}
            onPress={() => {
              setSelectedApp(app);
              setInterviewModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.interviewBtnText}>Schedule Round</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading applications pipeline...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No applications found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search criteria, date filter, status, or HR reference.
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.emptyResetBtn} onPress={resetAllFilters}>
                  <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* FILTER BY STATUS PICKER MODAL */}
      <Modal
        visible={statusPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setStatusPickerVisible(false)}
        >
          <View style={styles.pickerDialog}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>FILTER BY STATUS</Text>
              <TouchableOpacity onPress={() => setStatusPickerVisible(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {STATUS_OPTIONS.map((st) => {
                const isSelected = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      setStatusFilter(st);
                      setStatusPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                    {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FILTER BY HR REFERENCE PICKER MODAL */}
      <Modal
        visible={hrPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHrPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setHrPickerVisible(false)}
        >
          <View style={styles.pickerDialog}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>FILTER BY HR REFERENCE</Text>
              <TouchableOpacity onPress={() => setHrPickerVisible(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {/* Option: All HR References */}
              <TouchableOpacity
                style={[styles.pickerItem, hrFilter === 'All' && styles.pickerItemActive]}
                onPress={() => {
                  setHrFilter('All');
                  setHrPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    hrFilter === 'All' && styles.pickerItemTextActive,
                  ]}
                >
                  All HR References
                </Text>
                {hrFilter === 'All' && <Text style={styles.pickerCheck}>✓</Text>}
              </TouchableOpacity>

              {/* Option: Direct (No HR) */}
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  hrFilter === 'Direct' && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setHrFilter('Direct');
                  setHrPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    hrFilter === 'Direct' && styles.pickerItemTextActive,
                  ]}
                >
                  Direct (No HR Referral)
                </Text>
                {hrFilter === 'Direct' && <Text style={styles.pickerCheck}>✓</Text>}
              </TouchableOpacity>

              {/* Option: Dynamic HR Users */}
              {hrs.map((hr) => {
                const isSelected = hrFilter === hr.referralCode;
                return (
                  <TouchableOpacity
                    key={hr.id || hr.referralCode}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      setHrFilter(hr.referralCode);
                      setHrPickerVisible(false);
                    }}
                  >
                    <View>
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextActive,
                        ]}
                      >
                        {hr.name}
                      </Text>
                      <Text style={styles.pickerItemSub}>{hr.referralCode}</Text>
                    </View>
                    {isSelected && <Text style={styles.pickerCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Manual Application Modal */}
      <ManualApplicationModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        onSaveSuccess={() => {
          loadData();
        }}
        jobs={jobs}
        hrs={hrs}
      />

      {/* Update Status Modal */}
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
    backgroundColor: '#f1f5f9',
  },
  listContent: {
    paddingBottom: 40,
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

  /* Top Header matching Web Image 1 */
  headerWrapper: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  addManualBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  addManualBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Date Pills matching Image 1 */
  datePillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  datePillEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* All Applications pill */
  datePillAll: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  datePillAllActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  datePillAllText: {
    color: '#334155',
  },
  datePillAllActiveText: {
    color: '#ffffff',
  },

  /* Today pill */
  datePillToday: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  datePillTodayActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  datePillTodayText: {
    color: '#065f46',
  },
  datePillTodayActiveText: {
    color: '#ffffff',
  },

  /* Yesterday pill */
  datePillYesterday: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  datePillYesterdayActive: {
    backgroundColor: '#d97706',
    borderColor: '#d97706',
  },
  datePillYesterdayText: {
    color: '#92400e',
  },
  datePillYesterdayActiveText: {
    color: '#ffffff',
  },

  /* Last 7 Days pill */
  datePillLast7: {
    backgroundColor: '#ede9fe',
    borderColor: '#ddd6fe',
  },
  datePillLast7Active: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  datePillLast7Text: {
    color: '#5b21b6',
  },
  datePillLast7ActiveText: {
    color: '#ffffff',
  },

  /* This Month pill */
  datePillMonth: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  datePillMonthActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  datePillMonthText: {
    color: '#075985',
  },
  datePillMonthActiveText: {
    color: '#ffffff',
  },

  /* Structured Filter Card (matching Image 1) */
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    ...theme.shadows.sm,
  },
  filterFieldBlock: {
    marginBottom: 10,
  },
  filterFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
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
  clearIcon: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },

  dropdownsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dropdownCol: {
    flex: 1,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    height: 40,
  },
  dropdownSelectorText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 4,
  },

  filterCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtnsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  exportCsvBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 115,
  },
  exportCsvIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  exportCsvBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resetFiltersBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resetFiltersText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  resultsBadge: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 'auto',
  },

  /* Candidate Card */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appIdBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563eb',
  },
  candidateName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },

  /* Tag Grid matching Image 1 */
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagMobile: {
    backgroundColor: '#d1fae5',
  },
  tagMobileText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '700',
  },
  tagEmail: {
    backgroundColor: '#dbeafe',
  },
  tagEmailText: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: '700',
  },
  tagDob: {
    backgroundColor: '#fef3c7',
  },
  tagDobText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '700',
  },
  tagCity: {
    backgroundColor: '#f3e8ff',
  },
  tagCityText: {
    fontSize: 11,
    color: '#6b21a8',
    fontWeight: '700',
  },
  tagExp: {
    backgroundColor: '#fce7f3',
  },
  tagExpText: {
    fontSize: 11,
    color: '#9d174d',
    fontWeight: '700',
  },

  /* Job Info Card */
  jobInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4,
  },
  jobInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobInfoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  jobInfoTitle: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  jobInfoVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  hrRefHighlight: {
    color: '#2563eb',
    fontWeight: '700',
  },
  hrRefDirect: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  /* Notes */
  notesBox: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  resumeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  interviewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Empty state */
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  emptyResetBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Modal Pickers */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    ...theme.shadows.lg,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  pickerClose: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
    padding: 4,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemActive: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  pickerItemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  pickerCheck: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '800',
  },

  /* Payment Pending Elements */
  cardPendingBorder: {
    borderColor: '#fed7aa',
    borderWidth: 1.5,
  },
  feePendingBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  feePendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ea580c',
  },
  approvePaymentBtn: {
    flex: 1.4,
    backgroundColor: '#0f172a',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  approvePaymentBtnText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
  },
  viewInPaymentBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewInPaymentBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  callCandidateBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callCandidateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  pendingBannerIcon: {
    fontSize: 20,
  },
  pendingBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#c2410c',
  },
  pendingBannerSub: {
    fontSize: 11,
    color: '#ea580c',
    marginTop: 2,
  },
  pendingBannerBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingBannerBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ea580c',
  },
  pendingBannerBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingBannerBtnTextActive: {
    color: '#ea580c',
  },
});
