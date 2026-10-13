import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchCandidateApplications, fetchCandidateInterviews } from '../../services/applicationService';
import { fetchCandidateNotifications } from '../../services/notificationService';
import { updateProfile } from '../../services/profileService';
import { AuthModal } from '../../components/AuthModal';

export const CandidateDashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications', 'notifications', 'profile'

  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Edit fields
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const loadUserData = async (user) => {
    if (!user) return;
    setLoading(true);
    const candId = user.candidateId || user.id;
    try {
      const [apps, ints, notifs] = await Promise.all([
        fetchCandidateApplications(candId),
        fetchCandidateInterviews(candId),
        fetchCandidateNotifications(candId),
      ]);
      setApplications(apps);
      setInterviews(ints);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setMobile(currentUser.mobile || '');
      setLocation(currentUser.location || '');
      setQualification(currentUser.qualification || '');
      setExperience(currentUser.experience || '');
      loadUserData(currentUser);
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    setUpdatingProfile(true);
    setProfileMsg('');
    try {
      const res = await updateProfile(currentUser.id, {
        name: currentUser.name,
        mobile,
        location,
        qualification,
        experience,
      });
      setCurrentUser(res.user);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileMsg(err.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('selected')) return { bg: '#DCFCE7', text: '#15803D' };
    if (s.includes('interview')) return { bg: '#FEF3C7', text: '#B45309' };
    if (s.includes('shortlisted')) return { bg: '#E0F2FE', text: '#0369A1' };
    if (s.includes('rejected')) return { bg: '#FEE2E2', text: '#B91C1C' };
    return { bg: '#F1F5F9', text: '#475569' };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" translucent />
      {/* Top Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0, 36) + 8 },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Candidate Dashboard</Text>
          <Text style={styles.headerSub}>
            {currentUser ? `Welcome back, ${currentUser.name || 'Candidate'}` : 'Sign in to track applications & profile'}
          </Text>
        </View>

        {currentUser ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={() => setCurrentUser(null)}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.signInBtn} onPress={() => setAuthModalVisible(true)}>
            <Text style={styles.signInBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        )}
      </View>

      {!currentUser ? (
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Manage Your Career Profile</Text>
          <Text style={styles.guestDesc}>
            Sign in with your candidate account to view applied job status, interview schedules, notifications, and profile details.
          </Text>
          <TouchableOpacity style={styles.loginCta} onPress={() => setAuthModalVisible(true)}>
            <Text style={styles.loginCtaText}>Sign In to Candidate Account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiVal}>{applications.length}</Text>
              <Text style={styles.kpiLabel}>Total Applied</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiVal}>{interviews.length}</Text>
              <Text style={styles.kpiLabel}>Interviews</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiVal}>
                {applications.filter((a) => (a.status || '').toLowerCase() === 'selected').length}
              </Text>
              <Text style={styles.kpiLabel}>Selections</Text>
            </View>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'applications' && styles.tabActive]}
              onPress={() => setActiveTab('applications')}
            >
              <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>Applications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'notifications' && styles.tabActive]}
              onPress={() => setActiveTab('notifications')}
            >
              <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
                Notifications ({notifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'profile' && styles.tabActive]}
              onPress={() => setActiveTab('profile')}
            >
              <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>My Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUserData(currentUser)} />}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#0284C7" style={{ marginTop: 20 }} />
            ) : activeTab === 'applications' ? (
              applications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>💼</Text>
                  <Text style={styles.emptyTitle}>No Applications Yet</Text>
                  <Text style={styles.emptySub}>Browse available jobs and apply to track them here.</Text>
                </View>
              ) : (
                applications.map((app) => {
                  const statusStyle = getStatusStyle(app.status);
                  return (
                    <View key={app.id} style={styles.appCard}>
                      <View style={styles.appHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.appTitle}>{app.jobTitle || 'Job Role'}</Text>
                          <Text style={styles.appCompany}>{app.companyName || 'Company'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.text }]}>{app.status || 'Applied'}</Text>
                        </View>
                      </View>
                      <Text style={styles.appDate}>Applied: {new Date(app.appliedAt || Date.now()).toLocaleDateString()}</Text>
                    </View>
                  );
                })
              )
            ) : activeTab === 'notifications' ? (
              notifications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🔔</Text>
                  <Text style={styles.emptyTitle}>No New Notifications</Text>
                  <Text style={styles.emptySub}>Interview invites and status updates will show up here.</Text>
                </View>
              ) : (
                notifications.map((notif) => (
                  <View key={notif.id} style={styles.notifCard}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifMsg}>{notif.message}</Text>
                    <Text style={styles.notifDate}>{new Date(notif.date).toLocaleString()}</Text>
                  </View>
                ))
              )
            ) : (
              /* Profile Tab */
              <View style={styles.profileCard}>
                <Text style={styles.sectionTitle}>Edit Profile Information</Text>

                {profileMsg ? (
                  <Text style={[styles.msgText, profileMsg.includes('success') ? styles.successMsg : styles.errorMsg]}>
                    {profileMsg}
                  </Text>
                ) : null}

                <Text style={styles.label}>Email Address (Read-only)</Text>
                <Text style={styles.readOnlyVal}>{currentUser.email}</Text>

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="Mobile" />

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />

                <Text style={styles.label}>Qualification</Text>
                <TextInput style={styles.input} value={qualification} onChangeText={setQualification} placeholder="Qualification" />

                <Text style={styles.label}>Experience</Text>
                <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder="Experience" />

                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={updatingProfile}>
                  {updatingProfile ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Profile Updates</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    backgroundColor: '#0A1128',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  signInBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  guestIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginCta: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginCtaText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  kpiRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0284C7',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  content: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  appCompany: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  appDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  notifMsg: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
  },
  notifDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  readOnlyVal: {
    fontSize: 14,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  msgText: {
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  successMsg: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  errorMsg: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
});
