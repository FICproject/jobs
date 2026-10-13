import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import authService from '../services/authService';
import applicationService from '../services/applicationService';
import interviewService from '../services/interviewService';
import hrService from '../services/hrService';
import jobService from '../services/jobService';
import itTrainingService from '../services/itTrainingService';
import companyService from '../services/companyService';
import AdminHeader from '../components/common/AdminHeader';

// Auth Screen
import LoginScreen from '../screens/Auth/LoginScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AdminApplicationsScreen from '../screens/Admin/AdminApplicationsScreen';
import AdminJobsScreen from '../screens/Admin/AdminJobsScreen';
import AdminItProgramsScreen from '../screens/Admin/AdminItProgramsScreen';
import AdminCompaniesScreen from '../screens/Admin/AdminCompaniesScreen';
import AdminPartnersScreen from '../screens/Admin/AdminPartnersScreen';
import AdminHrScreen from '../screens/Admin/AdminHrScreen';
import AdminInterviewsScreen from '../screens/Admin/AdminInterviewsScreen';
import AdminReportsScreen from '../screens/Admin/AdminReportsScreen';
import AdminIncentivesScreen from '../screens/Admin/AdminIncentivesScreen';
import AdminPaymentsScreen from '../screens/Admin/AdminPaymentsScreen';

// HR Screens
import HrOverviewScreen from '../screens/Hr/HrOverviewScreen';
import HrAppliedScreen from '../screens/Hr/HrAppliedScreen';
import HrInterviewsScreen from '../screens/Hr/HrInterviewsScreen';
import HrIncentiveSlotScreen from '../screens/Hr/HrIncentiveSlotScreen';
import HrIncentivesScreen from '../screens/Hr/HrIncentivesScreen';
import HrPartnersScreen from '../screens/Hr/HrPartnersScreen';
import HrSettingsScreen from '../screens/Hr/HrSettingsScreen';

// Equal-size, uniform-color vector icons for Bottom Navigation
function HomeIcon({ color, size = 22 }) {
  const roofW = size * 0.92;
  const roofH = size * 0.38;
  const baseW = size * 0.68;
  const baseH = size * 0.44;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: roofW / 2,
          borderRightWidth: roofW / 2,
          borderBottomWidth: roofH,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: baseW,
          height: baseH,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            width: baseW * 0.34,
            height: baseH * 0.58,
            backgroundColor: '#0f172a',
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

function AppliedIcon({ color, size = 22 }) {
  const w = size * 0.72;
  const h = size * 0.92;
  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: 2.5,
        borderWidth: 1.8,
        borderColor: color,
        paddingHorizontal: 2.5,
        paddingVertical: 3,
        justifyContent: 'space-evenly',
      }}
    >
      <View style={{ height: 1.6, backgroundColor: color, borderRadius: 1, width: '80%' }} />
      <View style={{ height: 1.6, backgroundColor: color, borderRadius: 1, width: '100%' }} />
      <View style={{ height: 1.6, backgroundColor: color, borderRadius: 1, width: '60%' }} />
    </View>
  );
}

function PartnerIcon({ color, size = 22 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.36,
          height: size * 0.36,
          borderRadius: (size * 0.36) / 2,
          backgroundColor: color,
          marginBottom: 1.5,
        }}
      />
      <View
        style={{
          width: size * 0.66,
          height: size * 0.36,
          borderTopLeftRadius: (size * 0.66) / 2,
          borderTopRightRadius: (size * 0.66) / 2,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 7,
          height: 7,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', width: 7, height: 1.8, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ position: 'absolute', width: 1.8, height: 7, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function HrIcon({ color, size = 22 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 1.5,
          alignItems: 'center',
          opacity: 0.75,
        }}
      >
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: (size * 0.28) / 2,
            backgroundColor: color,
            marginBottom: 1,
          }}
        />
        <View
          style={{
            width: size * 0.48,
            height: size * 0.3,
            borderTopLeftRadius: (size * 0.48) / 2,
            borderTopRightRadius: (size * 0.48) / 2,
            backgroundColor: color,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 3.5,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: (size * 0.32) / 2,
            backgroundColor: color,
            marginBottom: 1,
          }}
        />
        <View
          style={{
            width: size * 0.54,
            height: size * 0.32,
            borderTopLeftRadius: (size * 0.54) / 2,
            borderTopRightRadius: (size * 0.54) / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function CalendarIcon({ color, size = 22 }) {
  const w = size * 0.82;
  const h = size * 0.78;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', width: w * 0.65, justifyContent: 'space-between', marginBottom: -2, zIndex: 1 }}>
        <View style={{ width: 2, height: 3.5, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 2, height: 3.5, backgroundColor: color, borderRadius: 1 }} />
      </View>
      <View
        style={{
          width: w,
          height: h,
          borderRadius: 3.5,
          borderWidth: 1.8,
          borderColor: color,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 3.5, backgroundColor: color }} />
        <View style={{ flex: 1, padding: 2, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'center' }}>
          <View style={{ width: 2.2, height: 2.2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2.2, height: 2.2, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 2.2, height: 2.2, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    </View>
  );
}

function GiftIcon({ color, size = 22 }) {
  const boxW = size * 0.8;
  const boxH = size * 0.6;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 2, marginBottom: -1 }}>
        <View style={{ width: 4.5, height: 3.5, borderWidth: 1.4, borderColor: color, borderRadius: 2 }} />
        <View style={{ width: 4.5, height: 3.5, borderWidth: 1.4, borderColor: color, borderRadius: 2 }} />
      </View>
      <View
        style={{
          width: boxW,
          height: boxH,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: 2.5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', top: boxH * 0.35, width: '100%', height: 1.6, backgroundColor: color }} />
        <View style={{ position: 'absolute', width: 1.6, height: '100%', backgroundColor: color }} />
      </View>
    </View>
  );
}

function CardIcon({ color, size = 22 }) {
  const cardW = size * 0.92;
  const cardH = size * 0.68;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: cardW,
          height: cardH,
          borderRadius: 3.5,
          borderWidth: 1.8,
          borderColor: color,
          justifyContent: 'space-between',
          paddingVertical: 2.5,
        }}
      >
        <View style={{ width: '100%', height: 2, backgroundColor: color }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2.5 }}>
          <View style={{ width: 3.5, height: 2.5, backgroundColor: color, borderRadius: 0.8 }} />
          <View style={{ width: 5, height: 2, backgroundColor: color, borderRadius: 0.6 }} />
        </View>
      </View>
    </View>
  );
}

function MenuIcon({ color, size = 22 }) {
  const barW = size * 0.85;
  const barH = 2.2;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: barW, height: barH, backgroundColor: color, borderRadius: 1.2, marginVertical: 2 }} />
      <View style={{ width: barW, height: barH, backgroundColor: color, borderRadius: 1.2, marginVertical: 2 }} />
      <View style={{ width: barW, height: barH, backgroundColor: color, borderRadius: 1.2, marginVertical: 2 }} />
    </View>
  );
}

const renderBottomIcon = (key, color, size = 22) => {
  switch (key) {
    case 'dashboard':
    case 'overview':
    case 'home':
      return <HomeIcon color={color} size={size} />;
    case 'applications':
    case 'applied':
      return <AppliedIcon color={color} size={size} />;
    case 'payments':
    case 'payment':
      return <CardIcon color={color} size={size} />;
    case 'partners':
      return <PartnerIcon color={color} size={size} />;
    case 'employees':
      return <HrIcon color={color} size={size} />;
    case 'interviews':
    case 'interview':
      return <CalendarIcon color={color} size={size} />;
    case 'incentives':
      return <GiftIcon color={color} size={size} />;
    case 'settings':
    case 'menu':
    case 'more':
      return <MenuIcon color={color} size={size} />;
    default:
      return null;
  }
};

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Admin Navigation State
  const [adminTab, setAdminTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  // Dynamic counts matching the web admin sidebar
  const [counts, setCounts] = useState({
    applications: 0,
    pendingPayments: 0,
    interviews: 0,
    hrs: 0,
    jobs: 0,
    itPrograms: 0,
    companies: 0,
  });

  // HR Navigation State
  const [hrTab, setHrTab] = useState('home');
  const [hrMenuOpen, setHrMenuOpen] = useState(false);
  const [hrAppliedFilter, setHrAppliedFilter] = useState('All');

  const checkSession = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = useCallback(async () => {
    try {
      const [apps, ints, hrs, jobs, itProc, comps] = await Promise.all([
        applicationService.getApplications().catch(() => []),
        interviewService.getInterviews().catch(() => []),
        hrService.getHrs().catch(() => []),
        jobService.getJobs().catch(() => []),
        itTrainingService.getItProcesses().catch(() => []),
        companyService.getCompanies().catch(() => []),
      ]);
      const appsList = Array.isArray(apps) ? apps : [];
      const pendingCount = appsList.filter(
        (a) => (a.status || '').toLowerCase() === 'payment pending'
      ).length;

      const validAppsCount = appsList.filter(
        (a) => (a.status || '').toLowerCase() !== 'payment pending'
      ).length;

      setCounts({
        applications: validAppsCount,
        pendingPayments: pendingCount,
        interviews: Array.isArray(ints) ? ints.length : 0,
        hrs: Array.isArray(hrs) ? hrs.length : 0,
        jobs: Array.isArray(jobs) ? jobs.length : 0,
        itPrograms: Array.isArray(itProc) ? itProc.length : 0,
        companies: Array.isArray(comps) ? comps.length : 0,
      });
    } catch (e) {
      console.warn('Error fetching navigation counts:', e);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadCounts();
    }
  }, [currentUser, loadCounts]);

  const handleOpenMenu = () => {
    loadCounts();
    setMenuOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setAdminTab('dashboard');
    setHrTab('home');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setMenuOpen(false);
    setHrMenuOpen(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Initializing FIC Portal...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // ------------------------------------
  // ADMIN PORTAL
  // ------------------------------------
  if (currentUser.role === 'admin') {
    const getAdminScreenInfo = () => {
      switch (adminTab) {
        case 'dashboard':
          return {
            title: 'Recruitment Dashboard Overview',
            content: <AdminDashboardScreen onNavigateTab={(t) => setAdminTab(t)} />,
          };
        case 'applications':
          return {
            title: 'Candidate Applications',
            content: <AdminApplicationsScreen onNavigateTab={(t) => setAdminTab(t)} />,
          };
        case 'payments':
          return {
            title: 'Payment Transactions',
            content: <AdminPaymentsScreen onNavigateTab={(t) => setAdminTab(t)} />,
          };
        case 'interviews':
          return {
            title: 'Scheduled Interviews',
            content: <AdminInterviewsScreen />,
          };
        case 'employees':
          return {
            title: 'HR Management',
            content: <AdminHrScreen />,
          };
        case 'partners':
          return {
            title: 'Partner Management',
            content: <AdminPartnersScreen />,
          };
        case 'incentives':
          return {
            title: 'Incentives & Payouts',
            content: <AdminIncentivesScreen />,
          };
        case 'jobs':
          return {
            title: 'Job Openings',
            content: <AdminJobsScreen />,
          };
        case 'it_training':
          return {
            title: 'IT Training Programs',
            content: <AdminItProgramsScreen />,
          };
        case 'companies':
          return {
            title: 'Hiring Companies',
            content: <AdminCompaniesScreen />,
          };
        case 'reports':
          return {
            title: 'Analytics & Pipeline Reports',
            content: <AdminReportsScreen />,
          };
        default:
          return {
            title: 'Recruitment Dashboard Overview',
            content: <AdminDashboardScreen onNavigateTab={(t) => setAdminTab(t)} />,
          };
      }
    };

    const currentScreen = getAdminScreenInfo();

    // Menu list in exact order matching the Web Admin Sidebar (Image 1)
    const navItems = [
      { key: 'dashboard', label: 'Dashboard', icon: '⊞' },
      { key: 'applications', label: `Applied (${counts.applications})`, icon: '📄' },
      {
        key: 'payments',
        label: counts.pendingPayments > 0 ? `Payments (${counts.pendingPayments} Pending)` : 'Payments',
        icon: '💳',
      },
      { key: 'interviews', label: `Interviews (${counts.interviews})`, icon: '📅' },
      { key: 'employees', label: `HR (${counts.hrs})`, icon: '👥' },
      { key: 'partners', label: 'Partners', icon: '👤+' },
      { key: 'incentives', label: 'Incentives & Payouts', icon: '🎁' },
      { key: 'jobs', label: `Job Openings (${counts.jobs})`, icon: '💼' },
      { key: 'it_training', label: `IT Programs (${counts.itPrograms})`, icon: '🎓' },
      { key: 'companies', label: `Hiring Companies (${counts.companies})`, icon: '🏢' },
      { key: 'reports', label: 'Analytics & Reports', icon: '📊' },
    ];

    return (
      <View style={styles.appContainer}>
        <AdminHeader
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenMenu={handleOpenMenu}
        />

        {/* Active Screen */}
        <View style={styles.screenWrapper}>{currentScreen.content}</View>

        {/* Quick Bottom Navigation */}
        <View style={[styles.adminBottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
          {[
            { key: 'dashboard', label: 'Home' },
            { key: 'applications', label: 'Applied' },
            {
              key: 'payments',
              label: 'Payment',
              badge: counts.pendingPayments,
            },
            { key: 'employees', label: 'HR' },
            { key: 'menu', label: 'Menu' },
          ].map((item) => {
            const isMenu = item.key === 'menu';
            const isActive = adminTab === item.key || (isMenu && menuOpen);
            const tintColor = isActive ? '#f59e0b' : '#94a3b8';

            return (
              <TouchableOpacity
                key={item.key}
                style={styles.bottomTabItem}
                onPress={() => {
                  if (isMenu) {
                    handleOpenMenu();
                  } else {
                    setAdminTab(item.key);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.bottomTabIconBox}>
                  {renderBottomIcon(item.key, tintColor, 22)}
                  {item.badge > 0 ? (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.bottomTabLabel,
                    { color: tintColor },
                    isActive && styles.bottomTabLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* LEFT SIDEBAR SLIDE-OUT DRAWER (Matching Website in Image 1) */}
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <View style={styles.drawerBackdrop}>
            {/* Left Drawer Panel */}
            <View
              style={[
                styles.drawerPanel,
                {
                  paddingTop: Math.max(insets.top, 12) + 8,
                  paddingBottom: Math.max(insets.bottom, 12) + 8,
                },
              ]}
            >
              {/* Drawer Top Brand Header */}
              <View style={styles.drawerBrandHeader}>
                <View style={styles.drawerBrandLeft}>
                  <Image
                    source={require('../assets/images/logo.png')}
                    style={styles.drawerLogo}
                    resizeMode="contain"
                  />
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.brandFIC}>FIC </Text>
                      <Text style={styles.brandPro}>RecruitPro</Text>
                    </View>
                    <Text style={styles.drawerPortalSub}>ADMIN MANAGEMENT PORTAL</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setMenuOpen(false)}
                  style={styles.drawerCloseBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.drawerCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Section Header Matching Website in Image 1 */}
              <View style={styles.sectionHeaderBox}>
                <Text style={styles.sectionHeaderLabel}>RECRUITMENT CONTROL PANEL</Text>
              </View>

              {/* Nav List with Live Counts & Website Pill Styling */}
              <ScrollView style={styles.drawerListScroll} showsVerticalScrollIndicator={false}>
                {navItems.map((item) => {
                  const isSelected = adminTab === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.sidebarItem,
                        isSelected && styles.sidebarItemActive,
                      ]}
                      onPress={() => {
                        setAdminTab(item.key);
                        setMenuOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.sidebarItemIcon,
                          isSelected && styles.sidebarItemIconActive,
                        ]}
                      >
                        {item.icon}
                      </Text>
                      <Text
                        style={[
                          styles.sidebarItemLabel,
                          isSelected && styles.sidebarItemLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Drawer Footer with Super Admin & Logout */}
              <View style={styles.drawerFooter}>
                <View style={styles.drawerFooterUser}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.drawerUserName} numberOfLines={1}>
                      {currentUser?.name || 'Super Admin'}
                    </Text>
                    <Text style={styles.drawerUserRole}>Super Admin (Admin)</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.drawerLogoutBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.drawerLogoutText}>↳ Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Right Backdrop (Tap anywhere outside to close) */}
            <TouchableOpacity
              style={styles.drawerDismissBackdrop}
              activeOpacity={1}
              onPress={() => setMenuOpen(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }

  // ------------------------------------
  // HR PORTAL
  // ------------------------------------
  const getHrScreenInfo = () => {
    switch (hrTab) {
      case 'home':
      case 'overview':
        return {
          title: 'HR Dashboard',
          content: (
            <HrOverviewScreen
              currentUser={currentUser}
              onNavigateTab={(tab, filter) => {
                setHrTab(tab);
                if (filter) setHrAppliedFilter(filter);
              }}
              onOpenMenu={() => setHrMenuOpen(true)}
            />
          ),
        };
      case 'applied':
        return {
          title: 'Candidate Applications',
          content: <HrAppliedScreen currentUser={currentUser} initialFilter={hrAppliedFilter} />,
        };
      case 'interviews':
      case 'interview':
        return {
          title: 'Candidate Interviews',
          content: <HrInterviewsScreen currentUser={currentUser} />,
        };
      case 'partners':
        return {
          title: 'Partner Management',
          content: <HrPartnersScreen currentUser={currentUser} />,
        };
      case 'incentive_slot':
        return {
          title: 'Incentive Slots',
          content: <HrIncentiveSlotScreen currentUser={currentUser} />,
        };
      case 'incentives':
        return {
          title: 'Incentives & Rewards',
          content: <HrIncentivesScreen currentUser={currentUser} />,
        };
      case 'settings':
        return {
          title: 'HR Account & Profile',
          content: <HrSettingsScreen currentUser={currentUser} onLogout={handleLogout} />,
        };
      default:
        return {
          title: 'HR Dashboard',
          content: (
            <HrOverviewScreen
              currentUser={currentUser}
              onNavigateTab={(tab, filter) => {
                setHrTab(tab);
                if (filter) setHrAppliedFilter(filter);
              }}
              onOpenMenu={() => setHrMenuOpen(true)}
            />
          ),
        };
    }
  };

  const hrScreen = getHrScreenInfo();

  return (
    <View style={styles.appContainer}>
      <AdminHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenMenu={() => setHrMenuOpen(true)}
      />

      <View style={styles.screenWrapper}>{hrScreen.content}</View>

      {/* HR Bottom Bar: Home, Applied, Interview, Incentives, More */}
      <View style={[styles.adminBottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        {[
          { key: 'home', label: 'Home' },
          { key: 'applied', label: 'Applied' },
          { key: 'interviews', label: 'Interview' },
          { key: 'incentives', label: 'Incentives' },
          { key: 'more', label: 'More' },
        ].map((item) => {
          const isActive =
            item.key === 'more'
              ? ['partners', 'incentive_slot', 'settings'].includes(hrTab) || hrMenuOpen
              : item.key === 'home'
              ? hrTab === 'home' || hrTab === 'overview'
              : item.key === 'interviews'
              ? hrTab === 'interviews' || hrTab === 'interview'
              : hrTab === item.key;
          const tintColor = isActive ? '#f59e0b' : '#94a3b8';

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.bottomTabItem}
              onPress={() => {
                if (item.key === 'more') {
                  setHrMenuOpen(true);
                } else {
                  setHrTab(item.key);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.bottomTabIconBox}>
                {renderBottomIcon(item.key, tintColor, 22)}
              </View>
              <Text
                style={[
                  styles.bottomTabLabel,
                  { color: tintColor },
                  isActive && styles.bottomTabLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* HR SIDEBAR DRAWER (When user clicks More) */}
      <Modal
        visible={hrMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setHrMenuOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <View style={[styles.drawerPanel, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
            {/* Header matching HR Website */}
            <View style={styles.drawerBrandHeader}>
              <View style={styles.drawerBrandLeft}>
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.drawerLogo}
                  resizeMode="contain"
                />
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.brandFIC}>FIC </Text>
                    <Text style={styles.brandPro}>RecruitPro</Text>
                  </View>
                  <Text style={styles.drawerPortalSub}>HR WORKSPACE</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setHrMenuOpen(false)}
                style={styles.drawerCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.drawerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Section Header Matching Website in Image 1 */}
            <View style={styles.sectionHeaderBox}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>HR Workspace</Text>
              <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Manage your referrals</Text>
            </View>

            {/* Sidebar Navigation Items: Home, Applied, Interview, Partners, Incentive Slot, Incentives, Settings */}
            <ScrollView style={styles.drawerListScroll} showsVerticalScrollIndicator={false}>
              {[
                { key: 'home', label: 'Home', icon: '📊' },
                { key: 'applied', label: 'Applied', icon: '👥' },
                { key: 'interviews', label: 'Interview', icon: '📅' },
                { key: 'partners', label: 'Partners', icon: '🤝' },
                { key: 'incentive_slot', label: 'Incentive Slot', icon: '💼' },
                { key: 'incentives', label: 'Incentives', icon: '🎁' },
                { key: 'settings', label: 'Settings', icon: '⚙️' },
              ].map((item) => {
                const isSelected =
                  item.key === 'home'
                    ? hrTab === 'home' || hrTab === 'overview'
                    : item.key === 'interviews'
                    ? hrTab === 'interviews' || hrTab === 'interview'
                    : hrTab === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.sidebarItem,
                      isSelected && styles.sidebarItemActive,
                    ]}
                    onPress={() => {
                      setHrTab(item.key);
                      setHrMenuOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.sidebarItemIcon,
                        isSelected && styles.sidebarItemIconActive,
                      ]}
                    >
                      {item.icon}
                    </Text>
                    <Text
                      style={[
                        styles.sidebarItemLabel,
                        isSelected && styles.sidebarItemLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Below Sign Out option */}
            <View style={[styles.drawerFooter, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
              <View style={styles.drawerFooterUser}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.drawerUserName} numberOfLines={1}>
                    {currentUser?.name || 'Priyadharshini'}
                  </Text>
                  <Text style={styles.drawerUserRole}>
                    HR Partner ({currentUser?.referralCode || 'HR-27394'})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.drawerLogoutBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.drawerLogoutText}>↳ Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Right Backdrop (Tap outside to close) */}
          <TouchableOpacity
            style={styles.drawerDismissBackdrop}
            activeOpacity={1}
            onPress={() => setHrMenuOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  screenWrapper: {
    flex: 1,
  },

  // Admin Bottom Bar
  adminBottomBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingBottom: 6,
    paddingTop: 6,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomTabIconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  bottomTabLabelActive: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ea580c',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    textAlign: 'center',
  },

  // LEFT SIDEBAR DRAWER (Matching Website in Image 1)
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
  },
  drawerPanel: {
    width: '78%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#0a0f1d',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  drawerDismissBackdrop: {
    flex: 1,
    height: '100%',
  },
  drawerBrandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  drawerBrandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
  },
  brandFIC: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  brandPro: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '900',
  },
  drawerPortalSub: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  drawerCloseBtn: {
    padding: 6,
  },
  drawerCloseText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '700',
  },

  // Section Header matching Image 1
  sectionHeaderBox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  sectionHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  drawerListScroll: {
    flex: 1,
  },

  // Nav Item styles (Active: Vibrant Blue Pill matching Image 1)
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: '#2563eb', // exact vibrant blue pill from web portal in Image 1
  },
  sidebarItemIcon: {
    fontSize: 16,
    color: '#94a3b8',
    marginRight: 12,
    width: 22,
    textAlign: 'center',
  },
  sidebarItemIconActive: {
    color: '#ffffff',
  },
  sidebarItemLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#94a3b8',
    flex: 1,
  },
  sidebarItemLabelActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // Drawer Footer
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#070b14',
  },
  drawerFooterUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerUserName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerUserRole: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerLogoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  drawerLogoutText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },

  // HR Bottom Bar
  hrBottomBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingBottom: 6,
    paddingTop: 6,
  },
  hrTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  hrTabIcon: {
    fontSize: 18,
    opacity: 0.65,
  },
  hrTabIconActive: {
    opacity: 1,
  },
  hrTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  hrTabLabelActive: {
    color: '#f59e0b',
    fontWeight: '700',
  },
});
