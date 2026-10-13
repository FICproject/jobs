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
  Share,
  Platform,
} from 'react-native';
import applicationService from '../../services/applicationService';
import hrService from '../../services/hrService';

// Exact fee calculation logic matching production web bundle qe(S)
export const calculateFee = (app) => {
  if (app.paymentAmount && Number(app.paymentAmount) > 0) {
    return Number(app.paymentAmount);
  }
  const jobTitle = (app.jobTitle || app.title || '').toLowerCase();
  const company = (app.companyName || '').toLowerCase();
  if (jobTitle.includes('casa')) return 149;
  if (
    jobTitle.includes('free') ||
    jobTitle.includes('internship') ||
    company.includes('free') ||
    company.includes('internship')
  ) {
    return 0;
  }
  if (app.isFicFlow || jobTitle.includes('fic')) {
    return 1499;
  }
  return 49;
};

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

export default function AdminPaymentsScreen({ onNavigateTab }) {
  const [applications, setApplications] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Exact matching tabs: 'transactions' (Payment Transactions) | 'pending' (Payment Pending)
  // Default to 'pending' to match web active view for urgent action items
  const [activeTab, setActiveTab] = useState('pending');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth'

  const loadData = useCallback(async () => {
    try {
      const [appsData, hrsData] = await Promise.all([
        applicationService.getApplications().catch(() => []),
        hrService.getHrs().catch(() => []),
      ]);
      setApplications(Array.isArray(appsData) ? appsData : []);
      setHrs(Array.isArray(hrsData) ? hrsData : []);
    } catch (err) {
      console.error('Error fetching payments data:', err);
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

  // Group applications into Pending and Completed (matches web logic: qe(S) > 0)
  const { pendingApps, transactionApps, summary } = useMemo(() => {
    const pending = [];
    const transactions = [];

    let totalPendingAmount = 0;
    let totalCollectedAmount = 0;

    applications.forEach((app) => {
      const fee = calculateFee(app);
      // Filter out zero-fee jobs exactly matching web: O.filter(S => qe(S) > 0)
      if (fee <= 0) return;

      const isPending =
        (app.status || '').toLowerCase() === 'payment pending';

      if (isPending) {
        pending.push(app);
        totalPendingAmount += fee;
      } else {
        transactions.push(app);
        totalCollectedAmount += fee;
      }
    });

    return {
      pendingApps: pending,
      transactionApps: transactions,
      summary: {
        pendingCount: pending.length,
        transactionCount: transactions.length,
        totalPendingAmount,
        totalCollectedAmount,
      },
    };
  }, [applications]);

  // Current list based on active tab
  const currentList = activeTab === 'pending' ? pendingApps : transactionApps;

  // Filtered applications based on search & date
  const filteredList = useMemo(() => {
    return currentList.filter((app) => {
      // Search
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (app.candidateName && app.candidateName.toLowerCase().includes(q)) ||
        (app.candidateMobile && app.candidateMobile.includes(q)) ||
        (app.candidateEmail && app.candidateEmail.toLowerCase().includes(q)) ||
        (app.applicationNumber && app.applicationNumber.toLowerCase().includes(q)) ||
        (app.paymentId && app.paymentId.toLowerCase().includes(q)) ||
        (app.jobTitle && app.jobTitle.toLowerCase().includes(q)) ||
        (app.referredBy && app.referredBy.toLowerCase().includes(q)) ||
        (app.companyName && app.companyName.toLowerCase().includes(q));

      // Date Filter
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

      return matchesSearch && matchesDate;
    });
  }, [currentList, searchTerm, dateFilter]);

  // 1-Tap Call to assist candidate
  const handleCall = (mobile) => {
    if (!mobile) {
      Alert.alert('Notice', 'No phone number available for this candidate.');
      return;
    }
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  // 1-Tap Email
  const handleEmail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  // Exact Web Admin Manual "mr(S)" Approve Handler
  const handleApprovePayment = (app) => {
    const candidateName =
      app.candidateName && app.candidateName !== 'Anonymous'
        ? app.candidateName
        : app.candidateDetails?.name || 'this candidate';

    // Exact web confirmation message:
    // window.confirm(`Mark payment for ${S.candidateName} as Paid and update application status to 'Applied'?`)
    Alert.alert(
      'Confirm Manual Approval',
      `Mark payment for ${candidateName} as Paid and update application status to 'Applied'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setApprovingId(app.id);
            try {
              const manualPaymentId = 'MANUAL_PAYMENT_' + Date.now();
              await applicationService.approvePayment(app.id, manualPaymentId);

              // Reload data immediately
              await loadData();

              Alert.alert(
                'Payment Approved! 🎉',
                `Payment for ${candidateName} has been approved.\nApplication status updated to 'Applied'.`
              );
            } catch (err) {
              Alert.alert('Approval Error', err.message || 'Failed to approve payment.');
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  // Export CSV
  const handleExportCSV = async () => {
    if (!filteredList.length) {
      Alert.alert('Export CSV', 'No records to export in current view.');
      return;
    }

    try {
      const headers = [
        'Date',
        'Candidate Name',
        'Mobile',
        'Job Applied',
        'HR Ref',
        'Amount',
        'Payment ID',
        'Status',
      ];

      const rows = filteredList.map((app) => {
        const appliedDate = app.appliedAt
          ? new Date(app.appliedAt).toLocaleDateString()
          : 'N/A';
        const fee = calculateFee(app);
        const matchedHr = hrs.find(
          (h) => (h.referralCode || '').toLowerCase() === (app.referredBy || '').toLowerCase()
        );
        const hrRef = app.referredBy
          ? `${matchedHr ? matchedHr.name : 'Unknown HR'} (${app.referredBy})`
          : 'Direct';

        return [
          appliedDate,
          app.candidateName || app.candidateDetails?.name || '',
          app.candidateMobile || app.candidateDetails?.mobile || '',
          app.jobTitle || '',
          hrRef,
          `₹${fee}`,
          app.paymentId || 'N/A',
          app.status || (activeTab === 'pending' ? 'Pending' : 'Success'),
        ];
      });

      const escapeCsv = (val) => `"${String(val).replace(/"/g, '""')}"`;
      const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map((row) => row.map(escapeCsv).join(',')),
      ].join('\n');

      await Share.share({
        title: `Payment_${activeTab}_Export`,
        message: csvContent,
      });
    } catch (err) {
      Alert.alert('Export Error', err.message || 'Could not export CSV.');
    }
  };

  // Header Component matching exact website layout
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title & Subtitle exactly matching website */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Payment Transactions</Text>
        <Text style={styles.screenSub}>
          Track candidate application fees and manual approvals.
        </Text>
      </View>

      {/* Exact Web Pill Tabs */}
      <View style={styles.webPillsRow}>
        {/* Payment Transactions Pill (Green when active) */}
        <TouchableOpacity
          style={[
            styles.webPill,
            activeTab === 'transactions'
              ? styles.webPillTransactionsActive
              : styles.webPillInactive,
          ]}
          onPress={() => setActiveTab('transactions')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.webPillText,
              activeTab === 'transactions'
                ? styles.webPillTextActive
                : styles.webPillTextInactive,
            ]}
          >
            Payment Transactions
          </Text>
          <View
            style={[
              styles.pillCountBadge,
              activeTab === 'transactions'
                ? styles.pillCountBadgeActiveTrans
                : styles.pillCountBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.pillCountText,
                activeTab === 'transactions'
                  ? styles.pillCountTextActive
                  : styles.pillCountTextInactive,
              ]}
            >
              {summary.transactionCount}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Payment Pending Pill (Orange when active) */}
        <TouchableOpacity
          style={[
            styles.webPill,
            activeTab === 'pending'
              ? styles.webPillPendingActive
              : styles.webPillInactive,
          ]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.webPillText,
              activeTab === 'pending'
                ? styles.webPillTextActive
                : styles.webPillTextInactive,
            ]}
          >
            Payment Pending
          </Text>
          <View
            style={[
              styles.pillCountBadge,
              activeTab === 'pending'
                ? styles.pillCountBadgeActivePending
                : styles.pillCountBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.pillCountText,
                activeTab === 'pending'
                  ? styles.pillCountTextActive
                  : styles.pillCountTextInactive,
              ]}
            >
              {summary.pendingCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* KPI Summary Cards */}
      <View style={styles.kpiRow}>
        {/* Pending Card */}
        <TouchableOpacity
          style={[
            styles.kpiCard,
            styles.kpiCardPending,
            activeTab === 'pending' && styles.kpiCardActivePending,
          ]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#ffedd5' }]}>
              <Text style={{ fontSize: 15 }}>⏳</Text>
            </View>
            <View style={styles.kpiBadgePending}>
              <Text style={styles.kpiBadgeTextPending}>Needs Action</Text>
            </View>
          </View>
          <Text style={[styles.kpiVal, { color: '#c2410c' }]}>{summary.pendingCount}</Text>
          <Text style={styles.kpiLabel}>Payment Pending</Text>
          <Text style={styles.kpiSub}>₹{summary.totalPendingAmount.toLocaleString()} Pending</Text>
        </TouchableOpacity>

        {/* Transactions Card */}
        <TouchableOpacity
          style={[
            styles.kpiCard,
            styles.kpiCardPaid,
            activeTab === 'transactions' && styles.kpiCardActivePaid,
          ]}
          onPress={() => setActiveTab('transactions')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiTopRow}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#dcfce7' }]}>
              <Text style={{ fontSize: 15 }}>💳</Text>
            </View>
            <View style={styles.kpiBadgePaid}>
              <Text style={styles.kpiBadgeTextPaid}>Confirmed</Text>
            </View>
          </View>
          <Text style={[styles.kpiVal, { color: '#15803d' }]}>{summary.transactionCount}</Text>
          <Text style={styles.kpiLabel}>Paid Transactions</Text>
          <Text style={styles.kpiSub}>₹{summary.totalCollectedAmount.toLocaleString()} Collected</Text>
        </TouchableOpacity>
      </View>

      {/* Follow-up Assistance Alert Banner in Pending view */}
      {activeTab === 'pending' && summary.pendingCount > 0 && (
        <View style={styles.assistBanner}>
          <Text style={styles.assistBannerIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.assistBannerTitle}>Instant Follow-up Assistance</Text>
            <Text style={styles.assistBannerSub}>
              These candidates submitted their profile but haven't finished payment yet. Use the green Call button to reach out and help them complete their application.
            </Text>
          </View>
        </View>
      )}

      {/* Search & Date Filters */}
      <View style={styles.filterCard}>
        {/* Search */}
        <View style={styles.searchInputRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidate name, mobile, HR code, job..."
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

        {/* Date Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePillsRow}>
          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'last7', label: 'Last 7 Days' },
            { key: 'thisMonth', label: 'This Month' },
          ].map((item) => {
            const isActive = dateFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.datePill, isActive && styles.datePillActive]}
                onPress={() => setDateFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.datePillText, isActive && styles.datePillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom Actions Row */}
        <View style={styles.filterActionsRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} activeOpacity={0.8}>
            <Text style={styles.exportBtnIcon}>📥</Text>
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>

          <Text style={styles.resultsBadge}>
            Showing {filteredList.length} of {currentList.length}
          </Text>
        </View>
      </View>
    </View>
  );

  // Exact Web columns represented in mobile card:
  // Date | Candidate | Job Applied | HR Ref | Amount | Payment ID | Status | Actions
  const renderItem = ({ item: app }) => {
    const isPending = (app.status || '').toLowerCase() === 'payment pending';
    const candidateName =
      app.candidateName && app.candidateName !== 'Anonymous'
        ? app.candidateName
        : app.candidateDetails?.name || 'Anonymous Candidate';

    const mobile =
      app.candidateMobile ||
      app.candidateDetails?.mobile ||
      app.candidateDetails?.phone ||
      '';
    const email = app.candidateEmail || app.candidateDetails?.email || '';

    // Exact fee matching qe(S)
    const feeAmount = calculateFee(app);

    // Exact web date formatting: new Date(S.appliedAt).toLocaleDateString()
    const appliedDateDisplay = app.appliedAt
      ? new Date(app.appliedAt).toLocaleDateString()
      : 'N/A';

    // HR Ref matching web: J.find(W => W.referralCode === S.referredBy)
    const matchedHr = app.referredBy
      ? hrs.find(
          (h) =>
            (h.referralCode || '').trim().toLowerCase() ===
            String(app.referredBy).trim().toLowerCase()
        )
      : null;

    const isApproving = approvingId === app.id;

    return (
      <View style={[styles.card, isPending ? styles.cardPending : styles.cardPaid]}>
        {/* Top Header Row: Date & Status Badge matching web */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.dateTagBox}>
            <Text style={styles.dateTagText}>📅 {appliedDateDisplay}</Text>
          </View>

          {/* Status Badge: "Pending" or "Success" exactly matching web */}
          <View
            style={[
              styles.webStatusBadge,
              isPending ? styles.webStatusBadgePending : styles.webStatusBadgeSuccess,
            ]}
          >
            <Text
              style={[
                styles.webStatusBadgeText,
                isPending ? styles.webStatusBadgeTextPending : styles.webStatusBadgeTextSuccess,
              ]}
            >
              {isPending ? 'Pending' : 'Success'}
            </Text>
          </View>
        </View>

        {/* Candidate & Amount Row */}
        <View style={styles.candidateRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.candidateName} numberOfLines={1}>
              {candidateName}
            </Text>
            {mobile ? (
              <Text style={styles.candidateMobileText}>{mobile}</Text>
            ) : null}
          </View>

          {/* Amount: ₹qe(S) */}
          <View style={styles.amountBox}>
            <Text style={styles.amountText}>₹{feeAmount}</Text>
            <Text style={styles.amountSubText}>Fee</Text>
          </View>
        </View>

        {/* Mobile Contact Quick Actions */}
        <View style={styles.contactRow}>
          {mobile ? (
            <TouchableOpacity
              style={styles.contactBtnCall}
              onPress={() => handleCall(mobile)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactBtnCallText}>📞 Call: {mobile}</Text>
            </TouchableOpacity>
          ) : null}

          {email ? (
            <TouchableOpacity
              style={styles.contactBtnEmail}
              onPress={() => handleEmail(email)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactBtnEmailText} numberOfLines={1}>
                ✉️ {email}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Detailed Columns Box (Job Applied, HR Ref, Payment ID) */}
        <View style={styles.columnsBox}>
          {/* Job Applied */}
          <View style={styles.columnRow}>
            <Text style={styles.columnLabel}>Job Applied</Text>
            <Text style={styles.columnValueJob} numberOfLines={1}>
              {app.jobTitle || 'General Job Application'}
            </Text>
          </View>

          {/* HR Ref (HR Name in blue + referral code in grey, or italic Direct) */}
          <View style={styles.columnRow}>
            <Text style={styles.columnLabel}>HR Ref</Text>
            <View style={styles.hrRefContainer}>
              {app.referredBy ? (
                <>
                  <Text style={styles.hrRefName}>
                    {matchedHr ? matchedHr.name : 'Unknown HR'}
                  </Text>
                  <Text style={styles.hrRefCode}>{app.referredBy}</Text>
                </>
              ) : (
                <Text style={styles.hrRefDirect}>Direct</Text>
              )}
            </View>
          </View>

          {/* Payment ID (Monospace font matching web) */}
          <View style={styles.columnRow}>
            <Text style={styles.columnLabel}>Payment ID</Text>
            <View style={styles.paymentIdBox}>
              <Text style={styles.paymentIdMonospace} numberOfLines={1}>
                {app.paymentId || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Company / Partner (if available) */}
          {app.companyName ? (
            <View style={styles.columnRow}>
              <Text style={styles.columnLabel}>Company</Text>
              <Text style={styles.columnValueRegular} numberOfLines={1}>
                {app.companyName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions Row */}
        {isPending ? (
          <View style={styles.actionsRowPending}>
            {/* Call Candidate */}
            {mobile ? (
              <TouchableOpacity
                style={styles.btnCallCandidate}
                onPress={() => handleCall(mobile)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnCallCandidateText}>📞 Call</Text>
              </TouchableOpacity>
            ) : null}

            {/* Web-Style Blue Approve Button: btn-primary with check icon */}
            <TouchableOpacity
              style={[styles.btnWebApprove, isApproving && styles.btnDisabled]}
              onPress={() => handleApprovePayment(app)}
              disabled={isApproving}
              activeOpacity={0.8}
            >
              {isApproving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.btnWebApproveIcon}>✓</Text>
                  <Text style={styles.btnWebApproveText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsRowPaid}>
            {/* Exact Web Approved Indicator: Green check + text */}
            <View style={styles.approvedIndicator}>
              <Text style={styles.approvedCheckIcon}>✓</Text>
              <Text style={styles.approvedText}>Approved</Text>
            </View>

            {mobile ? (
              <TouchableOpacity
                style={styles.btnCallSmall}
                onPress={() => handleCall(mobile)}
                activeOpacity={0.7}
              >
                <Text style={styles.btnCallSmallText}>📞 Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading Payment Transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'pending' ? '🎉' : '📂'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending'
                  ? 'No Payment Pending Records'
                  : 'No Payment Transactions Found'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'pending'
                  ? 'No pending payment records found.'
                  : 'No payment transaction records found.'}
              </Text>
              {searchTerm || dateFilter !== 'all' ? (
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={() => {
                    setSearchTerm('');
                    setDateFilter('all');
                  }}
                >
                  <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // Header
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleSection: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  screenSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },

  // Web Pill Tabs matching website:
  // Payment Transactions: #059669 | Payment Pending: #ea580c | Inactive: #f1f5f9
  webPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  webPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 24,
    gap: 6,
  },
  webPillTransactionsActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  webPillPendingActive: {
    backgroundColor: '#ea580c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  webPillInactive: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  webPillTextActive: {
    color: '#ffffff',
  },
  webPillTextInactive: {
    color: '#475569',
  },
  pillCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillCountBadgeActiveTrans: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillCountBadgeActivePending: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillCountBadgeInactive: {
    backgroundColor: '#e2e8f0',
  },
  pillCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pillCountTextActive: {
    color: '#ffffff',
  },
  pillCountTextInactive: {
    color: '#475569',
  },

  // KPI Summary Row
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  kpiCardPending: {
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  kpiCardPaid: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  kpiCardActivePending: {
    borderWidth: 2,
    borderColor: '#ea580c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiCardActivePaid: {
    borderWidth: 2,
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadgePending: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiBadgeTextPending: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiBadgePaid: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiBadgeTextPaid: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  kpiVal: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },

  // Assist Alert Banner
  assistBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  assistBannerIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  assistBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  assistBannerSub: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
    lineHeight: 16,
  },

  // Filter Card
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
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
    fontWeight: 'bold',
  },
  datePillsRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  datePillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  datePillTextActive: {
    color: '#ffffff',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  exportBtnIcon: {
    fontSize: 12,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultsBadge: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // Candidate Card
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardPending: {
    borderColor: '#fed7aa',
  },
  cardPaid: {
    borderColor: '#e2e8f0',
  },

  // Header Row
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateTagBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },

  // Web Status Badges:
  // Pending: orange pill badge | Success: green pill badge
  webStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  webStatusBadgePending: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  webStatusBadgeSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  webStatusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  webStatusBadgeTextPending: {
    color: '#ea580c',
  },
  webStatusBadgeTextSuccess: {
    color: '#16a34a',
  },

  // Candidate Row
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  candidateName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  candidateMobileText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  amountBox: {
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  amountSubText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Quick Contact Row
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  contactBtnCall: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  contactBtnCallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  contactBtnEmail: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    maxWidth: '55%',
  },
  contactBtnEmailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },

  // Table Columns Representation Box
  columnsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  columnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  columnLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    width: 95,
  },
  columnValueJob: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
  },
  columnValueRegular: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
  },

  // HR Ref Styling: Name in blue (#2563eb, 600) + Code in grey (#64748b), or Direct
  hrRefContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  hrRefName: {
    fontWeight: '700',
    color: '#2563eb',
    fontSize: 13,
  },
  hrRefCode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    fontWeight: '500',
  },
  hrRefDirect: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontStyle: 'italic',
  },

  // Payment ID Monospace Box
  paymentIdBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  paymentIdMonospace: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11.5,
    color: '#334155',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Actions
  actionsRowPending: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnCallCandidate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnCallCandidateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Exact Web Blue Approve Button: #2563eb (.btn-primary)
  btnWebApprove: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnWebApproveIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  btnWebApproveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Paid Actions Row
  actionsRowPaid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  approvedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvedCheckIcon: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '900',
  },
  approvedText: {
    color: '#10b981',
    fontSize: 13.5,
    fontWeight: '700',
  },
  btnCallSmall: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnCallSmallText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
