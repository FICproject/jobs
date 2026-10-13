import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Share,
  Linking,
} from 'react-native';
import apiClient from '../../services/api';

export default function HrPartnersScreen({ currentUser }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const hrId = currentUser?.id || currentUser?.referralCode || 'HR-27394';

  const loadPartners = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/users/hr/${hrId}/agents`);
      setPartners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('Error fetching HR partners:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hrId]);

  useEffect(() => {
    loadPartners();
    const interval = setInterval(loadPartners, 30000);
    return () => clearInterval(interval);
  }, [loadPartners]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPartners();
  };

  const getPartnerReferralLink = (partner) => {
    return partner?.mobileReferralUrl || `https://jobs.forgeindiaconnect.in?m.ref=${partner.referralCode}`;
  };

  const handleCopyLink = (partner) => {
    const link = getPartnerReferralLink(partner);
    Share.share({
      message: `Join Forge India Connect via partner referral link: ${link}`,
    });
    setCopiedId(partner.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWhatsApp = (partner) => {
    const link = getPartnerReferralLink(partner);
    const text = `Hey! Check out these amazing job openings at Forge India Connect: ${link}`;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`).catch(() => {
      Share.share({ message: text });
    });
  };

  const handleCreatePartner = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Please enter partner name and email.');
      return;
    }
    setCreating(true);
    try {
      await apiClient.post(`/api/users/hr/${hrId}/agents`, formData);
      setModalVisible(false);
      setFormData({ name: '', email: '', mobile: '', password: '' });
      Alert.alert('Success', 'Partner added successfully!');
      loadPartners();
    } catch (err) {
      console.error('Error creating partner:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to create partner.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePartner = (partner) => {
    Alert.alert(
      'Remove Partner',
      `Delete partner ${partner.name}? Their referral link will stop tracking.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/users/hr/${hrId}/agents/${partner.id}`);
              Alert.alert('Success', 'Partner deleted successfully.');
              loadPartners();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete partner.');
            }
          },
        },
      ]
    );
  };

  // Metrics
  const totalClicks = useMemo(
    () => partners.reduce((sum, p) => sum + (p.linkClicks || 0), 0),
    [partners]
  );
  const totalApplied = useMemo(
    () => partners.reduce((sum, p) => sum + (p.candidatesApplied || 0), 0),
    [partners]
  );

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.referralCode && p.referralCode.toLowerCase().includes(q)) ||
        (p.mobile && p.mobile.includes(q))
      );
    });
  }, [partners, searchTerm]);

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Title & Add Button Row */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.screenTitle}>My Partners</Text>
          <Text style={styles.screenSub}>
            Create and manage sub-partners under your account. Sourced candidates will be tracked
            under your account.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Partner</Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6', backgroundColor: '#eff6ff' }]}>
          <Text style={styles.kpiVal}>{partners.length}</Text>
          <Text style={styles.kpiLabel}>Total Partners</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#6366f1', backgroundColor: '#eef2ff' }]}>
          <Text style={styles.kpiVal}>{totalClicks}</Text>
          <Text style={styles.kpiLabel}>Partner Clicks</Text>
        </View>

        <View style={[styles.kpiCard, { borderLeftColor: '#10b981', backgroundColor: '#ecfdf5' }]}>
          <Text style={styles.kpiVal}>{totalApplied}</Text>
          <Text style={styles.kpiLabel}>Candidates Sourced</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search partner by name, code or mobile..."
          placeholderTextColor="#94a3b8"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPartnerCard = ({ item: p }) => {
    const link = getPartnerReferralLink(p);
    const initial = p.name ? p.name.charAt(0).toUpperCase() : 'P';
    const isCopied = copiedId === p.id;

    return (
      <View style={styles.partnerCard}>
        <View style={styles.partnerTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.partnerName}>{p.name}</Text>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{p.referralCode}</Text>
              </View>
            </View>

            <Text style={styles.partnerEmail}>{p.email}</Text>
            {p.mobile ? <Text style={styles.partnerMobile}>📞 {p.mobile}</Text> : null}
          </View>
        </View>

        {/* Referral Link Box */}
        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1}>
            {link}
          </Text>
        </View>

        {/* Stats and Action Row */}
        <View style={styles.actionsRow}>
          <View style={styles.metricsBox}>
            <Text style={styles.metricItem}>👆 {p.linkClicks || 0} clicks</Text>
            <Text style={styles.metricDivider}>•</Text>
            <Text style={styles.metricItem}>👥 {p.candidatesApplied || 0} applied</Text>
          </View>

          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.copyBtn]}
              onPress={() => handleCopyLink(p)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>{isCopied ? '✓ Copied' : '📋 Copy'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallBtn, styles.whatsappBtn]}
              onPress={() => handleShareWhatsApp(p)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnText}>💬</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallBtn, styles.deleteBtn]}
              onPress={() => handleDeletePartner(p)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading Partners...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPartners}
          keyExtractor={(item, index) => String(item.id || item._id || index)}
          ListHeaderComponent={renderHeader}
          renderItem={renderPartnerCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🤝</Text>
              <Text style={styles.emptyTitle}>No partners added yet</Text>
              <Text style={styles.emptySub}>
                Tap "+ Add Partner" above to create sub-partners under your account!
              </Text>
            </View>
          }
        />
      )}

      {/* Add Partner Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Partner</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Partner Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Email Address *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. rahul@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                />
              </View>

              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={formData.mobile}
                  onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                />
              </View>

              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Initial Password</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Default: 123456"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCreatePartner}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Create Partner</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
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
  headerArea: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderLeftWidth: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  kpiVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 2,
  },
  clearSearch: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  partnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  partnerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  partnerEmail: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  partnerMobile: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  codeBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  codeText: {
    fontSize: 10.5,
    color: '#2563eb',
    fontWeight: '700',
  },
  linkRow: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  linkText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricItem: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  metricDivider: {
    color: '#cbd5e1',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBtn: {
    backgroundColor: '#10b981',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtnText: {
    fontSize: 11,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalPanel: {
    width: '94%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalGroup: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
