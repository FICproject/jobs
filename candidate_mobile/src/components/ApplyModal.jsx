import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { submitApplication } from '../services/applicationService';
import { getReferralCode } from '../services/referralService';

export const ApplyModal = ({ visible, onClose, job, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [email, setEmail] = useState('');
  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const expOptions = ['Fresher', '0 - 1 Year', '1 - 3 Years', '3+ Years'];

  const handleContinueToPayment = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      Alert.alert('Required Field', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!dob.trim()) {
      Alert.alert('Required Field', 'Please enter your date of birth.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required Field', 'Please enter your city.');
      return;
    }
    if (!experience.trim()) {
      Alert.alert('Required Field', 'Please select your experience.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required Field', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const refCode = await getReferralCode();
    const qualFormatted = dob ? (dob.startsWith('DOB:') ? dob : `DOB: ${dob}`) : 'Graduate';
    const payload = {
      jobId: job?.id,
      candidateName: fullName,
      candidateEmail: email.toLowerCase(),
      candidateMobile: mobileNumber,
      candidateLocation: city,
      candidateQualification: qualFormatted,
      candidateDob: dob,
      candidateExperience: experience,
      referredBy: refCode || null,
      candidateDetails: {
        name: fullName,
        email: email.toLowerCase(),
        mobile: mobileNumber,
        location: city,
        city,
        qualification: qualFormatted,
        dob,
        experience,
      },
      coverNotes: `Applied via Mobile App. Location: ${city}, Exp: ${experience}`,
    };

    const res = await submitApplication(job?.id, payload);
    setSubmitting(false);

    if (res.success) {
      onClose();
      if (onSuccess) {
        onSuccess(res.data?.applicationNumber || res.data?.id);
      }
    } else {
      Alert.alert('Application Status', res.error || 'Could not process application. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTextCol}>
              <Text style={styles.modalTitle}>
                Apply for {job?.title || 'Relationship Manager'}
              </Text>
              <Text style={styles.modalSub}>
                {job?.company || 'IDFC First Bank'} • {job?.location || 'PAN India'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Area */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            {/* Full Name Input Box */}
            <View style={[styles.fieldBox, styles.blueBox]}>
              <Text style={[styles.fieldLabel, { color: '#1E40AF' }]}>Full Name *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Mobile Number Input Box */}
            <View style={[styles.fieldBox, styles.greenBox]}>
              <Text style={[styles.fieldLabel, { color: '#065F46' }]}>Mobile Number *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
              />
            </View>

            {/* Date of Birth Input Box */}
            <View style={[styles.fieldBox, styles.yellowBox]}>
              <Text style={[styles.fieldLabel, { color: '#92400E' }]}>Date of Birth *</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor="#94A3B8"
                  value={dob}
                  onChangeText={setDob}
                />
                <Text style={styles.inputIcon}>📅</Text>
              </View>
            </View>

            {/* City Input Box */}
            <View style={[styles.fieldBox, styles.purpleBox]}>
              <Text style={[styles.fieldLabel, { color: '#5B21B6' }]}>City *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Chennai"
                placeholderTextColor="#94A3B8"
                value={city}
                onChangeText={setCity}
              />
            </View>

            {/* Experience Selector Box */}
            <View style={[styles.fieldBox, styles.pinkBox]}>
              <Text style={[styles.fieldLabel, { color: '#9D174D' }]}>Experience *</Text>
              <TouchableOpacity
                style={styles.dropdownToggle}
                onPress={() => setShowExpDropdown(!showExpDropdown)}
              >
                <Text style={[styles.dropdownValue, !experience && { color: '#94A3B8' }]}>
                  {experience || 'Select experience'}
                </Text>
                <Text style={styles.dropdownArrow}>{showExpDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showExpDropdown && (
                <View style={styles.dropdownMenu}>
                  {expOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setExperience(opt);
                        setShowExpDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Email Address Input Box */}
            <View style={[styles.fieldBox, styles.orangeBox]}>
              <Text style={[styles.fieldLabel, { color: '#9A3412' }]}>Email Address *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Modal Bottom Buttons */}
            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinueToPayment}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={styles.continueBtnText}>Continue to Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  formContent: {
    padding: 18,
  },
  fieldBox: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  blueBox: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  greenBox: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#10B981',
  },
  yellowBox: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#F59E0B',
  },
  purpleBox: {
    backgroundColor: '#F3E8FF',
    borderLeftColor: '#8B5CF6',
  },
  pinkBox: {
    backgroundColor: '#FCE7F3',
    borderLeftColor: '#EC4899',
  },
  orangeBox: {
    backgroundColor: '#FFEDD5',
    borderLeftColor: '#F97316',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  dropdownToggle: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#64748B',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#334155',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  continueBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#0F172A',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
});
