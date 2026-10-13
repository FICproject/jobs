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
import { INTERVIEW_ROUNDS } from '../../constants/config';
import interviewService from '../../services/interviewService';

export default function ScheduleInterviewModal({
  visible,
  onClose,
  application,
  onScheduledSuccess,
}) {
  const [round, setRound] = useState('HR Screening');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('Online');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && application) {
      setRound('HR Screening');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setTime('11:00 AM');
      setMode('Online');
      setLocation('');
      setMeetingLink('');
      setInterviewer('');
      setNotes('');
      setError('');
    }
  }, [visible, application]);

  if (!application) return null;

  const handleSubmit = async () => {
    if (!date.trim() || !time.trim()) {
      setError('Date and Time are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        applicationId: application.id,
        candidateId: application.candidateId,
        jobId: application.jobId,
        companyId: application.companyId,
        round,
        date,
        time,
        mode,
        location: mode === 'Offline' ? location : '',
        meetingLink: mode === 'Online' ? meetingLink : '',
        interviewer,
        notes,
      };

      const result = await interviewService.scheduleInterview(payload);
      if (onScheduledSuccess) {
        onScheduledSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule interview');
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
              <Text style={styles.headerTitle}>Schedule Interview</Text>
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

            <Text style={styles.label}>Interview Round / Stage *</Text>
            <View style={styles.chipsWrap}>
              {INTERVIEW_ROUNDS.map((r) => {
                const isSelected = round === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setRound(r)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.row}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-10-15"
                  placeholderTextColor="#94a3b8"
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="11:00 AM"
                  placeholderTextColor="#94a3b8"
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Interview Mode</Text>
            <View style={styles.modeRow}>
              {['Online', 'Offline'].map((m) => {
                const isSelected = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeBtn, isSelected && styles.modeBtnSelected]}
                    onPress={() => setMode(m)}
                  >
                    <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                      {m === 'Online' ? '🌐 Online Video Call' : '🏢 Offline / In-Person'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mode === 'Online' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Google Meet / Zoom Link</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor="#94a3b8"
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>Interview Venue / Branch Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Branch Office, Mount Road, Chennai"
                  placeholderTextColor="#94a3b8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Interviewer Name / Panel</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Talent Acquisition Lead"
                placeholderTextColor="#94a3b8"
                value={interviewer}
                onChangeText={setInterviewer}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Internal Notes / Instructions</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                multiline
                numberOfLines={2}
                placeholder="Instructions for candidate or team..."
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
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
                <Text style={styles.saveText}>Schedule Round</Text>
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
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
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
    minHeight: 56,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modeBtnSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  modeTextSelected: {
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
