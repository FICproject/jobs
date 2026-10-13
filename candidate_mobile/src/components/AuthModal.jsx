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
import { loginCandidate, registerCandidate } from '../services/authService';

export const AuthModal = ({ visible, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginCandidate(email.toLowerCase(), password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        if (!name.trim()) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }
        const res = await registerCandidate({
          name,
          email: email.toLowerCase(),
          password,
          mobile,
          location,
          qualification,
          experience,
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setIsLogin(true);
    setEmail('rahul@example.com');
    setPassword('candidate123');
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isLogin ? 'Candidate Sign In' : 'Register Account'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Toggle switch */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={setName} />

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} placeholder="+91 9876543210" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />

                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} placeholder="Chennai" value={location} onChangeText={setLocation} />

                <Text style={styles.label}>Qualification</Text>
                <TextInput style={styles.input} placeholder="B.Com / Any Degree" value={qualification} onChangeText={setQualification} />

                <Text style={styles.label}>Experience</Text>
                <TextInput style={styles.input} placeholder="0-2 Years" value={experience} onChangeText={setExperience} />
              </>
            )}

            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="candidate@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.demoBtn} onPress={fillDemo}>
              <Text style={styles.demoBtnText}>⚡ Auto Fill Demo Candidate</Text>
            </TouchableOpacity>
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
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    backgroundColor: '#0F172A',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  errorText: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  demoBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
  },
  demoBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 13,
  },
});
