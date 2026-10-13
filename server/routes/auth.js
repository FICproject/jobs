const express = require('express');
const router = express.Router();
const { UserModel, CandidateModel, inMemoryStore, saveCandidateInMemory, saveStoreToDisk } = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'candidate', mobile, location, qualification, experience, skills } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    let existingUser = null;
    try {
      existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    } catch (e) {
      existingUser = (inMemoryStore.users || []).find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Account with this email already exists.' });
    }

    const userId = 'usr_' + Date.now();
    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash: 'dummy_hash_' + password,
      role: role === 'admin' ? 'admin' : 'candidate',
      mobile: mobile || '',
      location: location || '',
      qualification: qualification || '',
      experience: experience || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      createdAt: new Date().toISOString()
    };

    try {
      await UserModel.create(newUser);
    } catch (e) {
      console.warn('UserModel.create error, continuing with fallback:', e.message);
    }

    if (!inMemoryStore.users) inMemoryStore.users = [];
    inMemoryStore.users.push(newUser);
    saveStoreToDisk();

    let candId = null;
    // If candidate, also create candidate profile entry in MongoDB Atlas & Memory
    if (newUser.role === 'candidate') {
      candId = 'cand_' + Date.now();
      const candData = {
        id: candId,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        location: newUser.location,
        qualification: newUser.qualification,
        experience: newUser.experience,
        skills: newUser.skills,
        resumeUrl: '',
        createdAt: new Date().toISOString()
      };
      try {
        await CandidateModel.create(candData);
      } catch (e) {
        console.warn('CandidateModel.create error:', e.message);
      }
      saveCandidateInMemory(candData);
    }

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        candidateId: candId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mobile: newUser.mobile,
        location: newUser.location,
        qualification: newUser.qualification,
        experience: newUser.experience,
        skills: newUser.skills
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user in database.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Fixed Admin Credentials
    if (email.toLowerCase() === 'admin@forgeindiaconnect.in' && password === 'Admin@123') {
      return res.json({
        message: 'Login successful',
        user: {
          id: 'admin_fixed',
          candidateId: null,
          name: 'Super Admin',
          email: 'admin@forgeindiaconnect.in',
          role: 'admin',
          mobile: '',
          location: '',
          qualification: '',
          experience: '',
          skills: [],
          resumeUrl: '',
          referralCode: 'ADMIN'
        }
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();

    // Check if user exists and password matches
    if (!user || user.passwordHash !== 'dummy_hash_' + password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const candProfile = await CandidateModel.findOne({
      $or: [{ userId: user.id }, { email: user.email }]
    }).lean();

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        candidateId: candProfile ? candProfile.id : null,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile || (candProfile ? candProfile.mobile : ''),
        location: user.location || (candProfile ? candProfile.location : ''),
        qualification: user.qualification || (candProfile ? candProfile.qualification : ''),
        experience: user.experience || (candProfile ? candProfile.experience : ''),
        skills: user.skills || (candProfile ? candProfile.skills : []),
        resumeUrl: candProfile ? candProfile.resumeUrl : '',
        referralCode: user.referralCode || '',
        webReferralUrl: user.webReferralUrl || (user.referralCode ? `https://jobs.forgeindiaconnect.in?ref=${user.referralCode}` : ''),
        mobileReferralUrl: user.mobileReferralUrl || (user.referralCode ? `https://jobs.forgeindiaconnect.in?m.ref=${user.referralCode}` : '')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
});

// PUT /api/auth/profile/:userId - Profile update endpoint
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, mobile, location, qualification, experience, skills, resumeUrl } = req.body;

    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (mobile !== undefined) userUpdate.mobile = mobile;
    if (location !== undefined) userUpdate.location = location;
    if (qualification !== undefined) userUpdate.qualification = qualification;
    if (experience !== undefined) userUpdate.experience = experience;
    if (skills !== undefined) userUpdate.skills = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);

    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { $set: userUpdate },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Also update candidate model if exists
    const candUpdate = { ...userUpdate };
    if (resumeUrl !== undefined) candUpdate.resumeUrl = resumeUrl;

    const updatedCand = await CandidateModel.findOneAndUpdate(
      { $or: [{ userId }, { email: updatedUser.email }] },
      { $set: candUpdate },
      { new: true }
    ).lean();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        candidateId: updatedCand ? updatedCand.id : null,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        mobile: updatedUser.mobile || '',
        location: updatedUser.location || '',
        qualification: updatedUser.qualification || '',
        experience: updatedUser.experience || '',
        skills: updatedUser.skills || [],
        resumeUrl: updatedCand ? updatedCand.resumeUrl : '',
        referralCode: updatedUser.referralCode || '',
        webReferralUrl: updatedUser.webReferralUrl || (updatedUser.referralCode ? `https://jobs.forgeindiaconnect.in?ref=${updatedUser.referralCode}` : ''),
        mobileReferralUrl: updatedUser.mobileReferralUrl || (updatedUser.referralCode ? `https://jobs.forgeindiaconnect.in?m.ref=${updatedUser.referralCode}` : '')
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

module.exports = router;


