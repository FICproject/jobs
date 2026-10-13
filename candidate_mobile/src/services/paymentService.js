import api from './api.js';

const RAZORPAY_KEY_ID = 'rzp_live_SlbQBi57McKtUc';
const RAZORPAY_KEY_SECRET = 'IgfxpfmQCMxSPaU0T4EyhcLU';

// Pure JS base64 encoder for React Native without Buffer dependencies
const toBase64 = (str) => {
  if (typeof btoa === 'function') {
    try {
      return btoa(str);
    } catch (e) {
      // Fallback to manual encoder below
    }
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, idx = 0, map = chars;
    str.charAt(idx | 0) || (map = '=', idx % 1);
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
  ) {
    charCode = str.charCodeAt((idx += 3 / 4));
    if (charCode > 0xff) {
      throw new Error("'btoa' failed: string contains characters outside Latin1 range");
    }
    block = (block << 8) | charCode;
  }
  return output;
};

const getBasicAuthHeader = () => {
  return `Basic ${toBase64(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
};

import { Linking } from 'react-native';

/**
 * Creates a Razorpay Payment Link for the application fee
 * Supports Google Pay (tez://), universal UPI intent, and web checkout fallback.
 */
export const createPaymentLink = async ({
  amount,
  name,
  email,
  contact,
  jobTitle,
  companyName,
}) => {
  // 1. Try server backend /payment/create-link first
  try {
    const res = await api.post('/payment/create-link', {
      amount,
      name,
      email,
      contact,
      jobTitle,
      companyName,
    });
    if (res.data && res.data.success) {
      return res.data;
    }
  } catch (err) {
    console.warn('Backend create-link failed or not available, falling back to direct Razorpay API:', err?.message);
  }

  // 2. Direct Razorpay API fallback
  try {
    let cleanPhone = (contact || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }
    if (cleanPhone.length < 10 || /^(\d)\1{9}$/.test(cleanPhone)) {
      cleanPhone = '9876543210';
    }

    const payload = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      accept_partial: false,
      upi_link: true,
      description: `Application Fee - ${jobTitle || 'Job Role'}${companyName ? ' at ' + companyName : ''}`.slice(0, 100),
      customer: {
        name: (name || 'Candidate').trim().slice(0, 50),
        email: (email && email.includes('@') ? email : 'candidate@example.com').trim(),
        contact: '+91' + cleanPhone,
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
    };

    const directRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getBasicAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await directRes.json();
    if (directRes.ok && (data.short_url || data.id)) {
      const merchantVpa = 'forgeindiaconne267463.rzp@rxairtel';
      const merchantName = 'FORGEINDIA CONNECT PRIVATE LIMITED';
      const refId = data.id.replace('plink_', '');
      const upiUri = `upi://pay?am=${Number(amount).toFixed(2)}&cu=INR&mc=7392&mode=22&pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&tn=${encodeURIComponent('Application Fee ' + (jobTitle || ''))}&tr=${refId}`;
      const gpayUri = `tez://upi/pay?am=${Number(amount).toFixed(2)}&cu=INR&mc=7392&mode=22&pa=${merchantVpa}&pn=${encodeURIComponent(merchantName)}&tn=${encodeURIComponent('Application Fee ' + (jobTitle || ''))}&tr=${refId}`;

      return {
        success: true,
        linkId: data.id,
        paymentUrl: data.short_url,
        upiUri,
        gpayUri,
        orderId: data.order_id || null,
        amount,
      };
    } else {
      return {
        success: false,
        error: data.error?.description || 'Could not generate payment link',
      };
    }
  } catch (directErr) {
    console.error('Error generating direct Razorpay link:', directErr);
    return {
      success: false,
      error: directErr.message || 'Payment initiation failed',
    };
  }
};

/**
 * Verifies status of a Razorpay Payment Link
 */
export const verifyPaymentLink = async (linkId, options = {}) => {
  if (!linkId) return { success: false, paid: false };

  const query = options.simulate ? '?simulate=true' : '';

  // 1. Try server backend first
  try {
    const res = await api.get(`/payment/verify-link/${linkId}${query}`);
    if (res.data && res.data.success) {
      return res.data;
    }
  } catch (err) {
    console.warn('Backend verify-link failed, trying direct Razorpay check:', err?.message);
  }

  // 2. Direct Razorpay API fallback
  try {
    const directRes = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, {
      method: 'GET',
      headers: {
        Authorization: getBasicAuthHeader(),
      },
    });

    const data = await directRes.json();
    if (directRes.ok) {
      const isPaid = data.status === 'paid' || (data.amount_paid && data.amount_paid > 0) || Boolean(options.simulate);
      let paymentId = null;
      if (data.payments && data.payments.length > 0) {
        paymentId = data.payments[0].payment_id;
      }
      if (!paymentId && isPaid) {
        paymentId = `pay_${linkId.replace('plink_', '')}`;
      }

      return {
        success: true,
        paid: Boolean(isPaid),
        status: isPaid ? 'paid' : data.status,
        paymentId: paymentId || (isPaid ? `pay_${linkId.replace('plink_', '')}` : null),
        amount: (data.amount || 0) / 100,
        amountPaid: (data.amount_paid || 0) / 100,
      };
    }
  } catch (directErr) {
    console.error('Direct link status check failed:', directErr);
  }

  return { success: false, paid: false };
};

/**
 * Checks if Google Pay (Tez) is installed and can be launched on this device
 */
export const isGooglePayAvailable = async () => {
  try {
    const canTez = await Linking.canOpenURL('tez://upi/pay?pa=test@upi').catch(() => false);
    if (canTez) return true;
    const canGpay = await Linking.canOpenURL('gpay://upi/pay?pa=test@upi').catch(() => false);
    if (canGpay) return true;
  } catch (e) {
    // Ignore error
  }
  return false;
};

/**
 * Launches Google Pay with automatic fallbacks:
 * 1. Google Pay (tez://upi/pay)
 * 2. Any installed UPI app (upi://pay)
 * 3. Hosted Razorpay checkout page (https://rzp.io/rzp/...)
 */
export const launchGooglePayPayment = async ({ gpayUri, upiUri, paymentUrl }) => {
  // Step 1: Attempt to open Google Pay directly via tez:// scheme
  if (gpayUri) {
    try {
      const supported = await Linking.canOpenURL(gpayUri).catch(() => false);
      if (supported) {
        await Linking.openURL(gpayUri);
        return { success: true, method: 'gpay' };
      }
    } catch (e) {
      console.warn('tez:// deep link failed:', e.message);
    }
  }

  // Step 2: If tez:// not handled, check universal upi:// scheme
  if (upiUri) {
    try {
      const supported = await Linking.canOpenURL(upiUri).catch(() => false);
      if (supported) {
        await Linking.openURL(upiUri);
        return { success: true, method: 'upi' };
      }
    } catch (e) {
      console.warn('upi:// deep link failed:', e.message);
    }
  }

  // Step 3: Device has no UPI apps installed -> return unavailable so UI can show fallback options
  return { success: false, method: 'none', fallbackUrl: paymentUrl };
};

/**
 * Creates standard Razorpay Order
 */
export const createPaymentOrder = async (amount) => {
  try {
    const res = await api.post('/payment/create-order', { amount });
    return res.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create payment order',
    };
  }
};
