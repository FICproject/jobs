import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const REFERRAL_STORAGE_KEY = '@fic_hr_referral';

/**
 * Extract referral code (e.g. "HR-27394") from a URL string
 * Supports:
 * - https://jobs.forgeindiaconnect.in?m.ref=HR-27394
 * - https://jobs.forgeindiaconnect.in?ref=HR-27394
 * - forgejobs://referral?ref=HR-27394
 * - forgejobs://referral?m.ref=HR-27394
 * - forgejobs://jobs?ref=HR-27394
 */
export const extractReferralCode = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    // 1. Check for ?m.ref=... or &m.ref=...
    const mRefMatch = url.match(/[?&]m\.ref=([^&#]+)/i);
    if (mRefMatch && mRefMatch[1]) {
      return decodeURIComponent(mRefMatch[1].trim());
    }

    // 2. Check for ?ref=... or &ref=...
    const refMatch = url.match(/[?&]ref=([^&#]+)/i);
    if (refMatch && refMatch[1]) {
      return decodeURIComponent(refMatch[1].trim());
    }

    // 3. Check for referral code in path /(?:m\.ref|ref)/HR-XXXXX
    const pathMatch = url.match(/\/(?:m\.ref|ref)\/([^/?&#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1].trim());
    }

    // 4. Check for direct code HR-XXXXX or AG-XXXXX in URL
    const codeMatch = url.match(/((?:HR|AG)-\d+)/i);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1].toUpperCase().trim();
    }
  } catch (err) {
    console.warn('Error extracting referral code from URL:', err);
  }

  return null;
};

/**
 * Save HR referral code in persistent AsyncStorage
 */
export const saveReferralCode = async (referralCode) => {
  if (!referralCode || typeof referralCode !== 'string') return null;
  const cleanCode = referralCode.replace(/^m\.ref=/, '').replace(/^ref=/, '').trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, cleanCode);
    console.log(`[ReferralService] Preserved HR referral code: ${cleanCode}`);
    return cleanCode;
  } catch (err) {
    console.warn('Error saving HR referral code to AsyncStorage:', err);
    return null;
  }
};

/**
 * Get current HR referral code
 * 1. Checks local AsyncStorage
 * 2. If empty, asks backend if there was a recent click from this device/IP (deferred deep link)
 */
export const getReferralCode = async () => {
  try {
    const cached = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
    if (cached && cached.trim()) {
      return cached.trim();
    }

    // Attempt deferred deep link resolution via backend
    const resolved = await resolveDeferredReferral();
    if (resolved) {
      await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, resolved);
      return resolved;
    }
  } catch (err) {
    console.warn('Error getting HR referral code:', err);
  }

  return null;
};

/**
 * Clear preserved referral code after job application is submitted
 */
export const clearReferralCode = async () => {
  try {
    await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY);
    console.log('[ReferralService] Cleared HR referral code after application.');
  } catch (err) {
    console.warn('Error clearing HR referral code:', err);
  }
};

/**
 * Resolves deferred referral from backend by client IP/Device
 */
export const resolveDeferredReferral = async () => {
  try {
    const res = await api.get('/users/referral/resolve');
    if (res.data && res.data.success && res.data.referralCode) {
      const code = res.data.referralCode.trim();
      console.log(`[ReferralService] Resolved deferred referral from backend: ${code}`);
      return code;
    }
  } catch {
    // Silent fail if network error or no matching referral
  }
  return null;
};

/**
 * Handle incoming deep link or cold-start URL
 */
export const handleIncomingUrl = async (url) => {
  if (!url) return null;
  const code = extractReferralCode(url);
  if (code) {
    await saveReferralCode(code);
    return code;
  }
  return null;
};

/**
 * Called on application startup to ensure referral code is preserved
 */
export const syncReferralOnStartup = async (initialUrl) => {
  if (initialUrl) {
    const code = await handleIncomingUrl(initialUrl);
    if (code) return code;
  }

  // If already saved, return existing
  const existing = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
  if (existing) return existing;

  // Otherwise, query backend for deferred referral
  const resolved = await resolveDeferredReferral();
  if (resolved) {
    await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, resolved);
    return resolved;
  }

  return null;
};

export default {
  extractReferralCode,
  saveReferralCode,
  getReferralCode,
  clearReferralCode,
  resolveDeferredReferral,
  handleIncomingUrl,
  syncReferralOnStartup,
};
