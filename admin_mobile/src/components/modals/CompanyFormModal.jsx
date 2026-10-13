import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { theme } from '../../styles/theme';
import companyService from '../../services/companyService';

export default function CompanyFormModal({
  visible,
  onClose,
  companyToEdit,
  categories = [],
  onSaveSuccess,
}) {
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (companyToEdit) {
        setCategoryId(companyToEdit.categoryId || (categories[0]?.id || ''));
        setName(companyToEdit.name || '');
        setLogo(companyToEdit.logo || '');
        setDescription(companyToEdit.description || '');
        setWebsite(companyToEdit.website || '');
        setStatus(companyToEdit.status || 'Active');
      } else {
        setCategoryId(categories[0]?.id || '');
        setName('');
        setLogo('https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=200&auto=format&fit=crop&q=80');
        setDescription('');
        setWebsite('');
        setStatus('Active');
      }
      setError('');
    }
  }, [companyToEdit, categories, visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Company Name is required');
      return;
    }
    if (!categoryId) {
      setError('Please select a Category');
      return;
    }
    setLoading(true);
    setError('');

    try {
      let saved;
      const payload = {
        categoryId,
        name,
        logo,
        description,
        website,
        status,
      };

      if (companyToEdit && companyToEdit.id) {
        saved = await companyService.updateCompany(companyToEdit.id, payload);
      } else {
        saved = await companyService.createCompany(payload);
      }

      if (onSaveSuccess) onSaveSuccess(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {companyToEdit ? 'Edit Hiring Company' : 'Add New Company'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, isSelected && styles.catChipSelected]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <Text style={[styles.catText, isSelected && styles.catTextSelected]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 12 }]}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Axis Bank, Infosys"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Company Logo URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#94a3b8"
              value={logo}
              onChangeText={setLogo}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="https://company.com"
              placeholderTextColor="#94a3b8"
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Company Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Brief overview of company..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Status</Text>
            <View style={styles.statusRow}>
              {['Active', 'Inactive'].map((st) => {
                const isSelected = status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOption, isSelected && styles.statusOptionSelected]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[styles.statusText, isSelected && styles.statusTextSelected]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>Save Company</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '88%',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  body: {
    padding: 16,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
  },
  catChipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catTextSelected: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  statusOptionSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  statusTextSelected: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    minWidth: 120,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
