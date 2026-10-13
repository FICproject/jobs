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
import { IT_CATEGORIES } from '../../constants/config';
import itTrainingService from '../../services/itTrainingService';

export default function ItTrainingModal({
  visible,
  onClose,
  processToEdit,
  onSaveSuccess,
}) {
  const [formData, setFormData] = useState({
    processName: '',
    itCategory: 'Placement',
    programTitle: '',
    role: '',
    salary: '',
    location: '',
    trainingPeriod: '',
    trainingSubtext: '',
    stipend: '',
    stipendSubtext: '',
    trainingFee: '',
    feeSubtext: '',
    bondPeriod: '',
    originalsRequired: 'Originals Need to Submit',
    description: '',
    status: 'Active',
    order: 1,
  });

  const [trainingPhases, setTrainingPhases] = useState([
    { title: 'Phase 1 Training', duration: '3 Months', mode: 'Classroom Training', stipend: 'STIPEND ₹12,000' },
    { title: 'Phase 2 Training', duration: '3 Months', mode: 'Real Project Training (OJT)', stipend: 'STIPEND ₹12,000' },
  ]);

  const [selectionSteps, setSelectionSteps] = useState([
    { stepNumber: 1, title: 'Screening & Registration', description: 'Application review and initial profile shortlisting' },
    { stepNumber: 2, title: 'Technical Assessment', description: 'Basic coding, problem solving and aptitude round' },
    { stepNumber: 3, title: 'Technical & HR Interview', description: 'Discussion with hiring manager & interview clearance' },
    { stepNumber: 4, title: 'Batch Onboarding', description: 'Offer letter issuance, document submission, and training commencement' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (processToEdit) {
        setFormData({
          processName: processToEdit.processName || '',
          itCategory: processToEdit.itCategory || 'Placement',
          programTitle: processToEdit.programTitle || '',
          role: processToEdit.role || '',
          salary: processToEdit.salary || '',
          location: processToEdit.location || '',
          trainingPeriod: processToEdit.trainingPeriod || '',
          trainingSubtext: processToEdit.trainingSubtext || '',
          stipend: processToEdit.stipend || '',
          stipendSubtext: processToEdit.stipendSubtext || '',
          trainingFee: processToEdit.trainingFee || '',
          feeSubtext: processToEdit.feeSubtext || '',
          bondPeriod: processToEdit.bondPeriod || '',
          originalsRequired: processToEdit.originalsRequired || 'Originals Need to Submit',
          description: processToEdit.description || '',
          status: processToEdit.status || 'Active',
          order: processToEdit.order || 1,
        });

        if (processToEdit.trainingPhases && Array.isArray(processToEdit.trainingPhases) && processToEdit.trainingPhases.length > 0) {
          setTrainingPhases(processToEdit.trainingPhases);
        } else {
          setTrainingPhases([
            { title: 'Phase 1 Training', duration: '3 Months', mode: 'Classroom Training', stipend: 'STIPEND ₹12,000' },
            { title: 'Phase 2 Training', duration: '3 Months', mode: 'Real Project Training (OJT)', stipend: 'STIPEND ₹12,000' },
          ]);
        }

        if (processToEdit.selectionSteps && Array.isArray(processToEdit.selectionSteps) && processToEdit.selectionSteps.length > 0) {
          setSelectionSteps(processToEdit.selectionSteps);
        }
      } else {
        setFormData({
          processName: '',
          itCategory: 'Placement',
          programTitle: 'FIC IT Training & 100% Placement Programme',
          role: 'Software Engineer Trainee',
          salary: '4.0 LPA + Incentives',
          location: 'PAN INDIA / Chennai / Bangalore',
          trainingPeriod: '6 Months',
          trainingSubtext: '3 Months Classroom Training | 3 Months Project Training',
          stipend: '12,000',
          stipendSubtext: 'Stipend ₹12,000 per month during training',
          trainingFee: '1.6 LPA',
          feeSubtext: 'Training Program Cost',
          bondPeriod: '1 Year Bond',
          originalsRequired: 'Originals Need to Submit',
          description: '',
          status: 'Active',
          order: 1,
        });
        setTrainingPhases([
          { title: 'Phase 1 Training', duration: '3 Months', mode: 'Classroom Training', stipend: 'STIPEND ₹12,000' },
          { title: 'Phase 2 Training', duration: '3 Months', mode: 'Real Project Training (OJT)', stipend: 'STIPEND ₹12,000' },
        ]);
        setSelectionSteps([
          { stepNumber: 1, title: 'Screening & Registration', description: 'Application review and initial profile shortlisting' },
          { stepNumber: 2, title: 'Technical Assessment', description: 'Basic coding, problem solving and aptitude round' },
          { stepNumber: 3, title: 'Technical & HR Interview', description: 'Discussion with hiring manager & interview clearance' },
          { stepNumber: 4, title: 'Batch Onboarding', description: 'Offer letter issuance, document submission, and training commencement' },
        ]);
      }
      setError('');
    }
  }, [processToEdit, visible]);

  const updateField = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handlePhaseChange = (index, field, value) => {
    const updated = [...trainingPhases];
    updated[index][field] = value;
    setTrainingPhases(updated);
  };

  const addPhase = () => {
    setTrainingPhases((prev) => [
      ...prev,
      { title: `Phase ${prev.length + 1} Training`, duration: '3 Months', mode: 'Project Training (OJT)', stipend: `STIPEND ₹${formData.stipend || '12,000'}` },
    ]);
  };

  const removePhase = (index) => {
    setTrainingPhases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepChange = (index, field, value) => {
    const updated = [...selectionSteps];
    updated[index][field] = value;
    setSelectionSteps(updated);
  };

  const addStep = () => {
    setSelectionSteps((prev) => [
      ...prev,
      { stepNumber: prev.length + 1, title: '', description: '' },
    ]);
  };

  const removeStep = (index) => {
    const filtered = selectionSteps.filter((_, i) => i !== index);
    setSelectionSteps(filtered.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const handleSubmit = async () => {
    if (!formData.processName.trim()) {
      setError('Process Name is required (e.g. PROCESS 1)');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        trainingPhases,
        selectionSteps,
      };

      let res;
      if (processToEdit && processToEdit.id) {
        res = await itTrainingService.updateItProcess(processToEdit.id, payload);
      } else {
        res = await itTrainingService.createItProcess(payload);
      }

      if (onSaveSuccess) onSaveSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save IT process');
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
              {processToEdit ? 'Edit IT Program / Process' : 'Add IT Program / Process'}
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

            <Text style={styles.label}>Process Name * (e.g. PROCESS 1, JAVA FULLSTACK)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PROCESS 1"
              placeholderTextColor="#94a3b8"
              value={formData.processName}
              onChangeText={(v) => updateField('processName', v)}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>IT Category</Text>
            <View style={styles.categoryRow}>
              {IT_CATEGORIES.map((cat) => {
                const isSelected = formData.itCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, isSelected && styles.catBtnSelected]}
                    onPress={() => updateField('itCategory', cat)}
                  >
                    <Text style={[styles.catText, isSelected && styles.catTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Program Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Program Title..."
              placeholderTextColor="#94a3b8"
              value={formData.programTitle}
              onChangeText={(v) => updateField('programTitle', v)}
            />

            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.label}>Designation / Role</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Software Engineer Trainee"
                  placeholderTextColor="#94a3b8"
                  value={formData.role}
                  onChangeText={(v) => updateField('role', v)}
                />
              </View>
              <View style={[styles.col, { marginLeft: 8 }]}>
                <Text style={styles.label}>Salary / CTC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4.0 LPA + Incentives"
                  placeholderTextColor="#94a3b8"
                  value={formData.salary}
                  onChangeText={(v) => updateField('salary', v)}
                />
              </View>
            </View>

            <View style={[styles.twoCol, { marginTop: 8 }]}>
              <View style={styles.col}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PAN INDIA / Chennai"
                  placeholderTextColor="#94a3b8"
                  value={formData.location}
                  onChangeText={(v) => updateField('location', v)}
                />
              </View>
              <View style={[styles.col, { marginLeft: 8 }]}>
                <Text style={styles.label}>Training Period</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6 Months"
                  placeholderTextColor="#94a3b8"
                  value={formData.trainingPeriod}
                  onChangeText={(v) => updateField('trainingPeriod', v)}
                />
              </View>
            </View>

            <View style={[styles.twoCol, { marginTop: 8 }]}>
              <View style={styles.col}>
                <Text style={styles.label}>Stipend Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12,000"
                  placeholderTextColor="#94a3b8"
                  value={formData.stipend}
                  onChangeText={(v) => updateField('stipend', v)}
                />
              </View>
              <View style={[styles.col, { marginLeft: 8 }]}>
                <Text style={styles.label}>Training Fee</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1.6 LPA"
                  placeholderTextColor="#94a3b8"
                  value={formData.trainingFee}
                  onChangeText={(v) => updateField('trainingFee', v)}
                />
              </View>
            </View>

            <View style={[styles.twoCol, { marginTop: 8 }]}>
              <View style={styles.col}>
                <Text style={styles.label}>Bond Period</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1 Year Bond"
                  placeholderTextColor="#94a3b8"
                  value={formData.bondPeriod}
                  onChangeText={(v) => updateField('bondPeriod', v)}
                />
              </View>
              <View style={[styles.col, { marginLeft: 8 }]}>
                <Text style={styles.label}>Originals Required</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Originals Need to Submit"
                  placeholderTextColor="#94a3b8"
                  value={formData.originalsRequired}
                  onChangeText={(v) => updateField('originalsRequired', v)}
                />
              </View>
            </View>

            {/* Training Phases */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training Phases</Text>
              <TouchableOpacity onPress={addPhase} style={styles.addSectionBtn}>
                <Text style={styles.addSectionText}>+ Add Phase</Text>
              </TouchableOpacity>
            </View>
            {trainingPhases.map((phase, idx) => (
              <View key={idx} style={styles.phaseCard}>
                <View style={styles.phaseTop}>
                  <Text style={styles.phaseNumber}>Phase {idx + 1}</Text>
                  {trainingPhases.length > 1 && (
                    <TouchableOpacity onPress={() => removePhase(idx)}>
                      <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  placeholder="Phase Title"
                  placeholderTextColor="#94a3b8"
                  value={phase.title}
                  onChangeText={(v) => handlePhaseChange(idx, 'title', v)}
                />
                <View style={styles.twoCol}>
                  <TextInput
                    style={[styles.input, styles.col]}
                    placeholder="Duration (e.g. 3 Months)"
                    placeholderTextColor="#94a3b8"
                    value={phase.duration}
                    onChangeText={(v) => handlePhaseChange(idx, 'duration', v)}
                  />
                  <TextInput
                    style={[styles.input, styles.col, { marginLeft: 6 }]}
                    placeholder="Mode (e.g. Classroom)"
                    placeholderTextColor="#94a3b8"
                    value={phase.mode}
                    onChangeText={(v) => handlePhaseChange(idx, 'mode', v)}
                  />
                </View>
              </View>
            ))}

            {/* Selection Steps */}
            <View style={[styles.sectionHeader, { marginTop: 14 }]}>
              <Text style={styles.sectionTitle}>Selection Steps</Text>
              <TouchableOpacity onPress={addStep} style={styles.addSectionBtn}>
                <Text style={styles.addSectionText}>+ Add Step</Text>
              </TouchableOpacity>
            </View>
            {selectionSteps.map((step, idx) => (
              <View key={idx} style={styles.phaseCard}>
                <View style={styles.phaseTop}>
                  <Text style={styles.phaseNumber}>Step {step.stepNumber}</Text>
                  {selectionSteps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(idx)}>
                      <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  placeholder="Step Title (e.g. Technical Interview)"
                  placeholderTextColor="#94a3b8"
                  value={step.title}
                  onChangeText={(v) => handleStepChange(idx, 'title', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Step Description..."
                  placeholderTextColor="#94a3b8"
                  value={step.description}
                  onChangeText={(v) => handleStepChange(idx, 'description', v)}
                />
              </View>
            ))}

            <Text style={[styles.label, { marginTop: 14 }]}>Status</Text>
            <View style={styles.statusRow}>
              {['Active', 'Inactive'].map((st) => {
                const isSelected = formData.status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOption, isSelected && styles.statusOptionSelected]}
                    onPress={() => updateField('status', st)}
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
                <Text style={styles.saveText}>Save Program</Text>
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
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
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
    marginBottom: 5,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catBtnSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  catText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  catTextSelected: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  twoCol: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  addSectionBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addSectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  phaseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  phaseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phaseNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  deleteText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
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
