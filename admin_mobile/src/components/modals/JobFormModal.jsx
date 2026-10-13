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
import jobService from '../../services/jobService';

export default function JobFormModal({
  visible,
  onClose,
  jobToEdit,
  categories = [],
  companies = [],
  onSaveSuccess,
}) {
  const [categoryId, setCategoryId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [programName, setProgramName] = useState('');
  const [jobType, setJobType] = useState('Full Time');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [salary, setSalary] = useState('');
  const [salarySubtext, setSalarySubtext] = useState('');
  const [locationSubtext, setLocationSubtext] = useState('');

  // Training fields
  const [hasTraining, setHasTraining] = useState('Yes');
  const [trainingTitle, setTrainingTitle] = useState('');
  const [trainingSubtext, setTrainingSubtext] = useState('');
  const [stipendTitle, setStipendTitle] = useState('');
  const [stipendSubtext, setStipendSubtext] = useState('');
  const [trainingFee, setTrainingFee] = useState('');
  const [feeRefundType, setFeeRefundType] = useState('100% Refundable');
  const [feeRefundDetails, setFeeRefundDetails] = useState('');

  // Interview Crack Fee
  const [interviewCrackFee, setInterviewCrackFee] = useState('');
  const [interviewFeeStage, setInterviewFeeStage] = useState('After Clearing Interview');
  const [interviewFeeDetails, setInterviewFeeDetails] = useState('');

  // Dynamic Lists
  const [trainingPhases, setTrainingPhases] = useState([{ duration: '', mode: '', stipend: '' }]);
  const [openings, setOpenings] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState(['']);
  const [requirements, setRequirements] = useState(['']);
  const [skills, setSkills] = useState('');
  const [documentsRequired, setDocumentsRequired] = useState(['Resume']);
  const [interviewSteps, setInterviewSteps] = useState([{ stepNumber: 1, title: '', description: '' }]);
  const [lastDate, setLastDate] = useState('');
  const [status, setStatus] = useState('Active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (jobToEdit) {
        setCategoryId(jobToEdit.categoryId || (categories[0]?.id || ''));
        setCompanyId(jobToEdit.companyId || (companies[0]?.id || ''));
        setTitle(jobToEdit.title || '');
        setProgramName(jobToEdit.programName || '');
        setJobType(jobToEdit.jobType || 'Full Time');
        setLocation(jobToEdit.location || '');
        setExperience(jobToEdit.experience || '');
        setQualification(jobToEdit.qualification || '');
        setSalary(jobToEdit.salary || '');
        setSalarySubtext(jobToEdit.salarySubtext || '');
        setLocationSubtext(jobToEdit.locationSubtext || '');

        setHasTraining(jobToEdit.hasTraining !== undefined ? jobToEdit.hasTraining : 'Yes');
        setTrainingTitle(jobToEdit.trainingTitle || '');
        setTrainingSubtext(jobToEdit.trainingSubtext || '');
        setStipendTitle(jobToEdit.stipendTitle || '');
        setStipendSubtext(jobToEdit.stipendSubtext || '');
        setTrainingFee(jobToEdit.trainingFee || '');
        setFeeRefundType(jobToEdit.feeRefundType || '100% Refundable');
        setFeeRefundDetails(jobToEdit.feeRefundDetails || '');

        setInterviewCrackFee(jobToEdit.interviewCrackFee || '');
        setInterviewFeeStage(jobToEdit.interviewFeeStage || 'After Clearing Interview');
        setInterviewFeeDetails(jobToEdit.interviewFeeDetails || '');

        if (jobToEdit.trainingPhases && jobToEdit.trainingPhases.length > 0) {
          setTrainingPhases(jobToEdit.trainingPhases);
        } else {
          setTrainingPhases([{ duration: jobToEdit.trainingPeriod || '', mode: '', stipend: '' }]);
        }

        setOpenings(jobToEdit.openings ? String(jobToEdit.openings) : '');
        setDescription(jobToEdit.description || '');
        setResponsibilities(jobToEdit.responsibilities?.length ? jobToEdit.responsibilities : ['']);
        setRequirements(jobToEdit.requirements?.length ? jobToEdit.requirements : ['']);
        setSkills(jobToEdit.skills ? jobToEdit.skills.join(', ') : '');
        setDocumentsRequired(jobToEdit.documentsRequired?.length ? jobToEdit.documentsRequired : ['Resume']);
        setInterviewSteps(jobToEdit.interviewSteps?.length ? jobToEdit.interviewSteps : [{ stepNumber: 1, title: '', description: '' }]);
        setLastDate(jobToEdit.lastDate || '');
        setStatus(jobToEdit.status || 'Active');
      } else {
        setCategoryId(categories[0]?.id || '');
        setCompanyId(companies[0]?.id || '');
        setTitle('');
        setProgramName('');
        setJobType('Full Time');
        setLocation('');
        setExperience('');
        setQualification('');
        setSalary('');
        setSalarySubtext('');
        setLocationSubtext('');
        setHasTraining('Yes');
        setTrainingTitle('');
        setTrainingSubtext('');
        setStipendTitle('');
        setStipendSubtext('');
        setTrainingFee('');
        setFeeRefundType('100% Refundable');
        setFeeRefundDetails('');
        setInterviewCrackFee('');
        setInterviewFeeStage('After Clearing Interview');
        setInterviewFeeDetails('');
        setTrainingPhases([{ duration: '', mode: '', stipend: '' }]);
        setOpenings('');
        setDescription('');
        setResponsibilities(['']);
        setRequirements(['']);
        setSkills('');
        setDocumentsRequired(['Resume']);
        setInterviewSteps([{ stepNumber: 1, title: '', description: '' }]);
        setLastDate('');
        setStatus('Active');
      }
      setError('');
    }
  }, [jobToEdit, categories, companies, visible]);

  // Phase Helpers
  const addPhase = () => setTrainingPhases([...trainingPhases, { duration: '', mode: '', stipend: '' }]);
  const updatePhase = (idx, field, val) => {
    const arr = [...trainingPhases];
    arr[idx][field] = val;
    setTrainingPhases(arr);
  };
  const removePhase = (idx) => setTrainingPhases(trainingPhases.filter((_, i) => i !== idx));

  // Dynamic Array Helpers
  const addResp = () => setResponsibilities([...responsibilities, '']);
  const updateResp = (idx, val) => {
    const arr = [...responsibilities];
    arr[idx] = val;
    setResponsibilities(arr);
  };
  const removeResp = (idx) => setResponsibilities(responsibilities.filter((_, i) => i !== idx));

  const addReq = () => setRequirements([...requirements, '']);
  const updateReq = (idx, val) => {
    const arr = [...requirements];
    arr[idx] = val;
    setRequirements(arr);
  };
  const removeReq = (idx) => setRequirements(requirements.filter((_, i) => i !== idx));

  const addDoc = () => setDocumentsRequired([...documentsRequired, '']);
  const updateDoc = (idx, val) => {
    const arr = [...documentsRequired];
    arr[idx] = val;
    setDocumentsRequired(arr);
  };
  const removeDoc = (idx) => setDocumentsRequired(documentsRequired.filter((_, i) => i !== idx));

  const addStep = () => setInterviewSteps([...interviewSteps, { stepNumber: interviewSteps.length + 1, title: '', description: '' }]);
  const updateStep = (idx, field, val) => {
    const arr = [...interviewSteps];
    arr[idx][field] = val;
    setInterviewSteps(arr);
  };
  const removeStep = (idx) => {
    const arr = interviewSteps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setInterviewSteps(arr);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !salary.trim() || !location.trim()) {
      setError('Job Title, Salary, and Location are required');
      return;
    }
    if (!companyId || !categoryId) {
      setError('Please choose a Company and Category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const validPhases = trainingPhases.filter(
        (p) => p.duration.trim() || p.mode.trim() || p.stipend.trim()
      );
      const formattedTrainingPeriod =
        hasTraining === 'Yes' && validPhases.length > 0
          ? validPhases.map((p, idx) => `${validPhases.length > 1 ? `Phase ${idx + 1}: ` : ''}${p.duration || ''}${p.mode ? ` (${p.mode})` : ''}${p.stipend ? ` - ${p.stipend}` : ''}`.trim()).join(' | ')
          : 'No Training Required (Direct Joining)';

      const payload = {
        companyId,
        categoryId,
        title,
        programName,
        jobType,
        location,
        experience,
        qualification,
        salary,
        salarySubtext,
        locationSubtext,
        trainingPeriod: formattedTrainingPeriod,
        trainingFee,
        feeRefundType,
        feeRefundDetails,
        trainingTitle,
        trainingSubtext,
        stipendTitle,
        stipendSubtext,
        interviewCrackFee,
        interviewFeeStage,
        interviewFeeDetails,
        trainingPhases: validPhases,
        hasTraining,
        openings: Number(openings) || 0,
        description,
        responsibilities: responsibilities.filter((r) => r.trim() !== ''),
        requirements: requirements.filter((r) => r.trim() !== ''),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        interviewSteps: interviewSteps.filter((s) => s.title.trim() !== ''),
        documentsRequired: documentsRequired.filter((d) => d.trim() !== ''),
        lastDate,
        status,
      };

      let res;
      if (jobToEdit && jobToEdit.id) {
        res = await jobService.updateJob(jobToEdit.id, payload);
      } else {
        res = await jobService.createJob(payload);
      }

      if (onSaveSuccess) onSaveSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save job opening');
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
              {jobToEdit ? 'Edit Job Opening' : 'Create Job Opening'}
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

            {/* Category Select */}
            <Text style={styles.label}>Select Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Company Select */}
            <Text style={[styles.label, { marginTop: 10 }]}>Select Hiring Company *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {companies.map((comp) => {
                const isSelected = companyId === comp.id;
                return (
                  <TouchableOpacity
                    key={comp.id}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setCompanyId(comp.id)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {comp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 10 }]}>Job Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Branch Relationship Officer"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Program / Badge Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Axis Bank Young Bankers"
              placeholderTextColor="#94a3b8"
              value={programName}
              onChangeText={setProgramName}
            />

            <View style={styles.row}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <Text style={styles.label}>Job Type</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Time"
                  placeholderTextColor="#94a3b8"
                  value={jobType}
                  onChangeText={setJobType}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Chennai, Tamil Nadu"
                  placeholderTextColor="#94a3b8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={[styles.row, { marginTop: 8 }]}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <Text style={styles.label}>Salary / CTC *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3.5 - 4.5 LPA"
                  placeholderTextColor="#94a3b8"
                  value={salary}
                  onChangeText={setSalary}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0 - 2 Years"
                  placeholderTextColor="#94a3b8"
                  value={experience}
                  onChangeText={setExperience}
                />
              </View>
            </View>

            <View style={[styles.row, { marginTop: 8 }]}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <Text style={styles.label}>Qualification</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Any Graduate / Post Graduate"
                  placeholderTextColor="#94a3b8"
                  value={qualification}
                  onChangeText={setQualification}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Total Openings</Text>
                <TextInput
                  style={styles.input}
                  placeholder="50"
                  placeholderTextColor="#94a3b8"
                  value={openings}
                  keyboardType="numeric"
                  onChangeText={setOpenings}
                />
              </View>
            </View>

            {/* Training Details */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionHeaderTitle}>Training & Induction Details</Text>
            </View>
            <View style={styles.row}>
              {['Yes', 'No'].map((ht) => (
                <TouchableOpacity
                  key={ht}
                  style={[styles.modePill, hasTraining === ht && styles.modePillSelected]}
                  onPress={() => setHasTraining(ht)}
                >
                  <Text style={[styles.modePillText, hasTraining === ht && styles.modePillTextSelected]}>
                    {ht === 'Yes' ? 'Has Training Period' : 'Direct Joining (No Training)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {hasTraining === 'Yes' && (
              <View style={{ marginTop: 10 }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Training Phases</Text>
                  <TouchableOpacity onPress={addPhase} style={styles.addMiniBtn}>
                    <Text style={styles.addMiniText}>+ Add Phase</Text>
                  </TouchableOpacity>
                </View>
                {trainingPhases.map((phase, idx) => (
                  <View key={idx} style={styles.cardItem}>
                    <View style={styles.itemTop}>
                      <Text style={styles.itemTitle}>Phase {idx + 1}</Text>
                      {trainingPhases.length > 1 && (
                        <TouchableOpacity onPress={() => removePhase(idx)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={[styles.input, { marginBottom: 6 }]}
                      placeholder="Duration (e.g. 3 Months)"
                      placeholderTextColor="#94a3b8"
                      value={phase.duration}
                      onChangeText={(v) => updatePhase(idx, 'duration', v)}
                    />
                    <View style={styles.row}>
                      <TextInput
                        style={[styles.input, styles.col, { marginRight: 6 }]}
                        placeholder="Mode (e.g. Classroom)"
                        placeholderTextColor="#94a3b8"
                        value={phase.mode}
                        onChangeText={(v) => updatePhase(idx, 'mode', v)}
                      />
                      <TextInput
                        style={[styles.input, styles.col]}
                        placeholder="Stipend (e.g. ₹12,000/mo)"
                        placeholderTextColor="#94a3b8"
                        value={phase.stipend}
                        onChangeText={(v) => updatePhase(idx, 'stipend', v)}
                      />
                    </View>
                  </View>
                ))}

                <View style={[styles.row, { marginTop: 8 }]}>
                  <View style={[styles.col, { marginRight: 8 }]}>
                    <Text style={styles.label}>Training Fee</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1.6 LPA"
                      placeholderTextColor="#94a3b8"
                      value={trainingFee}
                      onChangeText={setTrainingFee}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Refund Policy</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="100% Refundable"
                      placeholderTextColor="#94a3b8"
                      value={feeRefundType}
                      onChangeText={setFeeRefundType}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Description & Requirements */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionHeaderTitle}>Job Overview & Skills</Text>
            </View>

            <Text style={styles.label}>Job Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Detailed description of the role..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Required Skills (Comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="Banking, Sales, Communication, Customer Relationship"
              placeholderTextColor="#94a3b8"
              value={skills}
              onChangeText={setSkills}
            />

            {/* Responsibilities */}
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Key Responsibilities</Text>
              <TouchableOpacity onPress={addResp} style={styles.addMiniBtn}>
                <Text style={styles.addMiniText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {responsibilities.map((r, idx) => (
              <View key={idx} style={styles.listRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Responsibility item..."
                  placeholderTextColor="#94a3b8"
                  value={r}
                  onChangeText={(v) => updateResp(idx, v)}
                />
                {responsibilities.length > 1 && (
                  <TouchableOpacity onPress={() => removeResp(idx)} style={styles.listDeleteBtn}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Requirements */}
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Job Requirements</Text>
              <TouchableOpacity onPress={addReq} style={styles.addMiniBtn}>
                <Text style={styles.addMiniText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {requirements.map((req, idx) => (
              <View key={idx} style={styles.listRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Requirement item..."
                  placeholderTextColor="#94a3b8"
                  value={req}
                  onChangeText={(v) => updateReq(idx, v)}
                />
                {requirements.length > 1 && (
                  <TouchableOpacity onPress={() => removeReq(idx)} style={styles.listDeleteBtn}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Selection Steps */}
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Interview Rounds / Selection Steps</Text>
              <TouchableOpacity onPress={addStep} style={styles.addMiniBtn}>
                <Text style={styles.addMiniText}>+ Add Step</Text>
              </TouchableOpacity>
            </View>
            {interviewSteps.map((st, idx) => (
              <View key={idx} style={styles.cardItem}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>Round {st.stepNumber}</Text>
                  {interviewSteps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(idx)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  placeholder="Round Title (e.g. Branch Manager Round)"
                  placeholderTextColor="#94a3b8"
                  value={st.title}
                  onChangeText={(v) => updateStep(idx, 'title', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Round Description..."
                  placeholderTextColor="#94a3b8"
                  value={st.description}
                  onChangeText={(v) => updateStep(idx, 'description', v)}
                />
              </View>
            ))}

            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={[styles.col, { marginRight: 8 }]}>
                <Text style={styles.label}>Last Date to Apply</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-10-30"
                  placeholderTextColor="#94a3b8"
                  value={lastDate}
                  onChangeText={setLastDate}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.row}>
                  {['Active', 'Inactive'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.modePill, status === st && styles.modePillSelected]}
                      onPress={() => setStatus(st)}
                    >
                      <Text style={[styles.modePillText, status === st && styles.modePillTextSelected]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
                <Text style={styles.saveText}>Save Job</Text>
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
    padding: 14,
  },
  dialog: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '92%',
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
  hScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
  },
  pillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextSelected: {
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
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  sectionDivider: {
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
  },
  modePillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  modePillTextSelected: {
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  addMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
  },
  addMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  cardItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  removeText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  listDeleteBtn: {
    padding: 8,
    marginLeft: 4,
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
