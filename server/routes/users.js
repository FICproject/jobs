const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { UserModel, ApplicationModel, ReferralClickModel, readDBAsync } = require('../db');

// In-memory cache for ultra-fast and reliable deferred referral resolution
let inMemoryReferralClicks = [];

async function recordReferralClick(referralCode, ip, userAgent) {
  if (!referralCode) return;
  const cleanCode = referralCode.trim();
  inMemoryReferralClicks.unshift({
    referralCode: cleanCode,
    ip: ip || '',
    userAgent: userAgent || '',
    timestamp: Date.now()
  });
  if (inMemoryReferralClicks.length > 2000) inMemoryReferralClicks.pop();

  try {
    if (ReferralClickModel) {
      await ReferralClickModel.create({
        referralCode: cleanCode,
        ip: ip || '',
        userAgent: userAgent || '',
        createdAt: new Date()
      });
    }
  } catch (e) {
    // Continue with inMemory store
  }
}

async function findReferralClickForIp(ip) {
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;

  // 1. Check in-memory store
  const memMatch = inMemoryReferralClicks.find((c) =>
    (c.ip === ip || ip === '127.0.0.1' || ip === '::1' || ip.includes('10.0.2.2')) &&
    c.timestamp > fortyEightHoursAgo
  );
  if (memMatch) return memMatch.referralCode;

  // 2. Check Mongo database
  try {
    if (ReferralClickModel) {
      const doc = await ReferralClickModel.findOne({
        ip,
        createdAt: { $gte: new Date(fortyEightHoursAgo) }
      }).sort({ createdAt: -1 }).lean();
      if (doc) return doc.referralCode;
    }
  } catch (e) {}

  // 3. Fallback for local emulator or development environment
  if (ip === '127.0.0.1' || ip === '::1' || ip.includes('10.0.2.2') || ip.includes('::ffff:127.0.0.1')) {
    if (inMemoryReferralClicks.length > 0) {
      return inMemoryReferralClicks[0].referralCode;
    }
  }

  return null;
}

const cleanReferralCode = (code) => {
  if (!code) return '';
  return code.toString().replace(/^m\.ref=/, '').replace(/^ref=/, '').trim();
};

// POST register referral click with IP matching (used by web app & mobile deep-link fallback)
router.post('/referral/register-click', async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
      return res.status(400).json({ error: 'Referral code required.' });
    }
    const cleanCode = cleanReferralCode(referralCode);
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
    const ip = rawIp.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';

    await UserModel.updateOne(
      { referralCode: cleanCode, role: 'hr' },
      { $inc: { linkClicks: 1 } }
    );

    await recordReferralClick(cleanCode, ip, userAgent);
    res.json({ success: true, referralCode: cleanCode, ip });
  } catch (err) {
    console.error('Error in /referral/register-click:', err);
    res.status(500).json({ error: 'Failed to register referral click.' });
  }
});

// GET resolve deferred referral for candidate mobile app on cold start
router.get('/referral/resolve', async (req, res) => {
  try {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
    const ip = rawIp.split(',')[0].trim();
    const referralCode = await findReferralClickForIp(ip);

    if (referralCode) {
      return res.json({ success: true, referralCode });
    }
    res.json({ success: false, message: 'No pending referral found for this IP.' });
  } catch (err) {
    console.error('Error in /referral/resolve:', err);
    res.status(500).json({ error: 'Failed to resolve referral.' });
  }
});

// POST track link click - candidate referral link open panna auto call aagum (renamed to visit to avoid adblockers)
router.post('/hr/:referralCode/visit', async (req, res) => {
  try {
    const cleanCode = cleanReferralCode(req.params.referralCode);
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
    const ip = rawIp.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';

    await UserModel.updateOne(
      { referralCode: cleanCode, role: 'hr' },
      { $inc: { linkClicks: 1 } }
    );

    await recordReferralClick(cleanCode, ip, userAgent);
    res.json({ success: true, referralCode: cleanCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record visit.' });
  }
});

router.get('/hr', async (req, res) => {
  try {
    const hrs = await UserModel.find({ role: 'hr' }).lean();
    const enriched = hrs.map(hr => {
      const code = hr.referralCode || '';
      return {
        ...hr,
        webReferralUrl: hr.webReferralUrl || (code ? `https://jobs.forgeindiaconnect.in?ref=${code}` : ''),
        mobileReferralUrl: hr.mobileReferralUrl || (code ? `https://jobs.forgeindiaconnect.in?m.ref=${code}` : '')
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch HR users' });
  }
});

// POST to create HR
router.post('/hr', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Account with this email already exists.' });
    }

    const userId = 'usr_' + Date.now();
    let referralCode = 'HR-' + Math.floor(10000 + Math.random() * 90000);
    let existingCode = await UserModel.findOne({ referralCode });
    while (existingCode) {
      referralCode = 'HR-' + Math.floor(10000 + Math.random() * 90000);
      existingCode = await UserModel.findOne({ referralCode });
    }

    const webReferralUrl = `https://jobs.forgeindiaconnect.in?ref=${referralCode}`;
    const mobileReferralUrl = `https://jobs.forgeindiaconnect.in?m.ref=${referralCode}`;

    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash: 'dummy_hash_' + password,
      role: 'hr',
      referralCode,
      webReferralUrl,
      mobileReferralUrl,
      linkClicks: 0,
      createdAt: new Date().toISOString()
    };

    const savedUser = await UserModel.create(newUser);
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create HR user.' });
  }
});

// DELETE an HR user
router.delete('/hr/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await UserModel.deleteOne({ id, role: 'hr' });
    res.json({ message: 'HR User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete HR user.' });
  }
});

// GET user / HR profile with web & mobile referral URLs
router.get(['/:userId/profile', '/hr/:userId/profile'], async (req, res) => {
  try {
    const { userId } = req.params;
    const cleanId = cleanReferralCode(userId);
    const user = await UserModel.findOne({
      $or: [
        { id: cleanId },
        { referralCode: cleanId },
        ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : [])
      ]
    }).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const code = user.referralCode || '';
    const webReferralUrl = user.webReferralUrl || (code ? `https://jobs.forgeindiaconnect.in?ref=${code}` : '');
    const mobileReferralUrl = user.mobileReferralUrl || (code ? `https://jobs.forgeindiaconnect.in?m.ref=${code}` : '');

    res.json({
      ...user,
      webReferralUrl,
      mobileReferralUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// GET HR Dashboard Stats
router.get('/hr/:referralCode/dashboard', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const cleanCode = cleanReferralCode(referralCode);

    // Get HR user for click count
    const hrUser = await UserModel.findOne({
      $or: [
        { referralCode: cleanCode },
        { id: cleanCode },
        ...(mongoose.Types.ObjectId.isValid(cleanCode) ? [{ _id: cleanCode }] : [])
      ],
      role: 'hr'
    }).lean();

    const actualCode = hrUser?.referralCode || cleanCode;
    const webReferralUrl = hrUser?.webReferralUrl || `https://jobs.forgeindiaconnect.in?ref=${actualCode}`;
    const mobileReferralUrl = hrUser?.mobileReferralUrl || `https://jobs.forgeindiaconnect.in?m.ref=${actualCode}`;

    if (hrUser && (!hrUser.webReferralUrl || !hrUser.mobileReferralUrl)) {
      await UserModel.updateOne(
        { _id: hrUser._id },
        { $set: { webReferralUrl, mobileReferralUrl } }
      ).catch(() => {});
    }

    // Find applications referred by this HR
    const applications = await ApplicationModel.find({ referredBy: actualCode }).lean();
    const db = await readDBAsync();

    const populated = applications.map(app => {
      const candidate = db.candidates.find(c => c.id === app.candidateId) || {};
      let job = db.jobs.find(j => j.id === app.jobId);
      if (!job) {
        const itProc = (db.itTrainingProcesses || []).find(p => p.id === app.jobId);
        if (itProc) {
          job = { title: itProc.role || itProc.programTitle, companyName: 'FIC IT' };
        }
      }
      const company = db.companies.find(c => c.id === app.companyId || (job && c.id === job.companyId)) || {};

      return {
        ...app,
        candidateName: candidate.name || 'Anonymous',
        candidateEmail: candidate.email || '',
        candidateMobile: candidate.mobile || '',
        candidateLocation: candidate.location || '',
        candidateDOB: candidate.qualification || '',
        candidateExperience: candidate.experience || '',
        jobTitle: job ? (job.title || job.companyName) : 'Untitled Job',
        companyName: (job && job.companyName) ? job.companyName : (company.name || 'Unknown Company')
      };
    });

    const stats = {
      totalApplications: applications.length,
      linkClicks: hrUser ? (hrUser.linkClicks || 0) : 0,
      applications: populated,
      referralCode: actualCode,
      webReferralUrl,
      mobileReferralUrl,
      user: hrUser ? {
        ...hrUser,
        webReferralUrl,
        mobileReferralUrl
      } : null
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch HR dashboard stats.' });
  }
});

// GET subagents/partners for an HR (both /agents/:hrId/subagents and /hr/:hrId/agents supported)
const getAgentsHandler = async (req, res) => {
  try {
    const { hrId } = req.params;

    // Find HR to collect all identifier representations
    const hr = await UserModel.findOne({
      $or: [
        { id: hrId },
        { referralCode: hrId },
        ...(mongoose.Types.ObjectId.isValid(hrId) ? [{ _id: hrId }] : [])
      ]
    }).lean();

    const idsToMatch = [hrId];
    if (hr) {
      if (hr.id && !idsToMatch.includes(hr.id)) idsToMatch.push(hr.id);
      if (hr._id && !idsToMatch.includes(String(hr._id))) idsToMatch.push(String(hr._id));
      if (hr.referralCode && !idsToMatch.includes(hr.referralCode)) idsToMatch.push(hr.referralCode);
    }

    const agents = await UserModel.find({
      $or: [
        { hrId: { $in: idsToMatch } },
        { parentHrId: { $in: idsToMatch } },
        { role: 'partner', hrId: { $in: idsToMatch } },
        { role: 'agent', parentHrId: { $in: idsToMatch } }
      ]
    }).lean();

    const db = await readDBAsync();
    const applications = db.applications || [];

    const enriched = (agents || []).map(ag => {
      const agApps = applications.filter(a => a.referredBy === ag.referralCode);
      const code = ag.referralCode || '';
      return {
        ...ag,
        webReferralUrl: ag.webReferralUrl || (code ? `https://jobs.forgeindiaconnect.in?ref=${code}` : ''),
        mobileReferralUrl: ag.mobileReferralUrl || (code ? `https://jobs.forgeindiaconnect.in?m.ref=${code}` : ''),
        linkClicks: ag.linkClicks || 0,
        candidatesApplied: agApps.length,
        closedCandidates: agApps.filter(a => a.status === 'Selected' || a.status === 'Hired' || a.status === 'Closed').length
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
};

router.get('/agents/:hrId/subagents', getAgentsHandler);
router.get('/hr/:hrId/agents', getAgentsHandler);

const createAgentHandler = async (req, res) => {
  try {
    const { hrId } = req.params;
    const { name, email, mobile, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Account with this email already exists.' });
    }

    const hr = await UserModel.findOne({
      $or: [
        { id: hrId },
        { referralCode: hrId },
        ...(mongoose.Types.ObjectId.isValid(hrId) ? [{ _id: hrId }] : [])
      ]
    }).lean();

    const canonicalHrId = hr ? (hr.id || String(hr._id)) : hrId;
    const agentId = 'agt_' + Date.now();
    const referralCode = 'AG-' + Math.floor(10000 + Math.random() * 90000);

    const webReferralUrl = `https://jobs.forgeindiaconnect.in?ref=${referralCode}`;
    const mobileReferralUrl = `https://jobs.forgeindiaconnect.in?m.ref=${referralCode}`;

    const newAgent = {
      id: agentId,
      name,
      email: email.toLowerCase(),
      mobile: mobile || '',
      passwordHash: 'dummy_hash_' + (password || '123456'),
      role: 'agent',
      hrId: canonicalHrId,
      parentHrId: canonicalHrId,
      referralCode,
      webReferralUrl,
      mobileReferralUrl,
      linkClicks: 0,
      createdAt: new Date().toISOString()
    };

    const saved = await UserModel.create(newAgent);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ error: 'Failed to create partner: ' + error.message });
  }
};

router.post('/agents/:hrId/subagents', createAgentHandler);
router.post('/hr/:hrId/agents', createAgentHandler);

const deleteAgentHandler = async (req, res) => {
  try {
    const { agentId } = req.params;
    await UserModel.deleteOne({
      $or: [
        { id: agentId },
        ...(mongoose.Types.ObjectId.isValid(agentId) ? [{ _id: agentId }] : [])
      ]
    });
    res.json({ message: 'Partner deleted successfully.' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ error: 'Failed to delete partner.' });
  }
};

router.delete('/agents/:hrId/subagents/:agentId', deleteAgentHandler);
router.delete('/hr/:hrId/agents/:agentId', deleteAgentHandler);

// PUT /api/users/hr/:hrId/candidate-incentives
router.put('/hr/:hrId/candidate-incentives', async (req, res) => {
  try {
    const { items } = req.body; // [{ applicationId, amount }]
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }

    const { ApplicationModel } = require('../db');
    for (const item of items) {
      if (item.applicationId) {
        await ApplicationModel.updateOne(
          { id: item.applicationId },
          { $set: { incentiveAmount: Number(item.amount) || 0, updatedAt: new Date().toISOString() } }
        );
      }
    }

    res.json({ success: true, message: 'Incentives updated successfully.' });
  } catch (error) {
    console.error('Error updating candidate incentives:', error);
    res.status(500).json({ error: 'Failed to update candidate incentives.' });
  }
});

// PUT /api/users/:userId/profile
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, accountHolderName, bankName, bankAccountNumber, bankIfscCode, bankBranch } = req.body;
    const update = {};
    if (name) update.name = name;
    if (accountHolderName !== undefined) update.accountHolderName = accountHolderName;
    if (bankName !== undefined) update.bankName = bankName;
    if (bankAccountNumber !== undefined) update.bankAccountNumber = bankAccountNumber;
    if (bankIfscCode !== undefined) update.bankIfscCode = bankIfscCode;
    if (bankBranch !== undefined) update.bankBranch = bankBranch;

    const updated = await UserModel.findOneAndUpdate(
      {
        $or: [
          { id: userId },
          { referralCode: userId },
          ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : [])
        ]
      },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/users/:userId/password
router.put('/:userId/password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;
    const user = await UserModel.findOne({
      $or: [
        { id: userId },
        { referralCode: userId },
        ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : [])
      ]
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.passwordHash = 'dummy_hash_' + newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;