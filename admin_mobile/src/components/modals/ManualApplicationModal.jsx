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
  Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import applicationService from '../../services/applicationService';

export default function ManualApplicationModal({
  visible,
  onClose,
  onSaveSuccess,
  jobs = [],
  hrs = [],
}) {
  const [candidateName, setCandidateName] = useState('');
  const [candidateMobile, setCandidateMobile] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateLocation, setCandidateLocation] = useState('');
  const [candidateQualification, setCandidateQualification] = useState('');
  const [candidateExperience, setCandidateExperience] = useState('Fresher');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedHrCode, setSelectedHrCode] = useState('');
  const [notes, setNotes] = useState('');

  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
  const [hrDropdownOpen, setHrDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setCandidateName('');
      setCandidateMobile('');
      setCandidateEmail('');
      setCandidateLocation('');
      setCandidateQualification('');
      setCandidateExperience('Fresher');
      setSelectedJobId(jobs.length > 0 ? jobs[0].id : '');
      setSelectedHrCode('');
      setNotes('');
      setError('');
      setJobDropdownOpen(false);
      setHrDropdownOpen(false);
    }
  }, [visible, jobs]);

  const handleSubmit = async () => {
    if (!candidateName.trim() || !candidateMobile.trim() || !candidateEmail.trim()) {
      setError('Name, Mobile, and Email are required.');
      return;
    }
    if (!selectedJobId) {
      setError('Please select an active job.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        jobId: selectedJobId,
        referredBy: selectedHrCode || null,
        coverNotes: notes.trim(),
        paymentId: 'MANUAL_ADMIN',
        paymentAmount: 0,
        candidateDetails: {
          name: candidateName.trim(),
          mobile: candidateMobile.trim(),
          email: candidateEmail.trim().toLowerCase(),
          location: candidateLocation.trim(),
          qualification: candidateQualification.trim(),
          experience: candidateExperience,
        },
      };

      const result = await applicationService.createApplication(payload);
      Alert.alert('Success', 'Manual application created successfully!');
      if (onSaveSuccess) onSaveSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const selectedHr = hrs.find((h) => h.referralCode === selectedHrCode);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Add Application (Manual)</Text>
              <Text style={styles.headerSub}>Create candidate record and link to active job</Text>
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

            <Text style={styles.label}>Select Job *</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setJobDropdownOpen(!jobDropdownOpen)}
            >
              <Text style={styles.selectBtnText} numberOfLines={1}>
                {selectedJob
                  ? `${selectedJob.title} (${selectedJob.companyName || 'FIC'})`
                  : 'Select Job Position'}
              </Text>
              <Text style={styles.selectBtnChevron}>{jobDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {jobDropdownOpen && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }}>
                  {jobs.map((job) => (
                    <TouchableOpacity
                      key={job.id}
                      style={[
                        styles.dropdownItem,
                        job.id === selectedJobId && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedJobId(job.id);
                        setJobDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          job.id === selectedJobId && styles.dropdownItemTextActive,
                        ]}
                      >
                        {job.title} - {job.companyName || 'Corporate'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Candidate Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gunasekar Gunasekar"
              placeholderTextColor="#94a3b8"
              value={candidateName}
              onChangeText={setCandidateName}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#94a3b8"
              value={candidateMobile}
              onChangeText={setCandidateMobile}
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. candidate@example.com"
              placeholderTextColor="#94a3b8"
              value={candidateEmail}
              onChangeText={setCandidateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { marginTop: 12 }]}>City / Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Chennai"
                  placeholderTextColor="#94a3b8"
                  value={candidateLocation}
                  onChangeText={setCandidateLocation}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { marginTop: 12 }]}>DOB / Qualification</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2002-05-14 / B.E"
                  placeholderTextColor="#94a3b8"
                  value={candidateQualification}
                  onChangeText={setCandidateQualification}
                />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Experience Level</Text>
            <View style={styles.expRow}>
              {['Fresher', '1-2 Years', '3+ Years'].map((exp) => (
                <TouchableOpacity
                  key={exp}
                  style={[
                    styles.expChip,
                    candidateExperience === exp && styles.expChipActive,
                  ]}
                  onPress={() => setCandidateExperience(exp)}
                >
                  <Text
                    style={[
                      styles.expChipText,
                      candidateExperience === exp && styles.expChipTextActive,
                    ]}
                  >
                    {exp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>HR Reference</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setHrDropdownOpen(!hrDropdownOpen)}
            >
              <Text style={styles.selectBtnText} numberOfLines={1}>
                {selectedHr
                  ? `${selectedHr.name} (${selectedHr.referralCode})`
                  : 'Direct (No HR)'}
              </Text>
              <Text style={styles.selectBtnChevron}>{hrDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {hrDropdownOpen && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    !selectedHrCode && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedHrCode('');
                    setHrDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      !selectedHrCode && styles.dropdownItemTextActive,
                    ]}
                  >
                    Direct (No HR)
                  </Text>
                </TouchableOpacity>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 140 }}>
                  {hrs.map((hr) => (
                    <TouchableOpacity
                      key={hr.id || hr.referralCode}
                      style={[
                        styles.dropdownItem,
                        hr.referralCode === selectedHrCode && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setSelectedHrCode(hr.referralCode);
                        setHrDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          hr.referralCode === selectedHrCode && styles.dropdownItemTextActive,
                        ]}
                      >
                        {hr.name} ({hr.referralCode})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Internal Notes</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="e.g. Walk-in candidate interviewed at office"
              placeholderTextColor="#94a3b8"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={{ height: 20 }} />
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
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitText}>+ Add Application</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
    ...theme.shadows.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
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
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectBtnText: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  selectBtnChevron: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 6,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginTop: 4,
    ...theme.shadows.sm,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#2563eb',
  },
  expRow: {
    flexDirection: 'row',
    gap: 8,
  },
  expChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  expChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  expChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  expChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  cancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    minWidth: 140,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
