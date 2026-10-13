import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import StatusBadge from '../../components/common/StatusBadge';
import UpdateStatusModal from '../../components/modals/UpdateStatusModal';
import ScheduleInterviewModal from '../../components/modals/ScheduleInterviewModal';
import reportService from '../../services/reportService';
import applicationService from '../../services/applicationService';
import jobService from '../../services/jobService';
import hrService from '../../services/hrService';
import interviewService from '../../services/interviewService';

const CLOSED_STATUSES = ['selected', 'joined', 'converted', 'hired'];

export default function AdminDashboardScreen({ navigation, onNavigateTab }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [allApplications, setAllApplications] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [interviews, setInterviews] = useState([]);

  // Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [reportData, apps, jobsList, hrsList, intList] = await Promise.all([
        reportService.getDashboardReports().catch(() => null),
        applicationService.getApplications().catch(() => []),
        jobService.getJobs().catch(() => []),
        hrService.getHrs().catch(() => []),
        interviewService.getInterviews().catch(() => []),
      ]);

      if (reportData) setKpis(reportData);
      const appsList = Array.isArray(apps) ? apps : [];
      setAllApplications(appsList);
      setJobs(Array.isArray(jobsList) ? jobsList : []);
      setHrs(Array.isArray(hrsList) ? hrsList : []);
      setInterviews(Array.isArray(intList) ? intList : []);

      const validApps = appsList.filter(
        (a) => (a.status || '').toLowerCase() !== 'payment pending'
      );
      const sortedApps = [...validApps].sort(
        (a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0)
      );
      setRecentApplications(sortedApps.slice(0, 6));
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
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

  const handleUpdateStatusSuccess = async (appId, newStatus, adminNotes) => {
    await applicationService.updateApplicationStatus(appId, newStatus, adminNotes);
    loadData();
  };

  // Valid applications excluding 'Payment Pending' (matches web logic: status !== 'Payment Pending')
  const validApplications = useMemo(() => {
    return allApplications.filter(
      (a) => (a.status || '').toLowerCase() !== 'payment pending'
    );
  }, [allApplications]);

  // Metrics from report or calculations
  const metrics = kpis?.kpis || kpis || {};
  const totalJobs = metrics.totalJobs ?? jobs.length;
  const activeJobs =
    metrics.activeJobs ??
    jobs.filter((j) => (j.status || '').toLowerCase() === 'active').length;
  const totalCandidates =
    metrics.totalCandidates ??
    (validApplications.length > 0 ? validApplications.length : 1);
  const scheduledInterviews =
    interviews.length || (metrics.scheduledInterviews ?? 0);

  // Status counts matching exact website bundle logic
  const processingCount = useMemo(() => {
    return validApplications.filter(
      (a) =>
        ![
          'selected',
          'joined',
          'converted',
          'hired',
          'rejected',
          'not interested',
        ].includes(String(a.status || '').toLowerCase())
    ).length;
  }, [validApplications]);

  const selectedCount = useMemo(() => {
    if (metrics.selectedCandidates !== undefined && metrics.selectedCandidates !== null) {
      return metrics.selectedCandidates;
    }
    return validApplications.filter((a) =>
      CLOSED_STATUSES.includes(String(a.status || '').toLowerCase())
    ).length;
  }, [validApplications, metrics.selectedCandidates]);

  const rejectedCount = useMemo(() => {
    return validApplications.filter((a) =>
      ['rejected', 'not interested'].includes(String(a.status || '').toLowerCase())
    ).length;
  }, [validApplications]);

  const pendingPaymentsCount = useMemo(() => {
    return allApplications.filter(
      (a) => (a.status || '').toLowerCase() === 'payment pending'
    ).length;
  }, [allApplications]);

  // Calculate Upcoming HR Incentives matching website bundle Ia() formula
  const upcomingIncentives = useMemo(() => {
    let total = 0;
    hrs.forEach((hr) => {
      const hrCode = String(hr.referralCode || '').toLowerCase();
      const agentCodes = Array.isArray(hr.agentCodes) ? hr.agentCodes : [];
      const matchCodes = [hrCode, ...agentCodes].filter(Boolean);

      const hrApps = validApplications.filter((a) =>
        matchCodes.includes(String(a.referredBy || '').toLowerCase())
      );

      hrApps.forEach((app) => {
        let inc =
          hr.role === 'agent' || hr.role === 'franchise'
            ? app.agentIncentiveAmount
            : app.incentiveAmount;

        if (!Number(inc) && jobs.length > 0) {
          let matchedJob = jobs.find((j) => j.id === app.jobId);
          if (!matchedJob) {
            matchedJob = jobs.find(
              (j) =>
                (j.title || '').trim().toLowerCase() ===
                  (app.jobTitle || '').trim().toLowerCase() &&
                (j.companyName || '').trim().toLowerCase() ===
                  (app.companyName || '').trim().toLowerCase()
            );
          }
          if (matchedJob) {
            const isPaid = Number(app.paymentAmount) >= 1499 || matchedJob.isFicFlow;
            inc =
              hr.role === 'agent' || hr.role === 'franchise'
                ? isPaid
                  ? Number(matchedJob.partnerIncentivePaid) || 0
                  : Number(matchedJob.partnerIncentiveFree) || 0
                : isPaid
                ? Number(matchedJob.hrIncentivePaid) || 0
                : Number(matchedJob.hrIncentiveFree) || 0;
          }
        }

        const amount = Number(inc) || 0;
        const isClosed = CLOSED_STATUSES.includes(String(app.status || '').toLowerCase());
        const isRejected = ['rejected', 'not interested'].includes(
          String(app.status || '').toLowerCase()
        );

        if (!isClosed && !isRejected) {
          total += amount;
        }
      });
    });
    return total;
  }, [hrs, validApplications, jobs]);

  // Leaderboard Stats: Top Sourced & Top Closers per HR
  const hrLeaderboardStats = useMemo(() => {
    return hrs.map((hr) => {
      const hrCode = String(hr.referralCode || '').toLowerCase();
      const agentCodes = Array.isArray(hr.agentCodes) ? hr.agentCodes : [];
      const matchCodes = [hrCode, ...agentCodes].filter(Boolean);

      const hrApps = validApplications.filter((a) =>
        matchCodes.includes(String(a.referredBy || '').toLowerCase())
      );
      const closed = hrApps.filter((a) =>
        CLOSED_STATUSES.includes(String(a.status || '').toLowerCase())
      );

      return {
        ...hr,
        totalSourced: hrApps.length,
        totalClosed: closed.length,
      };
    });
  }, [hrs, validApplications]);

  const topApplicationsReceived = useMemo(() => {
    return [...hrLeaderboardStats]
      .sort((a, b) => b.totalSourced - a.totalSourced)
      .slice(0, 5);
  }, [hrLeaderboardStats]);

  const topClosers = useMemo(() => {
    return [...hrLeaderboardStats]
      .sort((a, b) => b.totalClosed - a.totalClosed)
      .slice(0, 5);
  }, [hrLeaderboardStats]);

  // Rank badge and avatar styling for leaderboards
  const getRankBadgeStyle = (index) => {
    if (index === 0) {
      return {
        avatarBg: '#fef08a',
        avatarBorder: '#eab308',
        avatarText: '#a16207',
        badgeBg: '#eab308',
      };
    }
    if (index === 1) {
      return {
        avatarBg: '#e2e8f0',
        avatarBorder: '#94a3b8',
        avatarText: '#475569',
        badgeBg: '#64748b',
      };
    }
    if (index === 2) {
      return {
        avatarBg: '#fed7aa',
        avatarBorder: '#f97316',
        avatarText: '#9a3412',
        badgeBg: '#ea580c',
      };
    }
    return {
      avatarBg: '#f1f5f9',
      avatarBorder: '#e2e8f0',
      avatarText: '#64748b',
      badgeBg: '#64748b',
    };
  };


  // 8 KPI Cards exactly matching the web dashboard layout & styling
  const kpiCards = [
    {
      id: 'candidates',
      iconText: '👥',
      value: totalCandidates,
      label: 'Total Candidates',
      bg: '#f0fdfa',
      border: '#5eead4',
      iconBg: '#ccfbf1',
      valueColor: '#134e4a',
      labelColor: '#134e4a',
      onPress: () => onNavigateTab && onNavigateTab('applications'),
    },
    {
      id: 'applications',
      iconText: '📄',
      value: validApplications.length,
      label: 'Applications Received',
      bg: '#fffbeb',
      border: '#fcd34d',
      iconBg: '#fef3c7',
      valueColor: '#78350f',
      labelColor: '#78350f',
      onPress: () => onNavigateTab && onNavigateTab('applications'),
    },
    {
      id: 'processing',
      iconText: '🔄',
      value: processingCount,
      label: 'Processing',
      bg: '#e0e7ff',
      border: '#a5b4fc',
      iconBg: '#c7d2fe',
      valueColor: '#312e81',
      labelColor: '#312e81',
      onPress: () => onNavigateTab && onNavigateTab('applications'),
    },
    {
      id: 'interviews',
      iconText: '📅',
      value: scheduledInterviews,
      label: 'Interviews Scheduled',
      bg: '#fdf4ff',
      border: '#f0abfc',
      iconBg: '#fae8ff',
      valueColor: '#701a75',
      labelColor: '#701a75',
      onPress: () => onNavigateTab && onNavigateTab('interviews'),
    },
    {
      id: 'selected',
      iconText: '✓',
      value: selectedCount,
      label: 'Selected',
      bg: '#ecfdf5',
      border: '#6ee7b7',
      iconBg: '#d1fae5',
      valueColor: '#064e3b',
      labelColor: '#064e3b',
      onPress: () => onNavigateTab && onNavigateTab('applications'),
    },
    {
      id: 'rejected',
      iconText: '✕',
      value: rejectedCount,
      label: 'Rejected',
      bg: '#fef2f2',
      border: '#fca5a5',
      iconBg: '#fee2e2',
      valueColor: '#7f1d1d',
      labelColor: '#7f1d1d',
      onPress: () => onNavigateTab && onNavigateTab('applications'),
    },
    {
      id: 'jobs',
      iconText: '💼',
      value: totalJobs,
      label: `Total Jobs (${activeJobs} Active)`,
      bg: '#eff6ff',
      border: '#93c5fd',
      iconBg: '#dbeafe',
      valueColor: '#1e3a8a',
      labelColor: '#1e3a8a',
      onPress: () => onNavigateTab && onNavigateTab('jobs'),
    },
    {
      id: 'incentives',
      iconText: '🎁',
      value: `₹${upcomingIncentives.toLocaleString('en-IN')}`,
      label: 'HR Upcoming Incentives',
      bg: '#fef3c7',
      border: '#fde68a',
      iconBg: '#fde68a',
      valueColor: '#92400e',
      labelColor: '#92400e',
      onPress: () => onNavigateTab && onNavigateTab('incentives'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Section Matching Web */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.bannerTitle}>Recruitment Dashboard Overview</Text>
            <Text style={styles.bannerSub}>
              Live candidate applications, job metrics, and interview tracking.
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <Text style={styles.refreshIcon}>🔄</Text>
            <Text style={styles.refreshBtnText}>Refresh Stats</Text>
          </TouchableOpacity>
        </View>

        {/* 8 KPI Cards in 2-Column Grid Matching Web Layout */}
        <View style={styles.kpiGrid}>
          {kpiCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.kpiCard,
                {
                  backgroundColor: card.bg,
                  borderColor: card.border,
                },
              ]}
              onPress={card.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.kpiIconBox, { backgroundColor: card.iconBg }]}>
                <Text style={styles.kpiIconText}>{card.iconText}</Text>
              </View>
              <Text style={[styles.kpiVal, { color: card.valueColor }]}>{card.value}</Text>
              <Text style={[styles.kpiLabel, { color: card.labelColor }]}>
                {card.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Centered Button: View Recent Applications ➔ (Matching Web Screenshot) */}
        <View style={styles.actionBtnContainer}>
          <TouchableOpacity
            style={styles.viewRecentAppsBtn}
            onPress={() => onNavigateTab && onNavigateTab('applications')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewRecentAppsText}>View Recent Applications ➔</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: 🚀 Top Applications Received (Most Apps) */}
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>
              🚀 Top Applications Received{' '}
              <Text style={styles.leaderboardSub}>(Most Apps)</Text>
            </Text>
          </View>

          <View style={styles.leaderboardList}>
            {topApplicationsReceived.map((hr, idx) => {
              const hasCount = Number(hr.totalSourced || 0) > 0;
              const rankStyle = getRankBadgeStyle(idx);
              const initial = (hr.name || 'HR').trim().charAt(0).toUpperCase();

              return (
                <TouchableOpacity
                  key={hr.id || hr.referralCode || idx}
                  style={styles.leaderboardRow}
                  onPress={() => onNavigateTab && onNavigateTab('applications')}
                  activeOpacity={0.75}
                >
                  <View style={styles.leaderboardLeft}>
                    {/* Avatar with optional profile photo & rank badge */}
                    <View style={styles.avatarWrapper}>
                      <View
                        style={[
                          styles.avatarCircle,
                          {
                            borderColor: hasCount ? rankStyle.avatarBorder : '#e2e8f0',
                            backgroundColor: hr.profilePhoto
                              ? '#f8fafc'
                              : hasCount
                              ? rankStyle.avatarBg
                              : '#f1f5f9',
                          },
                        ]}
                      >
                        {hr.profilePhoto ? (
                          <Image
                            source={{ uri: hr.profilePhoto }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.avatarInitial,
                              { color: hasCount ? rankStyle.avatarText : '#64748b' },
                            ]}
                          >
                            {initial}
                          </Text>
                        )}
                      </View>
                      {hasCount && (
                        <View
                          style={[
                            styles.rankBadge,
                            { backgroundColor: rankStyle.badgeBg },
                          ]}
                        >
                          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                        </View>
                      )}
                    </View>

                    {/* HR Name and Referral Code */}
                    <View style={styles.hrInfoCol}>
                      <Text style={styles.hrName} numberOfLines={1}>
                        {hr.name}
                      </Text>
                      <Text style={styles.hrCode}>{hr.referralCode}</Text>
                    </View>
                  </View>

                  {/* Count on Right */}
                  <Text
                    style={[
                      styles.leaderboardScore,
                      { color: hasCount ? '#2563eb' : '#94a3b8' },
                    ]}
                  >
                    {hr.totalSourced || 0}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 2: 🏆 Top Closers (Selected/Closed) */}
        <View style={styles.leaderboardCard}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>
              🏆 Top Closers{' '}
              <Text style={styles.leaderboardSub}>(Selected/Closed)</Text>
            </Text>
          </View>

          <View style={styles.leaderboardList}>
            {topClosers.map((hr, idx) => {
              const hasCount = Number(hr.totalClosed || 0) > 0;
              const rankStyle = getRankBadgeStyle(idx);
              const initial = (hr.name || 'HR').trim().charAt(0).toUpperCase();

              return (
                <TouchableOpacity
                  key={hr.id || hr.referralCode || idx}
                  style={styles.leaderboardRow}
                  onPress={() => onNavigateTab && onNavigateTab('applications')}
                  activeOpacity={0.75}
                >
                  <View style={styles.leaderboardLeft}>
                    {/* Avatar with optional profile photo & rank badge */}
                    <View style={styles.avatarWrapper}>
                      <View
                        style={[
                          styles.avatarCircle,
                          {
                            borderColor: hasCount ? rankStyle.avatarBorder : '#e2e8f0',
                            backgroundColor: hr.profilePhoto
                              ? '#f8fafc'
                              : hasCount
                              ? rankStyle.avatarBg
                              : '#f1f5f9',
                          },
                        ]}
                      >
                        {hr.profilePhoto ? (
                          <Image
                            source={{ uri: hr.profilePhoto }}
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.avatarInitial,
                              { color: hasCount ? rankStyle.avatarText : '#64748b' },
                            ]}
                          >
                            {initial}
                          </Text>
                        )}
                      </View>
                      {hasCount && (
                        <View
                          style={[
                            styles.rankBadge,
                            { backgroundColor: rankStyle.badgeBg },
                          ]}
                        >
                          <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                        </View>
                      )}
                    </View>

                    {/* HR Name and Referral Code */}
                    <View style={styles.hrInfoCol}>
                      <Text style={styles.hrName} numberOfLines={1}>
                        {hr.name}
                      </Text>
                      <Text style={styles.hrCode}>{hr.referralCode}</Text>
                    </View>
                  </View>

                  {/* Closed Count on Right */}
                  <Text
                    style={[
                      styles.leaderboardScore,
                      { color: hasCount ? '#059669' : '#94a3b8' },
                    ]}
                  >
                    {hr.totalClosed || 0}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 3: Recent Applications Feed */}
        <View style={styles.recentSectionHeader}>
          <Text style={styles.recentSectionTitle}>Recent Applications</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => onNavigateTab && onNavigateTab('applications')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllBtnText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentApplications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyText}>No recent applications found</Text>
            <Text style={styles.emptySubText}>
              Applications submitted by candidates will appear here live.
            </Text>
          </View>
        ) : (
          recentApplications.map((app) => {
            const appNumber =
              app.applicationNumber || `#APP-${String(app.id || app._id).slice(-6)}`;
            const appliedDate = app.appliedAt
              ? new Date(app.appliedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            const paymentAmount = Number(app.paymentAmount) || 0;

            return (
              <View key={app.id || app._id} style={styles.appCard}>
                {/* Top Row: Application Number + Status Badge */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.appNumberText}>{appNumber}</Text>
                  <StatusBadge status={app.status || 'Applied'} size="small" />
                </View>

                {/* Candidate Name & Role Heading */}
                <View style={styles.candidateHeader}>
                  <Text style={styles.candidateName}>
                    {app.candidateName && app.candidateName !== 'Anonymous'
                      ? app.candidateName
                      : app.candidateDetails?.name ||
                        app.candidateName ||
                        'Anonymous Candidate'}
                  </Text>
                  <Text style={styles.jobTitle}>{app.jobTitle || 'Role Not Specified'}</Text>
                  <Text style={styles.companyName}>
                    {app.companyName || 'Corporate Partner'} •{' '}
                    {app.jobLocation || app.candidateLocation || 'India'}
                  </Text>
                </View>

                {/* 5 Rich Detail Badges Matching Web */}
                <View style={styles.badgeGrid}>
                  <TouchableOpacity
                    style={[styles.badgePill, { backgroundColor: '#d1fae5' }]}
                    onPress={() =>
                      (app.candidateMobile || app.candidateDetails?.mobile) &&
                      Linking.openURL(
                        `tel:${app.candidateMobile || app.candidateDetails?.mobile}`
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.badgePillText, { color: '#047857' }]}>
                      📱{' '}
                      {app.candidateMobile ||
                        app.candidateDetails?.mobile ||
                        app.candidateDetails?.phone ||
                        'N/A'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.badgePill, { backgroundColor: '#dbeafe' }]}
                    onPress={() =>
                      (app.candidateEmail || app.candidateDetails?.email) &&
                      Linking.openURL(
                        `mailto:${app.candidateEmail || app.candidateDetails?.email}`
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.badgePillText, { color: '#1d4ed8' }]}
                      numberOfLines={1}
                    >
                      ✉️ {app.candidateEmail || app.candidateDetails?.email || 'N/A'}
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.badgePill, { backgroundColor: '#fef3c7' }]}>
                    <Text
                      style={[styles.badgePillText, { color: '#b45309' }]}
                      numberOfLines={1}
                    >
                      🎂 DOB:{' '}
                      {app.candidateDob ||
                        app.dob ||
                        app.candidateDetails?.dob ||
                        app.candidateQualification ||
                        app.candidateDOB ||
                        'N/A'}
                    </Text>
                  </View>

                  <View style={[styles.badgePill, { backgroundColor: '#f3e8ff' }]}>
                    <Text
                      style={[styles.badgePillText, { color: '#6d28d9' }]}
                      numberOfLines={1}
                    >
                      🏙️ City:{' '}
                      {app.candidateLocation ||
                        app.candidateDetails?.location ||
                        app.candidateDetails?.city ||
                        'N/A'}
                    </Text>
                  </View>

                  <View style={[styles.badgePillFull, { backgroundColor: '#fce7f3' }]}>
                    <Text style={[styles.badgePillText, { color: '#be185d' }]}>
                      💼 Experience:{' '}
                      {app.candidateExperience ||
                        app.candidateDetails?.experience ||
                        'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Date & Fee Row */}
                <View style={styles.cardMetaRow}>
                  <Text style={styles.appliedDateText}>📅 Applied: {appliedDate}</Text>
                  <Text style={styles.feeText}>
                    Fee:{' '}
                    <Text
                      style={{
                        fontWeight: '800',
                        color: paymentAmount > 100 ? '#10b981' : '#f59e0b',
                      }}
                    >
                      ₹{paymentAmount}
                    </Text>
                  </Text>
                </View>

                {/* Actions: Update Status & Schedule Round */}
                <View style={styles.appActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => {
                      setSelectedApp(app);
                      setStatusModalVisible(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionBtnOutlineText}>Update Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtnFill}
                    onPress={() => {
                      setSelectedApp(app);
                      setInterviewModalVisible(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionBtnFillText}>Schedule Round</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modals */}
      <UpdateStatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        application={selectedApp}
        onUpdateStatus={handleUpdateStatusSuccess}
      />
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
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // Header Title
  headerBanner: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  bannerSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 17,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  refreshIcon: {
    fontSize: 12,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // Pending Dashboard Banner
  pendingDashboardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pendingDashboardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#c2410c',
  },
  pendingDashboardSub: {
    fontSize: 11,
    color: '#ea580c',
    marginTop: 2,
  },
  pendingDashboardBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pendingDashboardBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // 8 KPI Cards Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    width: '48.5%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kpiIconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Center Action Button
  actionBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  viewRecentAppsBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  viewRecentAppsText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Leaderboard Container
  leaderboardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  leaderboardHeader: {
    marginBottom: 14,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  leaderboardSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  leaderboardList: {
    gap: 10,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 19,
    fontWeight: '800',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    paddingHorizontal: 4,
    borderWidth: 1.8,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rankBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  hrInfoCol: {
    flex: 1,
  },
  hrName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  hrCode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  leaderboardScore: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Recent Applications Feed
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  recentSectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAllBtn: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
  },

  // Candidate Application Card
  appCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },
  candidateHeader: {
    marginBottom: 10,
  },
  candidateName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  jobTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  companyName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  badgePill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePillFull: {
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 10,
  },
  appliedDateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  feeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  appActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutlineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  actionBtnFill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnFillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
});
