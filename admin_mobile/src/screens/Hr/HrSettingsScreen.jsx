import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../services/api';

export default function HrSettingsScreen({ currentUser, onLogout }) {
  const userId = currentUser?.id || currentUser?._id;
  const referralCode = currentUser?.referralCode || 'HR-27394';
  const [mobileReferralUrl, setMobileReferralUrl] = useState(
    currentUser?.mobileReferralUrl || `https://jobs.forgeindiaconnect.in?m.ref=${referralCode}`
  );
  const [webReferralUrl, setWebReferralUrl] = useState(
    currentUser?.webReferralUrl || `https://jobs.forgeindiaconnect.in?ref=${referralCode}`
  );

  // Profile and Bank state matching website
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    accountHolderName: currentUser?.accountHolderName || '',
    bankName: currentUser?.bankName || '',
    bankAccountNumber: currentUser?.bankAccountNumber || '',
    bankIfscCode: currentUser?.bankIfscCode || '',
    bankBranch: currentUser?.bankBranch || '',
  });

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Fetch fresh profile on mount
  useEffect(() => {
    if (userId) {
      apiClient
        .get(`/api/users/hr/${referralCode}/dashboard`)
        .then((res) => {
          if (res.data) {
            if (res.data.mobileReferralUrl) setMobileReferralUrl(res.data.mobileReferralUrl);
            if (res.data.webReferralUrl) setWebReferralUrl(res.data.webReferralUrl);
            // Check if profile fields present in user
            setProfileData((prev) => ({
              ...prev,
              name: currentUser?.name || res.data.name || prev.name,
              accountHolderName: currentUser?.accountHolderName || res.data.accountHolderName || prev.accountHolderName,
              bankName: currentUser?.bankName || res.data.bankName || prev.bankName,
              bankAccountNumber: currentUser?.bankAccountNumber || res.data.bankAccountNumber || prev.bankAccountNumber,
              bankIfscCode: currentUser?.bankIfscCode || res.data.bankIfscCode || prev.bankIfscCode,
              bankBranch: currentUser?.bankBranch || res.data.bankBranch || prev.bankBranch,
            }));
          }
        })
        .catch(() => {});
    }
  }, [userId, referralCode, currentUser]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiClient.put(`/api/users/${userId}/profile`, profileData);
      setIsEditingBank(false);
      Alert.alert('Success', 'Profile and bank details saved successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to save profile details. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      Alert.alert('Validation Error', 'Please enter both current and new password.');
      return;
    }
    setUpdatingPassword(true);
    try {
      await apiClient.put(`/api/users/${userId}/password`, passwords);
      setPasswords({ oldPassword: '', newPassword: '' });
      Alert.alert('Success', 'Password updated successfully!');
    } catch (err) {
      console.error('Error updating password:', err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `Join Forge India Connect jobs portal via my referral link: ${mobileReferralUrl}`,
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the HR portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title matching website */}
        <View style={styles.headerBox}>
          <Text style={styles.headerIcon}>⚙️</Text>
          <View>
            <Text style={styles.headerTitle}>Profile Settings</Text>
            <Text style={styles.headerSub}>Manage your account, credentials & payout bank</Text>
          </View>
        </View>

        {/* 1. Account Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.name}
              onChangeText={(text) => setProfileData({ ...profileData, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={currentUser?.email || ''}
              editable={false}
              placeholder="Email address"
            />
            <Text style={styles.helperText}>* Login email cannot be changed.</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { alignSelf: 'flex-start', marginTop: 4 }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Name</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. Change Password Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwords.oldPassword}
              onChangeText={(text) => setPasswords({ ...passwords, oldPassword: text })}
              placeholder="Enter current password"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwords.newPassword}
              onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
              placeholder="Enter new password"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!passwords.oldPassword || !passwords.newPassword) && styles.btnDisabled,
            ]}
            onPress={handleUpdatePassword}
            disabled={updatingPassword || !passwords.oldPassword || !passwords.newPassword}
          >
            {updatingPassword ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. Bank Account Details Card (Required for incentive payouts) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bank Account Details</Text>
          <Text style={styles.cardSubtitle}>Required for direct incentive wallet payouts</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={[styles.input, !isEditingBank && styles.inputDisabled]}
              editable={isEditingBank}
              value={profileData.accountHolderName}
              onChangeText={(text) => setProfileData({ ...profileData, accountHolderName: text })}
              placeholder="Enter account holder name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={[styles.input, !isEditingBank && styles.inputDisabled]}
              editable={isEditingBank}
              value={profileData.bankName}
              onChangeText={(text) => setProfileData({ ...profileData, bankName: text })}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={[styles.input, !isEditingBank && styles.inputDisabled]}
              editable={isEditingBank}
              keyboardType="number-pad"
              value={profileData.bankAccountNumber}
              onChangeText={(text) => setProfileData({ ...profileData, bankAccountNumber: text })}
              placeholder="Enter account number"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={[styles.input, !isEditingBank && styles.inputDisabled]}
              editable={isEditingBank}
              autoCapitalize="characters"
              value={profileData.bankIfscCode}
              onChangeText={(text) => setProfileData({ ...profileData, bankIfscCode: text.toUpperCase() })}
              placeholder="e.g. HDFC0001234"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Branch Name</Text>
            <TextInput
              style={[styles.input, !isEditingBank && styles.inputDisabled]}
              editable={isEditingBank}
              value={profileData.bankBranch}
              onChangeText={(text) => setProfileData({ ...profileData, bankBranch: text })}
              placeholder="Enter branch name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            {isEditingBank ? (
              <>
                <TouchableOpacity
                  style={[styles.saveBtn, { flex: 1 }]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Details</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { flex: 1 }]}
                  onPress={() => setIsEditingBank(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditingBank(true)}
              >
                <Text style={styles.editBtnText}>✏️ Edit Bank Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 4. Referral Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sourcing Referral Credentials</Text>
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Referral Code:</Text>
            <Text style={styles.rowValBold}>{referralCode}</Text>
          </View>
          <View style={[styles.rowItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.rowLabel}>Mobile Referral Link (?m.ref=):</Text>
          </View>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2}>
              {mobileReferralUrl}
            </Text>
          </View>

          <View style={[styles.rowItem, { borderBottomWidth: 0, paddingBottom: 0, marginTop: 4 }]}>
            <Text style={styles.rowLabel}>Web Referral Link (?ref=):</Text>
          </View>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2}>
              {webReferralUrl}
            </Text>
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Text style={styles.actionBtnText}>📤 Share Mobile Link</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Support & System Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System & Support</Text>
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>App Version:</Text>
            <Text style={styles.rowVal}>1.0.0 (FIC Pro)</Text>
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Server Gateway:</Text>
            <Text style={styles.rowVal}>api.jobs.forgeindiaconnect.in</Text>
          </View>
          <View style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Portal Support:</Text>
            <Text style={styles.rowVal}>support@forgeindiaconnect.in</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪 Sign Out of HR Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingTop: 4,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginBottom: 14,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  inputDisabled: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    borderColor: '#e2e8f0',
  },
  helperText: {
    fontSize: 10.5,
    color: '#ef4444',
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  editBtnText: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  rowVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  linkBox: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'monospace',
  },
  actionBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
