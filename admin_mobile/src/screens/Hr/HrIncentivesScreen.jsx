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
} from 'react-native';
import StatusBadge from '../../components/common/StatusBadge';
import hrService from '../../services/hrService';
import jobService from '../../services/jobService';
import apiClient from '../../services/api';

export default function HrIncentivesScreen({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const referralCode = currentUser?.referralCode || 'HR-27394';

  const loadData = useCallback(async () => {
    try {
      const [dashData, jobsData] = await Promise.all([
        referralCode ? hrService.getHrDashboard(referralCode) : Promise.resolve(null),
        jobService.getJobs().catch(() => []),
      ]);
      if (dashData) setStats(dashData);
      if (Array.isArray(jobsData)) setJobsList(jobsData);
    } catch (err) {
      console.error('Error fetching incentives data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [referralCode]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const applications = useMemo(() => stats?.applications || [], [stats]);

  // Closed candidates: Selected, Converted, Hired, Joined
  const closedCandidates = useMemo(() => {
    const closedStatuses = ['selected', 'converted', 'hired', 'joined'];
    return applications
      .filter((app) => closedStatuses.includes((app.status || '').toLowerCase()))
      .map((app) => {
        let incentive =
          currentUser?.role === 'agent' ? app.agentIncentiveAmount : app.incentiveAmount;
        if (!Number(incentive) && jobsList.length > 0) {
          let job = jobsList.find((j) => j.id === app.jobId);
          if (!job) {
            job = jobsList.find(
              (j) =>
                (j.title || '').trim().toLowerCase() === (app.jobTitle || '').trim().toLowerCase() &&
                (j.companyName || '').trim().toLowerCase() === (app.companyName || '').trim().toLowerCase()
            );
          }
          if (job) {
            const isPaid = Number(app.paymentAmount) >= 1499 || job.isFicFlow;
            incentive = isPaid
              ? Number(job.hrIncentivePaid) || 0
              : Number(job.hrIncentiveFree) || 0;
          }
        }
        return {
          ...app,
          computedIncentive: Number(incentive) || 0,
        };
      });
  }, [applications, jobsList, currentUser?.role]);

  // Total Paid Incentives
  const totalPaidIncentives = useMemo(() => {
    return closedCandidates.reduce((sum, app) => {
      return sum + (app.incentiveStatus === 'Paid' ? app.computedIncentive : 0);
    }, 0);
  }, [closedCandidates]);

  // Available Wallet Balance (closed candidates eligible for withdrawal)
  const availableCandidates = useMemo(() => {
    return closedCandidates.filter((app) => {
      const isPaid = app.incentiveStatus === 'Paid';
      const isRequested = app.incentiveStatus === 'Withdraw Requested';
      return !isPaid && !isRequested && app.computedIncentive > 0;
    });
  }, [closedCandidates]);

  const availableWalletBalance = useMemo(() => {
    return availableCandidates.reduce((sum, app) => sum + app.computedIncentive, 0);
  }, [availableCandidates]);

  // Check 30-day cooldown
  const hasWithdrawalCooldown = useMemo(() => {
    return closedCandidates.some((app) => {
      if (
        !app.incentiveUpdatedAt ||
        (app.incentiveStatus !== 'Withdraw Requested' && app.incentiveStatus !== 'Paid')
      ) {
        return false;
      }
      const diffDays = Math.floor(
        (Date.now() - new Date(app.incentiveUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays < 30;
    });
  }, [closedCandidates]);

  // Withdrawal History Grouped by Date
  const withdrawalHistory = useMemo(() => {
    const map = {};
    closedCandidates.forEach((app) => {
      if (app.incentiveStatus === 'Withdraw Requested' || app.incentiveStatus === 'Paid') {
        const dateKey = app.incentiveUpdatedAt
          ? new Date(app.incentiveUpdatedAt).toLocaleDateString('en-IN')
          : 'Recent';
        if (!map[dateKey]) {
          map[dateKey] = {
            date: dateKey,
            amount: 0,
            candidatesCount: 0,
            isPaid: true,
          };
        }
        map[dateKey].amount += app.computedIncentive;
        map[dateKey].candidatesCount += 1;
        if (app.incentiveStatus !== 'Paid') {
          map[dateKey].isPaid = false;
        }
      }
    });
    return Object.values(map);
  }, [closedCandidates]);

  const handleWithdraw = () => {
    if (hasWithdrawalCooldown) {
      Alert.alert(
        'Cooldown Active',
        'You have already requested a withdrawal within the last 30 days. Please wait for the cooldown period.'
      );
      return;
    }

    if (availableCandidates.length === 0 || availableWalletBalance === 0) {
      Alert.alert('No Balance', 'You currently do not have eligible funds in your wallet balance.');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Request withdrawal for ₹${availableWalletBalance.toLocaleString('en-IN')} to your registered bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw Now',
          onPress: async () => {
            setWithdrawing(true);
            try {
              await Promise.all(
                availableCandidates.map((app) =>
                  apiClient.put(`/api/applications/${app.id}/incentive-status`, {
                    status: 'Withdraw Requested',
                  })
                )
              );
              Alert.alert(
                'Request Submitted',
                'Withdrawal request submitted! It will be received in your bank within 24 to 48 hours.'
              );
              loadData();
            } catch (err) {
              console.error('Withdrawal error:', err);
              Alert.alert('Error', 'Failed to request withdrawal. Please try again.');
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading Incentives & Wallet...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <View style={styles.headerBox}>
            <Text style={styles.headerIcon}>🎁</Text>
            <View>
              <Text style={styles.headerTitle}>Incentives & Wallet</Text>
              <Text style={styles.headerSub}>Track candidate earnings & request payouts</Text>
            </View>
          </View>

          {/* 1. Wallet Balance & Total Earned Cards matching website */}
          <View style={styles.kpiGrid}>
            {/* Available Wallet Balance */}
            <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
              <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
                <Text style={{ fontSize: 20 }}>💰</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel}>Available Wallet Balance</Text>
                <Text style={styles.kpiVal}>₹{availableWalletBalance.toLocaleString('en-IN')}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.withdrawBtn,
                  (availableWalletBalance === 0 || hasWithdrawalCooldown) && styles.withdrawBtnDisabled,
                ]}
                onPress={handleWithdraw}
                disabled={availableWalletBalance === 0 || hasWithdrawalCooldown || withdrawing}
                activeOpacity={0.8}
              >
                {withdrawing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.withdrawBtnText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Total Incentives Earned */}
            <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
              <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                <Text style={{ fontSize: 20 }}>🏆</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel}>Total Incentives Earned</Text>
                <Text style={styles.kpiVal}>₹{totalPaidIncentives.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* 2. Candidate-wise Incentives Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Candidate-wise Incentives</Text>
              <Text style={styles.sectionBadge}>
                {closedCandidates.length} closed candidate{closedCandidates.length === 1 ? '' : 's'}
              </Text>
            </View>

            {closedCandidates.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>No closed candidate incentives yet</Text>
                <Text style={styles.emptySub}>
                  When your candidates get Selected or Joined, their incentive rewards will appear here!
                </Text>
              </View>
            ) : (
              closedCandidates.map((c, idx) => {
                const isPaid = c.incentiveStatus === 'Paid';
                const isRequested = c.incentiveStatus === 'Withdraw Requested';

                return (
                  <View key={c.id || idx} style={styles.candidateRow}>
                    <View style={styles.candidateLeft}>
                      <View style={styles.candidateAvatar}>
                        <Text style={styles.avatarText}>
                          {(c.candidateName || 'C').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.candidateName}>{c.candidateName}</Text>
                        <Text style={styles.candidateJob} numberOfLines={1}>
                          {c.jobTitle} • {c.companyName}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <StatusBadge status={c.status} size="small" />
                        </View>
                      </View>
                    </View>

                    <View style={styles.candidateRight}>
                      <Text style={styles.incentiveAmount}>
                        ₹{c.computedIncentive.toLocaleString('en-IN')}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          isPaid
                            ? styles.statusPaid
                            : isRequested
                            ? styles.statusRequested
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isPaid
                              ? styles.statusPaidText
                              : isRequested
                              ? styles.statusRequestedText
                              : styles.statusPendingText,
                          ]}
                        >
                          {isPaid ? '✓ Paid' : isRequested ? '⏳ Processing' : '● Available'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* 3. Withdrawal History Section */}
          {withdrawalHistory.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Withdrawal History</Text>
              </View>

              {withdrawalHistory.map((item, idx) => (
                <View key={idx} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyDate}>📅 {item.date}</Text>
                    <Text style={styles.historySub}>
                      {item.candidatesCount} candidate payout{item.candidatesCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyAmount}>₹{item.amount.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.historyStatus, item.isPaid ? styles.paidCol : styles.procCol]}>
                      {item.isPaid ? 'Disbursed' : 'Under Review'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 4. Payout Information Callout */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Direct Bank Payout Terms</Text>
            <Text style={styles.infoItem}>
              • Payouts are credited to your registered bank account within 24 to 48 hours of request.
            </Text>
            <Text style={styles.infoItem}>
              • Make sure your bank details in Profile Settings are verified and up to date.
            </Text>
            <Text style={styles.infoItem}>
              • Only candidate placements marked as Selected or Joined qualify for incentive withdrawals.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 14,
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
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingTop: 4,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  kpiGrid: {
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  kpiVal: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  withdrawBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  withdrawBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionBadge: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 10,
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  candidateAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  candidateName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  candidateJob: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  candidateRight: {
    alignItems: 'flex-end',
  },
  incentiveAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPaid: {
    backgroundColor: '#ecfdf5',
  },
  statusPaidText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  statusRequested: {
    backgroundColor: '#eff6ff',
  },
  statusRequestedText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusPendingText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  historySub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyStatus: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  paidCol: {
    color: '#059669',
  },
  procCol: {
    color: '#2563eb',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
    marginTop: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoItem: {
    fontSize: 11.5,
    color: '#1e3a8a',
    lineHeight: 17,
    marginTop: 4,
  },
});
