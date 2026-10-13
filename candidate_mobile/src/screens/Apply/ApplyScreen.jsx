import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitApplication } from '../../services/applicationService';
import { getReferralCode } from '../../services/referralService';
import {
  createPaymentLink,
  verifyPaymentLink,
  launchGooglePayPayment,
} from '../../services/paymentService';

export const ApplyScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { job } = route.params || {};

  // Form State - empty by default (no pre-fill, auto-fill, or fetched details)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('');
  const [experience, setExperience] = useState('');
  const [email, setEmail] = useState('');
  const [showExpDropdown, setShowExpDropdown] = useState(false);
  const [activeReferral, setActiveReferral] = useState(null);

  // Flow State ('form' | 'payment')
  const [step, setStep] = useState('form');
  const [submitting, setSubmitting] = useState(false);
  const [isPaymentOpened, setIsPaymentOpened] = useState(false);
  const [paymentLinkId, setPaymentLinkId] = useState(null);
  const [paymentUrls, setPaymentUrls] = useState({ paymentUrl: '', upiUri: '', gpayUri: '' });
  const [lastPaymentMethod, setLastPaymentMethod] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [createdPendingAppId, setCreatedPendingAppId] = useState(null);

  useEffect(() => {
    getReferralCode().then((code) => {
      if (code) setActiveReferral(code);
    });
  }, []);

  const expOptions = ['Fresher', '0 - 1 Year', '1 - 3 Years', '3+ Years'];

  // Fee calculation (matching website logic)
  const isInternship =
    (job?.title || '').toLowerCase().includes('free') ||
    (job?.title || '').toLowerCase().includes('internship') ||
    (job?.company || '').toLowerCase().includes('free') ||
    (job?.company || '').toLowerCase().includes('internship');

  const feeAmount = job?.isFicFlow && !isInternship ? 1499 : isInternship ? 0 : 49;

  // Step 1: Validate, save "Payment Pending" record to database, and move to payment step
  const handleProceedToPayment = async () => {
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
      Alert.alert('Required Field', 'Please select your experience level.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required Field', 'Please enter a valid email address.');
      return;
    }

    if (feeAmount === 0) {
      await handleCompleteApplication(`FREE_INTERNSHIP_${Date.now()}`);
      return;
    }

    // Immediately create application record in the database with status: "Payment Pending"
    setSubmitting(true);
    try {
      const qualFormatted = dob ? (dob.startsWith('DOB:') ? dob : `DOB: ${dob}`) : 'Graduate';
      const pendingPayload = {
        jobId: job?.id,
        fullName: fullName.trim(),
        phone: mobileNumber.trim(),
        dob: dob.trim(),
        city: city.trim(),
        experienceYears: experience.trim(),
        email: email.trim(),
        candidateName: fullName.trim(),
        candidateEmail: email.trim(),
        candidateMobile: mobileNumber.trim(),
        candidateLocation: city.trim(),
        candidateQualification: qualFormatted,
        candidateDob: dob.trim(),
        candidateExperience: experience.trim(),
        status: 'Payment Pending',
        paymentAmount: feeAmount,
        paymentId: null,
        referredBy: activeReferral || null,
        candidateDetails: {
          name: fullName.trim(),
          email: email.trim(),
          mobile: mobileNumber.trim(),
          location: city.trim(),
          city: city.trim(),
          qualification: qualFormatted,
          dob: dob.trim(),
          experience: experience.trim(),
        },
      };

      const res = await submitApplication(job?.id, pendingPayload);
      if (res.success && res.data) {
        setCreatedPendingAppId(res.data.id || res.data._id);
      }
    } catch (err) {
      console.warn('Error saving Payment Pending application:', err);
    } finally {
      setSubmitting(false);
      setStep('payment');
    }
  };

  // Ensure payment link is created or return existing
  const getOrCreatePaymentSession = async () => {
    if (paymentLinkId && paymentUrls.paymentUrl) {
      return {
        success: true,
        linkId: paymentLinkId,
        paymentUrl: paymentUrls.paymentUrl,
        upiUri: paymentUrls.upiUri,
        gpayUri: paymentUrls.gpayUri,
      };
    }

    const res = await createPaymentLink({
      amount: feeAmount,
      name: fullName || 'Candidate',
      email: email || 'candidate@example.com',
      contact: mobileNumber || '9876543210',
      jobTitle: job?.title || 'Banking Position',
      companyName: job?.company || 'FIC Partner',
    });

    if (res.success) {
      setPaymentLinkId(res.linkId);
      setPaymentUrls({
        paymentUrl: res.paymentUrl || '',
        upiUri: res.upiUri || '',
        gpayUri: res.gpayUri || '',
      });
    }

    return res;
  };

  // Launch Google Pay directly with fallback
  const handlePayViaGPay = async () => {
    setSubmitting(true);
    setPaymentError(null);

    try {
      const res = await getOrCreatePaymentSession();

      if (!res.success) {
        setSubmitting(false);
        const errMsg = res.error || 'Could not initiate payment session. Please try again.';
        setPaymentError(errMsg);
        Alert.alert('Payment Gateway Error', errMsg);
        return;
      }

      // Attempt to launch Google Pay (tez:// scheme or universal UPI)
      const launchRes = await launchGooglePayPayment({
        gpayUri: res.gpayUri,
        upiUri: res.upiUri,
        paymentUrl: res.paymentUrl,
      });

      setSubmitting(false);

      if (launchRes.success) {
        setIsPaymentOpened(true);
        setLastPaymentMethod(launchRes.method);
      } else {
        // GPay is not installed or available -> Show appropriate fallback payment option
        Alert.alert(
          'Google Pay Unavailable',
          'Google Pay (GPay) is not installed or available on this device.\n\nWould you like to pay using Web Checkout (Debit/Credit Cards, Net Banking, or other UPI apps)?',
          [
            {
              text: 'Pay via Web Checkout',
              onPress: async () => {
                if (res.paymentUrl) {
                  setIsPaymentOpened(true);
                  setLastPaymentMethod('web');
                  await Linking.openURL(res.paymentUrl);
                }
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      setSubmitting(false);
      const errMsg = err.message || 'Payment initiation failed.';
      setPaymentError(errMsg);
      Alert.alert('Error', errMsg);
    }
  };

  // Fallback to Razorpay Web Checkout (Cards, Net Banking, any UPI)
  const handlePayViaFallback = async () => {
    setSubmitting(true);
    setPaymentError(null);

    try {
      const res = await getOrCreatePaymentSession();
      setSubmitting(false);

      if (res.success && res.paymentUrl) {
        setIsPaymentOpened(true);
        setLastPaymentMethod('web');
        await Linking.openURL(res.paymentUrl);
      } else {
        Alert.alert('Error', res.error || 'Could not open web checkout.');
      }
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Error', err.message || 'Failed to open web checkout.');
    }
  };

  // Auto-verify when candidate returns to the app from Google Pay / UPI
  useEffect(() => {
    const handleAppStateChange = async (nextState) => {
      if (nextState === 'active' && isPaymentOpened && paymentLinkId) {
        try {
          const res = await verifyPaymentLink(paymentLinkId);
          if (res.paid) {
            handleCompleteApplication(res.paymentId || `pay_${paymentLinkId.replace('plink_', '')}`);
          }
        } catch (e) {
          console.log('Foreground payment check error:', e);
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
  }, [isPaymentOpened, paymentLinkId]);

  // Manual payment verification check
  const handleManualVerify = async () => {
    if (!paymentLinkId) {
      Alert.alert('Notice', 'Please initiate payment with Google Pay first.');
      return;
    }

    setSubmitting(true);
    try {
      const verifyRes = await verifyPaymentLink(paymentLinkId);
      if (verifyRes.paid) {
        await handleCompleteApplication(verifyRes.paymentId || `pay_${paymentLinkId.replace('plink_', '')}`);
      } else {
        setSubmitting(false);
        Alert.alert(
          'Payment Not Confirmed Yet',
          `We have not received payment confirmation for ₹${feeAmount} from the bank yet.\n\nIf money was debited from Google Pay, please wait a few seconds and tap "Check Again".`,
          [
            { text: 'Reopen GPay', onPress: handlePayViaGPay },
            { text: 'Check Again', onPress: handleManualVerify },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Verification Error', e.message || 'Could not verify payment status.');
    }
  };

  // Complete application submission to backend
  const handleCompleteApplication = async (confirmedPaymentId = null) => {
    setSubmitting(true);
    let finalPaymentId = confirmedPaymentId;

    if (!finalPaymentId && paymentLinkId) {
      try {
        const verifyRes = await verifyPaymentLink(paymentLinkId);
        if (verifyRes.paid) {
          finalPaymentId = verifyRes.paymentId || `pay_${paymentLinkId.replace('plink_', '')}`;
        }
      } catch (err) {
        console.warn('Could not check status automatically:', err);
      }
    }

    if (!finalPaymentId && feeAmount > 0) {
      setSubmitting(false);
      Alert.alert(
        'Payment Required',
        `Please complete the payment of ₹${feeAmount} before submitting the application.`
      );
      return;
    }

    if (!finalPaymentId && feeAmount === 0) {
      finalPaymentId = `FREE_INTERNSHIP_${Date.now()}`;
    }

    const qualFormatted = dob ? (dob.startsWith('DOB:') ? dob : `DOB: ${dob}`) : 'Graduate';
    const payload = {
      jobId: job?.id,
      fullName,
      phone: mobileNumber,
      dob,
      city,
      experienceYears: experience,
      email,
      candidateName: fullName,
      candidateEmail: email,
      candidateMobile: mobileNumber,
      candidateLocation: city,
      candidateQualification: qualFormatted,
      candidateDob: dob,
      status: 'Applied',
      paymentId: finalPaymentId,
      paymentAmount: feeAmount,
      referredBy: activeReferral || (await getReferralCode()) || null,
      candidateDetails: {
        userId: initialUser?.id || initialUser?.userId || 'usr_candidate',
        name: fullName,
        email,
        mobile: mobileNumber,
        location: city,
        city,
        qualification: qualFormatted,
        dob,
        experience,
      },
    };

    const res = await submitApplication(job?.id, payload);
    setSubmitting(false);

    if (res.success) {
      navigation.replace('ApplicationSuccess', {
        jobTitle: job?.title || 'Banking Role',
        company: job?.company || 'FIC Partner',
        applicationId:
          res.data?.applicationNumber ||
          res.data?.applicationId ||
          'FIC-' + Math.floor(100000 + Math.random() * 900000),
        paymentId: finalPaymentId,
        paymentAmount: feeAmount,
      });
    } else {
      Alert.alert('Submission Error', res.error || 'Could not save application. Please try again.');
    }
  };

  // Submit Free Application
  const handleFreeSubmit = async () => {
    await handleCompleteApplication(`FREE_INTERNSHIP_${Date.now()}`);
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1128" translucent />

      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTextCol}>
              <Text style={styles.modalTitle}>
                {step === 'payment'
                  ? 'Application Fee Payment'
                  : `Apply for ${job?.title || 'Job Role'}`}
              </Text>
              <Text style={styles.modalSub}>
                {job?.company || 'FIC Partner'} • {job?.location || 'PAN India'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form Step */}
          {step === 'form' ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContent}
            >

              {/* HR Referral Badge if active */}
              {activeReferral ? (
                <View style={styles.referralActiveBadge}>
                  <Text style={styles.referralActiveIcon}>🤝</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.referralActiveTitle}>HR Referral Applied</Text>
                    <Text style={styles.referralActiveCode}>Tracking Code: {activeReferral}</Text>
                  </View>
                </View>
              ) : null}

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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={handleProceedToPayment}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueBtnText}>
                    {feeAmount > 0 ? 'Continue to Payment' : 'Submit Application'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Payment Step */
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.paymentContent}
            >
              {/* Fee Summary Bill Card */}
              <View style={styles.billCard}>
                <Text style={styles.billTitle}>Fee Summary</Text>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Candidate</Text>
                  <Text style={styles.billVal} numberOfLines={1}>
                    {fullName}
                  </Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Position</Text>
                  <Text style={styles.billVal} numberOfLines={1}>
                    {job?.title || 'Job Role'}
                  </Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Hiring Partner</Text>
                  <Text style={styles.billVal} numberOfLines={1}>
                    {job?.company || 'FIC'}
                  </Text>
                </View>

                <View style={styles.billDivider} />

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Application Fee</Text>
                  <Text style={styles.billVal}>₹{feeAmount}</Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Processing & GST</Text>
                  <Text style={[styles.billVal, { color: '#16A34A' }]}>Included (₹0)</Text>
                </View>

                <View style={styles.billDivider} />

                <View style={[styles.billRow, { marginTop: 4 }]}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalVal}>₹{feeAmount}</Text>
                </View>
              </View>

              {/* Security & Razorpay Trust Badge */}
              <View style={styles.trustBadge}>
                <View style={styles.trustHeader}>
                  <Text style={styles.shieldIcon}>🔒</Text>
                  <Text style={styles.trustTitle}>100% Secured by Razorpay & UPI</Text>
                </View>
                <Text style={styles.trustSub}>
                  Direct Google Pay (GPay), UPI Intent, Cards & Net Banking supported.
                </Text>
              </View>

              {/* Payment Opened Notice */}
              {isPaymentOpened && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    {lastPaymentMethod === 'gpay'
                      ? `⚡ Google Pay launched! Complete the ₹${feeAmount} payment in GPay, then tap "Verify Payment & Complete Application" below.`
                      : `⚡ Checkout session opened. Complete the ₹${feeAmount} payment, then tap "Verify Payment & Complete Application" below.`}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.paymentActionsCol}>
                {feeAmount > 0 ? (
                  <>
                    {!isPaymentOpened ? (
                      <>
                        {/* Primary: Pay with Google Pay (GPay) */}
                        <TouchableOpacity
                          style={styles.payGpayBtn}
                          onPress={handlePayViaGPay}
                          disabled={submitting}
                          activeOpacity={0.8}
                        >
                          {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <View style={styles.gpayBtnInner}>
                              <View style={styles.gpayBadge}>
                                <Text style={styles.gpayBadgeText}>GPay</Text>
                              </View>
                              <Text style={styles.payGpayBtnText}>
                                Pay ₹{feeAmount} with Google Pay
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        {/* Fallback Option: Web Checkout / Other UPI */}
                        <TouchableOpacity
                          style={styles.payFallbackBtn}
                          onPress={handlePayViaFallback}
                          disabled={submitting}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.payFallbackBtnText}>
                            💳 Other Options (Cards, Net Banking, UPI)
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {/* Verify Payment Button */}
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={handleManualVerify}
                          disabled={submitting}
                          activeOpacity={0.8}
                        >
                          {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.verifyBtnText}>
                              ✓ Verify Payment & Complete Application
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Reopen Google Pay */}
                        <TouchableOpacity
                          style={styles.reopenGpayBtn}
                          onPress={handlePayViaGPay}
                          disabled={submitting}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.reopenGpayBtnText}>↺ Reopen Google Pay</Text>
                        </TouchableOpacity>

                        {/* Secondary Fallback to Web Checkout */}
                        <TouchableOpacity
                          style={styles.payFallbackBtn}
                          onPress={handlePayViaFallback}
                          disabled={submitting}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.payFallbackBtnText}>
                            💳 Pay via Web Checkout (Cards / Net Banking)
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.payGpayBtn}
                    onPress={handleFreeSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.payGpayBtnText}>Submit Free Application</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.backToFormBtn}
                  onPress={() => {
                    setIsPaymentOpened(false);
                    setStep('form');
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.backToFormBtnText}>← Edit Application Details</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
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
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    backgroundColor: '#0A1128',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    elevation: 2,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  paymentContent: {
    padding: 20,
  },
  billCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  billVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '60%',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563EB',
  },
  trustBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shieldIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  trustSub: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 17,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  paymentActionsCol: {
    gap: 12,
    marginTop: 6,
  },
  payGpayBtn: {
    backgroundColor: '#1A73E8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gpayBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpayBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 10,
  },
  gpayBadgeText: {
    color: '#1A73E8',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  payGpayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  payFallbackBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  payFallbackBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  reopenGpayBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reopenGpayBtnText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '800',
  },
  verifyBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 3,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  backToFormBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backToFormBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  referralActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  referralActiveIcon: {
    fontSize: 18,
  },
  referralActiveTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  referralActiveCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 1,
  },
});
