import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/JobCard';
import { fetchJobs, fetchCompanies } from '../../services/jobService';
import { ApplyModal } from '../../components/ApplyModal';

const getCompanyColor = (name) => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('idfc')) return '#991B1B';
  if (lowerName.includes('bandhan')) return '#0284C7';
  if (lowerName.includes('hdfc')) return '#1D4ED8';
  if (lowerName.includes('aditya birla')) return '#B91C1C';
  if (lowerName.includes('kotak')) return '#003366';
  if (lowerName.includes('mahindra finance')) return '#E11D48';
  if (lowerName.includes('axis')) return '#831843';
  if (lowerName.includes('tata')) return '#1E3A8A';
  if (lowerName.includes('yes bank')) return '#0284C7';
  return '#003366';
};

export const JobsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { companyId, companyName, search } = route.params || {};

  const [jobsList, setJobsList] = useState([]);
  const [targetCompany, setTargetCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadJobsData = async () => {
      setLoading(true);
      try {
        const [allJobs, allCompanies] = await Promise.all([
          fetchJobs({ companyId, search }),
          fetchCompanies()
        ]);
        
        let comp = null;
        if (companyId) {
          comp = allCompanies.find(c => c.id === companyId);
        }
        if (!comp && companyName) {
          comp = allCompanies.find(c => c.name.toLowerCase().includes(companyName.toLowerCase().split(' ')[0]));
        }

        const matchTarget = comp ? comp.name : (companyName || '');
        const targetLower = matchTarget.toLowerCase();
        const firstWord = targetLower.split(' ')[0];

        let filteredJobs = allJobs.filter(j => {
          if (comp && j.companyId === comp.id) return true;
          const jComp = (j.companyName || '').toLowerCase();
          if (targetLower.includes('mahindra finance') && jComp.includes('mahindra finance')) return true;
          if (targetLower.includes('aditya') && jComp.includes('aditya')) return true;
          if (targetLower.includes('kotak') && jComp.includes('kotak')) return true;
          if (targetLower.includes('idfc') && jComp.includes('idfc')) return true;
          if (targetLower.includes('axis') && jComp.includes('axis')) return true;
          if (targetLower.includes('bandhan') && jComp.includes('bandhan')) return true;
          if (targetLower.includes('yes') && jComp.includes('yes')) return true;
          if (targetLower.includes('hdfc') && jComp.includes('hdfc')) return true;
          if (targetLower.includes('tata') && jComp.includes('tata')) return true;
          return jComp === targetLower || (firstWord && jComp.includes(firstWord));
        });

        if (comp) {
          comp = { ...comp, bgColor: comp.bgColor || getCompanyColor(comp.name) };
        }

        if (isMounted) {
          setJobsList(filteredJobs);
          setTargetCompany(comp);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadJobsData();
    return () => { isMounted = false; };
  }, [companyId, companyName, search]);

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={{ marginTop: 10, color: '#64748B' }}>Loading openings...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainContent}>
          {/* Page Heading matching Image 2 */}
          <View style={styles.pageHeader}>
            <Text style={styles.mainHeading}>
              {targetCompany ? `Openings at ${targetCompany.name}` : (companyName ? `Openings for ${companyName}` : 'All Job Openings')}
            </Text>
            <Text style={styles.subHeading}>
              Showing {jobsList.length} available openings
            </Text>
          </View>

          {jobsList.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '600' }}>No jobs available at the moment.</Text>
            </View>
          ) : (
            jobsList.map((job) => {
              const compName = job.companyName || (targetCompany ? targetCompany.name : '');
              const compColor = targetCompany?.bgColor || getCompanyColor(compName);
              return (
                <JobCard
                  key={job.id}
                  job={{
                    ...job,
                    company: compName || 'FIC Partner',
                  }}
                  companyColor={compColor}
                  onViewDetails={() => navigation.navigate('JobDetails', { jobId: job.id })}
                  onApplyNow={() => {
                    console.log('JobsScreen: onApplyNow called for job:', job.title);
                    navigation.navigate('Apply', { job: { ...job, company: compName || 'FIC Partner' } });
                  }}
                />
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Interactive Application Modal Popup (Matching Image 2) */}
      <ApplyModal
        visible={applyModalVisible}
        onClose={() => setApplyModalVisible(false)}
        job={selectedJobForModal}
        onSuccess={(applicationId) => {
          navigation.navigate('ApplicationSuccess', {
            jobTitle: selectedJobForModal?.title || 'Banking Role',
            company: selectedJobForModal?.company || targetCompany?.name || companyName || 'FIC Partner',
            applicationId: applicationId || 'FIC-884920',
          });
        }}
      />
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
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: {
    paddingRight: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandTitleRecruit: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
  },
  brandSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  mainContent: {
    paddingTop: 18,
  },
  pageHeader: {
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
