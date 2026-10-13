import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompanyCard } from '../../components/CompanyCard';
import { fetchCompanies, fetchJobs } from '../../services/jobService';

const getCompanyColor = (name) => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('idfc')) return '#991B1B';
  if (lowerName.includes('bandhan')) return '#0284C7';
  if (lowerName.includes('hdfc')) return '#2563EB';
  if (lowerName.includes('aditya birla')) return '#B91C1C';
  if (lowerName.includes('kotak')) return '#003366';
  if (lowerName.includes('mahindra finance')) return '#E11D48';
  if (lowerName.includes('axis')) return '#831843';
  if (lowerName.includes('tata aig') || lowerName.includes('tata')) return '#1E3A8A';
  if (lowerName.includes('icici')) return '#EA580C';
  if (lowerName.includes('yes bank')) return '#0284C7';
  return '#475569';
};

const companyPriorityMap = {
  'YES Bank': 0,
  'IDFC First Bank': 1,
  'Bandhan Bank': 2,
  'HDFC Life': 3,
  'Aditya Birla Capital': 4,
  'Kotak Mahindra Bank': 5,
  'Mahindra Finance': 6,
  'Axis Bank': 7,
  'TATA AIG': 8,
};

const getJobsForCompany = (comp, allJobs) => {
  const cName = (comp.name || '').toLowerCase();
  const firstWord = cName.split(' ')[0];
  return allJobs.filter(j => {
    if (j.companyId === comp.id) return true;
    const jComp = (j.companyName || '').toLowerCase();
    if (cName.includes('mahindra finance') && jComp.includes('mahindra finance')) return true;
    if (cName.includes('aditya') && jComp.includes('aditya')) return true;
    if (cName.includes('kotak') && jComp.includes('kotak')) return true;
    if (cName.includes('idfc') && jComp.includes('idfc')) return true;
    if (cName.includes('axis') && jComp.includes('axis')) return true;
    if (cName.includes('bandhan') && jComp.includes('bandhan')) return true;
    if (cName.includes('yes') && jComp.includes('yes')) return true;
    if (cName.includes('hdfc') && jComp.includes('hdfc')) return true;
    if (cName.includes('tata') && jComp.includes('tata')) return true;
    return jComp === cName || (firstWord && jComp.includes(firstWord));
  });
};

const RollingMarquee = ({ items, renderItem, speed = 40 }) => {
  const [contentWidth, setContentWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (contentWidth <= 0) return;
    scrollX.setValue(0);
    const duration = (contentWidth * 1000) / speed;
    const anim = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -contentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [contentWidth, speed]);

  return (
    <View style={styles.marqueeContainer}>
      <Animated.View
        style={[
          styles.marqueeTrack,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        <View
          style={styles.marqueeRow}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - contentWidth) > 1) {
              setContentWidth(w);
            }
          }}
        >
          {items.map((item, idx) => renderItem(item, idx, 'a'))}
        </View>
        <View style={styles.marqueeRow}>
          {items.map((item, idx) => renderItem(item, idx, 'b'))}
        </View>
      </Animated.View>
    </View>
  );
};

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBankPill, setSelectedBankPill] = useState('');
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [comps, jbs] = await Promise.all([fetchCompanies(), fetchJobs()]);

      // Filter for Banking & Financial Services companies (matches website)
      const bankingComps = comps.filter(c =>
        c.categoryId === 'cat_banking' ||
        (c.name || '').toLowerCase().includes('bank') ||
        (c.name || '').toLowerCase().includes('finance') ||
        (c.name || '').toLowerCase().includes('capital') ||
        (c.name || '').toLowerCase().includes('tata') ||
        (c.name || '').toLowerCase().includes('hdfc')
      );

      const mappedComps = bankingComps.map(c => {
        const compJobs = getJobsForCompany(c, jbs);
        return {
          ...c,
          openPositionsCount: compJobs.length,
          bgColor: getCompanyColor(c.name),
        };
      }).sort((a, b) => {
        const pA = companyPriorityMap[a.name] !== undefined ? companyPriorityMap[a.name] : 99;
        const pB = companyPriorityMap[b.name] !== undefined ? companyPriorityMap[b.name] : 99;
        return pA - pB;
      });

      setCompanies(mappedComps);
      setJobs(jbs);
    } catch (err) {
      console.error('Error loading home screen data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeDrives = [
    { name: 'IDFC First Bank', count: '🔥 2 Openings' },
    { name: 'Bandhan Bank', count: '⚡ Urgent Hiring' },
    { name: 'Aditya Birla Capital', count: '✨ 3 Openings' },
    { name: 'Kotak Mahindra Bank', count: '🎯 Direct Placement' },
    { name: 'Axis Bank', count: '💼 Active Drive' }
  ];

  const itTracks = [
    { name: 'Python Developer', count: '3 Active Tracks' },
    { name: 'Software Engineer', count: '4 Active Tracks' },
    { name: 'Full Stack Developer', count: '2 Active Tracks' },
    { name: 'Data Analyst & AI', count: '3 Active Tracks' },
    { name: 'DevOps Cloud', count: '2 Active Tracks' },
  ];

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" translucent />

      {/* Top Portal Header Bar */}
      <View
        style={[
          styles.topHeaderBar,
          { paddingTop: Math.max(insets.top, StatusBar.currentHeight || 0, 36) + 8 },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandTitleFIC}>FIC </Text>
              <Text style={styles.brandTitleRecruit}>RecruitPro</Text>
            </View>
            <Text style={styles.brandSubtitle}>Candidate Portal</Text>
          </View>
        </View>
      </View>

      {/* Main Content Scroll Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />
        }
      >
        {/* White Space Line Divider */}
        <View style={styles.whiteDividerSpace} />

        {/* Active Drives Horizontal Auto-Scrolling Bar (Scrolls away with page) */}
        <View style={styles.activeDriveBar}>
          <RollingMarquee
            items={activeDrives}
            speed={40}
            renderItem={(drive, idx, prefix) => {
              const isSelected = selectedBankPill === drive.name;
              return (
                <TouchableOpacity
                  key={`${prefix}-${drive.name}-${idx}`}
                  style={[
                    styles.drivePill,
                    isSelected && styles.drivePillSelected,
                  ]}
                  onPress={() => {
                    setSelectedBankPill(drive.name);
                    navigation.navigate('Jobs', { companyName: drive.name });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bankIcon}>🏛️</Text>
                  <Text
                    style={[
                      styles.drivePillText,
                      isSelected && styles.drivePillTextSelected,
                    ]}
                  >
                    {drive.name}
                  </Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{drive.count}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        {/* Page Title & Subtitle */}
        <View style={styles.pageHeader}>
          <Text style={styles.mainHeading}>Banking & Financial Services</Text>
          <Text style={styles.mainHeading}>Companies</Text>
          <Text style={styles.subHeading}>
            Select a bank or hiring company below to view active job roles
          </Text>
        </View>

        {/* Company Cards List */}
        {loading ? (
          <View style={{ padding: 30, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0284C7" />
          </View>
        ) : (
          companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onPress={() => {
                navigation.navigate('Jobs', { companyId: company.id, companyName: company.name });
              }}
            />
          ))
        )}

        {/* FIC Training 100% placement or Refund Card */}
        <TouchableOpacity
          style={styles.placementGuaranteeCard}
          onPress={() => navigation.navigate('FicTrainingDetails')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgeCircleYellow}>
              <Image
                source={require('../../assets/images/logo.jpg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.placementCardTitle}>
                FIC Training 100% placement or Refund
              </Text>
              <View style={styles.guaranteeBadge}>
                <Text style={styles.guaranteeBadgeText}>🌞 Exclusive Program Guarantee</Text>
              </View>
            </View>
          </View>
          <Text style={styles.placementCardDesc}>
            Complete job guarantee upon successful training completion or get 100% of your training fees refunded. Click here to view participating banks and roles.
          </Text>
          <TouchableOpacity
            style={styles.placementActionBtn}
            onPress={() => navigation.navigate('FicTrainingDetails')}
          >
            <Text style={styles.placementActionBtnText}>View FIC Training Details ›</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* IT Tracks Horizontal Auto-Scrolling Bar */}
        <View style={styles.itTracksBar}>
          <RollingMarquee
            items={itTracks}
            speed={40}
            renderItem={(track, idx, prefix) => (
              <TouchableOpacity
                key={`${prefix}-${track.name}-${idx}`}
                style={styles.itTrackPill}
                onPress={() => navigation.navigate('ItTraining', { category: 'Placement' })}
                activeOpacity={0.7}
              >
                <Text style={styles.itTrackText}>💻 {track.name}</Text>
                <View style={styles.itTrackBadge}>
                  <Text style={styles.itTrackBadgeText}>{track.count}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Specialized Programs (Exact Website Details) */}

        {/* 1. FIC Free Internship */}
        <TouchableOpacity
          style={[styles.specialProgramCard, { backgroundColor: '#047857' }]}
          onPress={() => navigation.navigate('ItTraining', { category: 'Internship' })}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.whiteLogoCircle}>
              <Image
                source={require('../../assets/images/logo.jpg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.specialCardTitle}>FIC Free Internship</Text>
              <View style={styles.specialBadgeLight}>
                <Text style={styles.specialBadgeTextLight}>💼 Zero Cost • Real Experience</Text>
              </View>
            </View>
          </View>
          <Text style={styles.specialCardDesc}>
            Join our exclusive 100% Free Internship program. Work on live industry projects alongside experienced developers without paying any fees.
          </Text>
          <View style={styles.specialCardFooter}>
            <Text style={styles.specialFooterText}>🚀 View Internship Openings</Text>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevronArrow}>➔</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. FIC IT Courses */}
        <TouchableOpacity
          style={[styles.specialProgramCard, { backgroundColor: '#0284C7' }]}
          onPress={() => navigation.navigate('ItTraining', { category: 'Course' })}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.whiteLogoCircle}>
              <Image
                source={require('../../assets/images/logo.jpg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.specialCardTitle}>FIC IT Courses</Text>
              <View style={styles.specialBadgeLight}>
                <Text style={styles.specialBadgeTextLight}>📚 Learn from Industry Experts</Text>
              </View>
            </View>
          </View>
          <Text style={styles.specialCardDesc}>
            Enroll in our comprehensive IT training courses designed for beginners to advanced professionals. Build real-world projects and accelerate your career.
          </Text>
          <View style={styles.specialCardFooter}>
            <Text style={styles.specialFooterText}>📖 View Courses</Text>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevronArrow}>➔</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 3. FIC IT Training & 100% placement */}
        <TouchableOpacity
          style={[styles.specialProgramCard, { backgroundColor: '#6D28D9' }]}
          onPress={() => navigation.navigate('ItTraining', { category: 'Placement' })}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.whiteLogoCircle}>
              <Image
                source={require('../../assets/images/logo.jpg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.cardHeaderTextCol}>
              <Text style={styles.specialCardTitle}>FIC IT Training & 100% placement</Text>
              <View style={styles.specialBadgeLight}>
                <Text style={styles.specialBadgeTextLight}>💻 Exclusive IT Placement Programs</Text>
              </View>
            </View>
          </View>
          <Text style={styles.specialCardDesc}>
            Complete IT Job Training with 100% placement guarantee in top IT companies. View multiple training processes, monthly stipend, bond terms, and selection roadmap.
          </Text>
          <View style={styles.specialCardFooter}>
            <Text style={styles.specialFooterText}>🎯 Selection & Interview</Text>
            <View style={styles.chevronCircle}>
              <Text style={styles.chevronArrow}>➔</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  topHeaderBar: {
    backgroundColor: '#0A1128',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleFIC: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitleRecruit: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F59E0B',
  },
  brandSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginTop: 1,
  },
  whiteDividerSpace: {
    height: 8,
    backgroundColor: '#FFFFFF',
  },
  marqueeContainer: {
    overflow: 'hidden',
    width: '100%',
  },
  marqueeTrack: {
    flexDirection: 'row',
  },
  marqueeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDriveBar: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    overflow: 'hidden',
  },
  drivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 10,
  },
  drivePillSelected: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderColor: '#EC4899',
  },
  bankIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  drivePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  drivePillTextSelected: {
    color: '#F472B6',
  },
  activeBadge: {
    backgroundColor: '#831843',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F472B6',
  },
  mainContent: {
    paddingBottom: 40,
  },
  pageHeader: {
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 30,
  },
  subHeading: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 22,
  },
  placementGuaranteeCard: {
    backgroundColor: '#E11D48',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeCircleYellow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTextCol: {
    flex: 1,
  },
  placementCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  guaranteeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  guaranteeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  placementCardDesc: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  placementActionBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  placementActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  itTracksBar: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  itTrackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
  },
  itTrackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  itTrackBadge: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itTrackBadgeText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
  },
  specialProgramCard: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  whiteLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 3,
  },
  specialLogoIcon: {
    fontSize: 20,
  },
  specialCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  specialBadgeLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  specialBadgeTextLight: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  specialCardDesc: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 14,
  },
  specialCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
    paddingTop: 12,
    marginTop: 2,
  },
  specialFooterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
