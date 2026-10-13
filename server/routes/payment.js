const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SlbQBi57McKtUc',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'IgfxpfmQCMxSPaU0T4EyhcLU',
  });
};

// 1. Create Razorpay Order (used by website checkout modal)
router.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const razorpay = getRazorpayInstance();

    const options = {
      amount: Math.round(Number(amount) * 100), // amount in paise
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order, key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_SlbQBi57McKtUc' });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment order' });
  }
});

// 2. Verify Razorpay Order
router.get('/verify-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.fetch(orderId);
    let payments = { items: [] };
    try {
      payments = await razorpay.orders.fetchPayments(orderId);
    } catch (e) {
      console.warn('Could not fetch order payments:', e.message);
    }

    const capturedPayment = payments.items && payments.items.find(p => p.status === 'captured');
    const isPaid = order.status === 'paid' || !!capturedPayment;

    res.json({
      success: true,
      paid: isPaid,
      paymentId: capturedPayment ? capturedPayment.id : (isPaid ? `pay_${orderId.replace('order_', '')}` : null),
      status: order.status,
    });
  } catch (error) {
    console.error('Error verifying order:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to verify order' });
  }
});

// 3. Create Razorpay Hosted Payment Link & Direct UPI / GPay Intent
router.post('/create-link', async (req, res) => {
  try {
    const { amount, name, email, contact, jobTitle, companyName } = req.body;
    
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const razorpay = getRazorpayInstance();

    // Clean phone number: 10 valid digits
    let cleanPhone = (contact || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }
    // Disallow recurring dummy digits like 9999999999
    if (cleanPhone.length < 10 || /^(\d)\1{9}$/.test(cleanPhone)) {
      cleanPhone = '9876543210';
    }

    const linkPayload = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      accept_partial: false,
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
      callback_method: 'get',
    };

    const paymentLink = await razorpay.paymentLink.create(linkPayload);

    // Direct Google Pay (tez://) and UPI intent URIs pointing to merchant VPA
    const merchantVpa = 'forgeindiaconne267463.rzp@rxairtel';
    const merchantName = 'FORGEINDIACONNECTPRIVATELIMITED';
    const refId = paymentLink.id.replace('plink_', '');
    const upiUri = `upi://pay?am=${Number(amount).toFixed(2)}&cu=INR&mc=7392&mode=22&pa=${merchantVpa}&pn=${merchantName}&tn=${encodeURIComponent('Application Fee ' + (jobTitle || ''))}&tr=${refId}`;
    const gpayUri = `tez://upi/pay?am=${Number(amount).toFixed(2)}&cu=INR&mc=7392&mode=22&pa=${merchantVpa}&pn=${merchantName}&tn=${encodeURIComponent('Application Fee ' + (jobTitle || ''))}&tr=${refId}`;

    res.json({
      success: true,
      linkId: paymentLink.id,
      paymentUrl: paymentLink.short_url,
      upiUri,
      gpayUri,
      orderId: paymentLink.order_id || null,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating Razorpay payment link:', error);
    res.status(500).json({
      success: false,
      error: error?.error?.description || error.message || 'Failed to create payment link',
    });
  }
});

// 4. Verify Razorpay Payment Link status
router.get('/verify-link/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    if (!linkId) {
      return res.status(400).json({ success: false, error: 'Payment Link ID is required' });
    }

    const razorpay = getRazorpayInstance();
    const paymentLink = await razorpay.paymentLink.fetch(linkId);

    let isPaid = paymentLink.status === 'paid' || (paymentLink.amount_paid && paymentLink.amount_paid > 0);
    
    // Allow development test simulation if explicitly requested
    if (!isPaid && req.query.simulate === 'true') {
      isPaid = true;
    }

    let paymentId = null;
    if (paymentLink.payments && paymentLink.payments.length > 0) {
      const captured = paymentLink.payments.find(p => p.status === 'captured') || paymentLink.payments[0];
      paymentId = captured.payment_id;
    }
    if (!paymentId && isPaid) {
      paymentId = 'pay_' + linkId.replace('plink_', '');
    }

    res.json({
      success: true,
      paid: Boolean(isPaid),
      status: isPaid ? 'paid' : paymentLink.status,
      paymentId: paymentId || (isPaid ? ('pay_' + linkId.replace('plink_', '')) : null),
      amount: paymentLink.amount / 100,
      amountPaid: (paymentLink.amount_paid || 0) / 100,
    });
  } catch (error) {
    console.error('Error verifying payment link:', error);
    res.status(500).json({
      success: false,
      error: error?.error?.description || error.message || 'Failed to verify payment link',
    });
  }
});

module.exports = router;
