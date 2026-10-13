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
  Image,
  Linking,
} from 'react-native';
import { theme } from '../../styles/theme';
import StatusBadge from '../../components/common/StatusBadge';
import CompanyFormModal from '../../components/modals/CompanyFormModal';
import companyService from '../../services/companyService';
import categoryService from '../../services/categoryService';

export default function AdminCompaniesScreen() {
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [comps, cats] = await Promise.all([
        companyService.getCompanies().catch(() => []),
        categoryService.getCategories().catch(() => []),
      ]);
      setCompanies(comps);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading companies:', err);
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

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.categoryName && c.categoryName.toLowerCase().includes(q)) ||
        (c.website && c.website.toLowerCase().includes(q))
      );
    });
  }, [companies, searchTerm]);

  const handleDeleteCompany = (comp) => {
    Alert.alert(
      'Delete Hiring Company',
      `Are you sure you want to delete "${comp.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await companyService.deleteCompany(comp.id);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete company');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item: comp }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Image
            source={{
              uri:
                comp.logo ||
                'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=200&auto=format&fit=crop&q=80',
            }}
            style={styles.logo}
            resizeMode="cover"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.companyName}>{comp.name}</Text>
            <Text style={styles.categoryName}>
              {comp.categoryName || 'Partner Employer'}
            </Text>
            {comp.website ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(comp.website)}
                style={{ marginTop: 2 }}
              >
                <Text style={styles.websiteText} numberOfLines={1}>
                  🌐 {comp.website}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <StatusBadge status={comp.status} size="small" />
        </View>

        {comp.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {comp.description}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setCompanyToEdit(comp);
              setModalVisible(true);
            }}
          >
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteCompany(comp)}
          >
            <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            setCompanyToEdit(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.createBtnText}>+ Add Company</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏢</Text>
              <Text style={styles.emptyTitle}>No hiring companies found</Text>
              <Text style={styles.emptySub}>Tap "+ Add Company" to register a company.</Text>
            </View>
          }
        />
      )}

      <CompanyFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        companyToEdit={companyToEdit}
        categories={categories}
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
    alignItems: 'center',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  companyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  categoryName: {
    fontSize: 12,
    color: '#64748b',
  },
  websiteText: {
    fontSize: 11,
    color: '#2563eb',
  },
  description: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    lineHeight: 16,
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
