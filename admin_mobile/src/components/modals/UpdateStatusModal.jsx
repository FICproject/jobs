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
import { APPLICATION_STATUSES } from '../../constants/config';

export default function UpdateStatusModal({
  visible,
  onClose,
  application,
  onUpdateStatus,
}) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (application) {
      setSelectedStatus(application.status || 'Applied');
      setAdminNotes(application.adminNotes || '');
      setError('');
    }
  }, [application, visible]);

  if (!application) return null;

  const handleSubmit = async () => {
    if (!selectedStatus) {
      setError('Please choose a status');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onUpdateStatus(application.id, selectedStatus, adminNotes);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Update Application Status</Text>
              <Text style={styles.candidateSub}>
                {application.candidateName} • {application.jobTitle}
              </Text>
            </View>
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

            <Text style={styles.label}>Application Status *</Text>
            <View style={styles.statusChipsGrid}>
              {APPLICATION_STATUSES.map((st) => {
                const isSelected = selectedStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, isSelected && styles.statusChipSelected]}
                    onPress={() => setSelectedStatus(st)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.statusChipText, isSelected && styles.statusChipTextSelected]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Admin / HR Notes</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={3}
              placeholder="Add feedback, screening notes or next steps..."
              placeholderTextColor="#94a3b8"
              value={adminNotes}
              onChangeText={setAdminNotes}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveText}>Save Status</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '85%',
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
  candidateSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  statusChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusChipSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  statusChipTextSelected: {
    color: '#ffffff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 70,
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
    minWidth: 100,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
