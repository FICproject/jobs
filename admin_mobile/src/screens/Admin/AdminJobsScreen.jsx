import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { theme } from '../../styles/theme';
import StatusBadge from '../../components/common/StatusBadge';
import JobFormModal from '../../components/modals/JobFormModal';
import jobService from '../../services/jobService';
import categoryService from '../../services/categoryService';
import companyService from '../../services/companyService';

export default function AdminJobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [jobsData, catsData, compsData] = await Promise.all([
        jobService.getJobs().catch(() => []),
        categoryService.getCategories().catch(() => []),
        companyService.getCompanies().catch(() => []),
      ]);

      setJobs(jobsData);
      setCategories(catsData);
      setCompanies(compsData);
    } catch (err) {
      console.error('Error loading jobs data:', err);
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

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.companyName && j.companyName.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.programName && j.programName.toLowerCase().includes(q))
      );
    });
  }, [jobs, searchTerm]);

  const handleDeleteJob = (job) => {
    Alert.alert(
      'Delete Job Opening',
      `Are you sure you want to delete "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobService.deleteJob(job.id);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete job');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item: job }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.companyName}>
              {job.companyName || 'Corporate Partner'} • {job.categoryName || 'Job Opening'}
            </Text>
            {job.programName ? (
              <Text style={styles.programName}>⭐ {job.programName}</Text>
            ) : null}
          </View>
          <StatusBadge status={job.status} size="small" />
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Salary / CTC</Text>
            <Text style={styles.infoVal}>{job.salary}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoVal}>{job.location}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Job Type</Text>
            <Text style={styles.infoVal}>{job.jobType || 'Full Time'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Openings</Text>
            <Text style={styles.infoVal}>{job.openings ?? 'N/A'}</Text>
          </View>
        </View>

        {job.trainingPeriod ? (
          <View style={styles.trainingBox}>
            <Text style={styles.trainingTitle}>Induction / Training:</Text>
            <Text style={styles.trainingText}>{job.trainingPeriod}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setJobToEdit(job);
              setJobModalVisible(true);
            }}
          >
            <Text style={styles.editBtnText}>✏️ Edit Job</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteJob(job)}
          >
            <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search job titles, locations..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            setJobToEdit(null);
            setJobModalVisible(true);
          }}
        >
          <Text style={styles.createBtnText}>+ New Job</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading job openings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💼</Text>
              <Text style={styles.emptyTitle}>No job openings found</Text>
              <Text style={styles.emptySub}>Tap "+ New Job" to create a new opening.</Text>
            </View>
          }
        />
      )}

      {/* Job Form Modal */}
      <JobFormModal
        visible={jobModalVisible}
        onClose={() => setJobModalVisible(false)}
        jobToEdit={jobToEdit}
        categories={categories}
        companies={companies}
        onSaveSuccess={() => {
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
  topBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
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
  createBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...theme.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  companyName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  programName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  infoCol: {
    width: '50%',
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  trainingBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  trainingTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  trainingText: {
    fontSize: 11,
    color: '#1e40af',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  deleteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
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
  },
});
