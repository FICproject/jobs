import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Share,
  Modal,
  ScrollView,
} from 'react-native';
import StatusBadge from '../../components/common/StatusBadge';
import UpdateStatusModal from '../../components/modals/UpdateStatusModal';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import hrService from '../../services/hrService';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';

const avatarGradients = [
  { bg: '#FF6B6B', cardBg: '#fff5f5' },
  { bg: '#4FACFE', cardBg: '#f0f9ff' },
  { bg: '#43E97B', cardBg: '#f0fdf4' },
  { bg: '#FA709A', cardBg: '#fdf2f8' },
  { bg: '#667EEA', cardBg: '#eef2ff' },
  { bg: '#F77062', cardBg: '#fff1f2' },
];

export default function HrOverviewScreen({ currentUser, onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals for HR Actions
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);

  const referralCode = currentUser?.referralCode || stats?.referralCode || 'HR-27394';
  const mobileReferralUrl =
    stats?.mobileReferralUrl ||
    currentUser?.mobileReferralUrl ||
    `https://jobs.forgeindiaconnect.in?m.ref=${referralCode}`;
  const webReferralUrl =
    stats?.webReferralUrl ||
    currentUser?.webReferralUrl ||
    `https://jobs.forgeindiaconnect.in?ref=${referralCode}`;

  const loadData = useCallback(async () => {
    try {
      const [dashData, jobsData] = await Promise.all([
        referralCode ? hrService.getHrDashboard(referralCode) : Promise.resolve(null),
        jobService.getJobs().catch(() => []),
      ]);
      if (dashData) setStats(dashData);
      if (Array.isArray(jobsData)) setJobsList(jobsData);
    } catch (err) {
      console.error('Error fetching HR overview data:', err);
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

  // Share handlers using mobileReferralUrl (?m.ref=)
  const handleCopyLink = () => {
    Share.share({
      message: `Join Forge India Connect job portal via my referral link: ${mobileReferralUrl}`,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Check out these amazing job openings at Forge India Connect: ${mobileReferralUrl}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {
      Share.share({ message: text });
    });
  };

  const handleUpdateStatusSuccess = async (appId, newStatus, adminNotes) => {
    await applicationService.updateApplicationStatus(appId, newStatus, adminNotes);
    loadData();
  };

  // 8 Metric calculations matching website
  const linkClicks = stats?.linkClicks || 0;
  const candidatesApplied = stats?.totalApplications || applications.length || 0;

  const processingCount = useMemo(
    () =>
      applications.filter(
        (a) => !a.status || ['Applied', 'Shortlisted', 'Follow up'].includes(a.status)
      ).length,
    [applications]
  );

  const interviewsCount = useMemo(
    () => applications.filter((a) => a.status === 'Interview Scheduled').length,
    [applications]
  );

  const selectedCount = useMemo(
    () =>
      applications.filter((a) =>
        ['Selected', 'Converted', 'Hired'].includes(a.status)
      ).length,
    [applications]
  );

  const rejectedCount = useMemo(
    () =>
      applications.filter((a) =>
        ['Rejected', 'Not Interested'].includes(a.status)
      ).length,
    [applications]
  );

  // Incentive calculation logic matching website bundle DA
  const { totalIncentiveAmount, upcomingIncentiveAmount, upcomingCount } = useMemo(() => {
    let totalIncentive = 0;
    let upcomingIncentive = 0;
    let upCount = 0;

    if (applications.length > 0) {
      applications.forEach((app) => {
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
        const val = Number(incentive) || 0;
        const isSelected = ['Selected', 'Converted', 'Hired'].includes(app.status);
        const isRejected = ['Rejected', 'Not Interested'].includes(app.status);

        if (isSelected) {
          totalIncentive += val;
        } else if (!isRejected) {
          upcomingIncentive += val;
          upCount += 1;
        }
      });
    }
    return {
      totalIncentiveAmount: totalIncentive,
      upcomingIncentiveAmount: upcomingIncentive,
      upcomingCount: upCount,
    };
  }, [applications, jobsList, currentUser?.role]);

  // Recent 5 applicants (reversed order of creation)
  const recentApplicants = useMemo(
    () => [...applications].reverse().slice(0, 5),
    [applications]
  );

  // Recent notifications for the bell
  const recentNotifications = useMemo(() => {
    return applications.slice(0, 5).map((app) => ({
      id: app.id || app._id,
      text: `${app.candidateName} applied for ${app.jobTitle}!`,
      company: app.companyName,
      time: app.appliedAt
        ? new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now',
    }));
  }, [applications]);

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading HR Dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Welcome Header (Matching Website Screenshot) */}
          <View style={styles.welcomeRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.welcomeTitle}>
                Welcome, {currentUser?.name || 'Priyadharshini'}!
              </Text>
              <Text style={styles.welcomeSub}>Here is your personal HR Dashboard.</Text>
            </View>

            {/* Notification Bell with Red Badge */}
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => setShowNotifications(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {recentNotifications.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {Math.min(recentNotifications.length, 9)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 2. Your Unique Referral Link Card (Matching Website Screenshot) */}
          <View style={styles.referralCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.referralTitle}>Candidate Mobile Referral Link</Text>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{referralCode}</Text>
              </View>
            </View>
            <Text style={styles.referralSub}>
              Share this mobile link with candidates. Sourced candidates will automatically open or install the Candidate Mobile App and track under your account.
            </Text>

            {/* Read-only URL box displaying mobileReferralUrl (?m.ref=) */}
            <View style={styles.referralInputBox}>
              <Text style={styles.referralInputText} numberOfLines={1}>
                {mobileReferralUrl}
              </Text>
            </View>

            {/* Copy and WhatsApp Buttons */}
            <View style={styles.referralBtnRow}>
              <TouchableOpacity
                style={[styles.refBtn, { backgroundColor: copied ? '#059669' : '#10b981' }]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Text style={styles.refBtnText}>{copied ? '✓ Copied' : '📋 Copy Mobile Link'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.refBtn, { backgroundColor: '#25D366' }]}
                onPress={handleShareWhatsApp}
                activeOpacity={0.8}
              >
                <Text style={styles.refBtnText}>💬 WhatsApp Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. 8 KPI Cards in 2-Column Grid (Matching Website Screenshot) */}
          <View style={styles.kpiGridSection}>
            {/* Row 1: Link Clicks & Candidates Applied */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderLeftColor: '#6366f1', backgroundColor: '#eef2ff' }]}>
                <View style={[styles.kpiIconCircle, { backgroundColor: '#c7d2fe' }]}>
                  <Text style={{ fontSize: 18 }}>👆</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>{linkClicks}</Text>
                  <Text style={styles.kpiLabel}>Total Link Clicks</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#10b981', backgroundColor: '#ecfdf5' }]}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'All')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#a7f3d0' }]}>
                  <Text style={{ fontSize: 18 }}>👥</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>{candidatesApplied}</Text>
                  <Text style={styles.kpiLabel}>Candidates Applied</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 2: Processing & Interview Scheduled */}
            <View style={styles.kpiRow}>
              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#3b82f6', backgroundColor: '#eff6ff' }]}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'Processing')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#bfdbfe' }]}>
                  <Text style={{ fontSize: 18 }}>💼</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>{processingCount}</Text>
                  <Text style={styles.kpiLabel}>Processing</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#f59e0b', backgroundColor: '#fffbeb' }]}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'Interview Scheduled')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#fde68a' }]}>
                  <Text style={{ fontSize: 18 }}>📅</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>{interviewsCount}</Text>
                  <Text style={styles.kpiLabel}>Interview Scheduled</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 3: Selected & Rejected */}
            <View style={styles.kpiRow}>
              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#059669', backgroundColor: '#ecfdf5' }]}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'Selected')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#a7f3d0' }]}>
                  <Text style={{ fontSize: 17, color: '#047857', fontWeight: '900' }}>✓</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>{selectedCount}</Text>
                  <Text style={styles.kpiLabel}>Selected</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#ef4444', backgroundColor: '#fef2f2' }]}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'Rejected')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#fecaca' }]}>
                  <Text style={{ fontSize: 17, color: '#b91c1c', fontWeight: '900' }}>✕</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>{rejectedCount}</Text>
                  <Text style={styles.kpiLabel}>Rejected</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Row 4: Total Incentive & Upcoming Incentives */}
            <View style={styles.kpiRow}>
              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#8b5cf6', backgroundColor: '#f5f3ff' }]}
                onPress={() => onNavigateTab && onNavigateTab('incentives')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#ddd6fe' }]}>
                  <Text style={{ fontSize: 18 }}>🎁</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>₹{totalIncentiveAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiLabel}>Total Incentive</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.kpiCard, { borderLeftColor: '#f97316', backgroundColor: '#fff7ed' }]}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'Processing')}
                activeOpacity={0.7}
              >
                <View style={[styles.kpiIconCircle, { backgroundColor: '#ffedd5' }]}>
                  <Text style={{ fontSize: 18 }}>📈</Text>
                </View>
                <View style={styles.kpiTextContainer}>
                  <Text style={styles.kpiVal}>₹{upcomingIncentiveAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.kpiLabel} numberOfLines={2}>
                    Upcoming ({upcomingCount} Candidates) Incentives
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Recent Applicants Section (Matching Website Screenshot) */}
          <View style={styles.recentSectionCard}>
            <View style={styles.recentHeaderRow}>
              <View style={styles.recentTitleBox}>
                <Text style={{ fontSize: 16 }}>👥</Text>
                <Text style={styles.recentTitle}>Recent Applicants</Text>
              </View>

              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => onNavigateTab && onNavigateTab('applied', 'All')}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {/* List of Recent Candidates */}
            {recentApplicants.length === 0 ? (
              <View style={styles.emptyRecentBox}>
                <Text style={styles.emptyRecentText}>No recent applicants yet</Text>
                <Text style={styles.emptyRecentSub}>
                  Share your referral link with candidates to start receiving applications!
                </Text>
              </View>
            ) : (
              recentApplicants.map((app, idx) => {
                const grad = avatarGradients[idx % avatarGradients.length];
                const initial = app.candidateName
                  ? app.candidateName.charAt(0).toUpperCase()
                  : '?';

                return (
                  <TouchableOpacity
                    key={app.id || app._id || idx}
                    style={[styles.applicantRowCard, { backgroundColor: grad.cardBg }]}
                    onPress={() => {
                      setSelectedApp(app);
                      setStatusModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Colorful Gradient Circle Avatar */}
                    <View style={[styles.avatarCircle, { backgroundColor: grad.bg }]}>
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    </View>

                    {/* Candidate Name & Role */}
                    <View style={styles.applicantInfo}>
                      <Text style={styles.applicantName} numberOfLines={1}>
                        {app.candidateName}
                      </Text>
                      <Text style={styles.applicantJob} numberOfLines={1}>
                        {app.jobTitle}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.badgeContainer}>
                      <StatusBadge status={app.status} size="small" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          style={styles.notifBackdrop}
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifHeaderTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.notifClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {recentNotifications.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8' }}>No recent activity</Text>
              </View>
            ) : (
              recentNotifications.map((notif, idx) => (
                <View key={idx} style={styles.notifItem}>
                  <View style={styles.notifIconBox}>
                    <Text style={{ fontSize: 16 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifText}>{notif.text}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>

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
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
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

  // 1. Welcome Row
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 3,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  bellIcon: {
    fontSize: 17,
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  // 2. Referral Card (Matching vibrant Indigo/Purple from screenshot)
  referralCard: {
    backgroundColor: '#4338ca',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  referralTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  codeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  referralSub: {
    fontSize: 11.5,
    color: '#e0e7ff',
    lineHeight: 16,
    marginBottom: 12,
  },
  referralInputBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  referralInputText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  referralBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  refBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // 3. 8 KPI Cards Grid (2 columns x 4 rows)
  kpiGridSection: {
    gap: 10,
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    minHeight: 64,
  },
  kpiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },

  // 4. Recent Applicants Section
  recentSectionCard: {
    backgroundColor: 'rgba(238, 242, 255, 0.65)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(199, 210, 254, 0.8)',
    padding: 14,
    marginBottom: 16,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAllBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  viewAllText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  applicantRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
    marginBottom: 8,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  applicantJob: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  emptyRecentBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  emptyRecentSub: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },

  // Notification Modal
  notifBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notifPanel: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  notifHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  notifClose: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
    padding: 4,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notifIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  notifTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});
