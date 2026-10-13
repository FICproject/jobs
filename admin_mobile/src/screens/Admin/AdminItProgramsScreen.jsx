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
  ScrollView,
} from 'react-native';
import { theme } from '../../styles/theme';
import StatusBadge from '../../components/common/StatusBadge';
import ItTrainingModal from '../../components/modals/ItTrainingModal';
import itTrainingService from '../../services/itTrainingService';
import { IT_CATEGORIES } from '../../constants/config';

export default function AdminItProgramsScreen() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState('Placement');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [processToEdit, setProcessToEdit] = useState(null);

  const loadProcesses = useCallback(async () => {
    try {
      const data = await itTrainingService.getItProcesses();
      setProcesses(data);
    } catch (err) {
      console.error('Error loading IT processes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProcesses();
  };

  const filteredProcesses = useMemo(() => {
    return processes.filter(
      (p) => (p.itCategory || 'Placement').toLowerCase() === activeCategoryTab.toLowerCase()
    );
  }, [processes, activeCategoryTab]);

  const handleDelete = (item) => {
    Alert.alert(
      'Delete IT Program',
      `Are you sure you want to delete "${item.processName || item.programTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await itTrainingService.deleteItProcess(item.id);
              loadProcesses();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete IT program');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item: p }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.processBadge}>
              <Text style={styles.processBadgeText}>{p.processName || 'PROCESS'}</Text>
            </View>
            <Text style={styles.programTitle}>{p.programTitle || 'IT Placement Program'}</Text>
            <Text style={styles.roleText}>Role: {p.role || 'Software Trainee'}</Text>
          </View>
          <StatusBadge status={p.status} size="small" />
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>CTC / Salary</Text>
            <Text style={styles.infoVal}>{p.salary || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Stipend</Text>
            <Text style={styles.infoVal}>₹{p.stipend || '0'}/mo</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Training Fee</Text>
            <Text style={styles.infoVal}>{p.trainingFee || 'N/A'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoVal}>{p.location || 'PAN INDIA'}</Text>
          </View>
        </View>

        {p.trainingPhases && p.trainingPhases.length > 0 ? (
          <View style={styles.phasesBox}>
            <Text style={styles.phasesHeader}>Curriculum Phases ({p.trainingPhases.length}):</Text>
            {p.trainingPhases.map((phase, idx) => (
              <Text key={idx} style={styles.phaseItem}>
                • {phase.title}: {phase.duration} ({phase.mode || 'Classroom'})
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setProcessToEdit(p);
              setModalVisible(true);
            }}
          >
            <Text style={styles.editBtnText}>✏️ Edit Program</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(p)}
          >
            <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {IT_CATEGORIES.map((cat) => {
            const isActive = activeCategoryTab === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveCategoryTab(cat)}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            setProcessToEdit(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading IT programs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProcesses}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎓</Text>
              <Text style={styles.emptyTitle}>No {activeCategoryTab} programs found</Text>
              <Text style={styles.emptySub}>Tap "+ New" to create a curriculum or process.</Text>
            </View>
          }
        />
      )}

      <ItTrainingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        processToEdit={processToEdit}
        onSaveSuccess={() => {
          loadProcesses();
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
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  tabScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  createBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
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
  processBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  processBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  programTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
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
  phasesBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  phasesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  phaseItem: {
    fontSize: 11,
    color: '#1e3a8a',
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
