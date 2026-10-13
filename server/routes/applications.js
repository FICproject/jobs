const express = require('express');
const router = express.Router();
const {
  readDBAsync,
  ApplicationModel,
  CandidateModel,
  JobModel,
  UserModel,
  saveCandidateInMemory,
  saveApplicationInMemory,
  updateApplicationInMemory,
  inMemoryStore,
  saveStoreToDisk
} = require('../db');

// GET /api/applications (supports ?candidateId=xxx & ?status=xxx & ?jobId=xxx)
router.get('/', async (req, res) => {
  try {
    const { candidateId, status, jobId } = req.query;
    const db = await readDBAsync();
    let apps = db.applications || [];

    if (candidateId) {
      apps = apps.filter(a => a.candidateId === candidateId || (a.candidateDetails && a.candidateDetails.userId === candidateId));
    }
    if (jobId) {
      apps = apps.filter(a => a.jobId === jobId);
    }
    if (status) {
      apps = apps.filter(a => a.status && a.status.toLowerCase() === status.toLowerCase());
    }

    // Populate references
    const populated = apps.map(app => {
      // Find candidate from db.candidates by candidateId, or userId, or email, or mobile
      let candidate = (db.candidates || []).find(c =>
        (app.candidateId && c.id === app.candidateId) ||
        (app.candidateId && c.userId === app.candidateId)
      );

      if (!candidate && app.candidateDetails?.email) {
        candidate = (db.candidates || []).find(c => c.email && c.email.toLowerCase() === app.candidateDetails.email.toLowerCase());
      }
      if (!candidate && app.candidateEmail) {
        candidate = (db.candidates || []).find(c => c.email && c.email.toLowerCase() === app.candidateEmail.toLowerCase());
      }
      if (!candidate && app.candidateMobile) {
        candidate = (db.candidates || []).find(c => c.mobile && c.mobile === app.candidateMobile);
      }

      // Check users collection as additional fallback
      const user = (db.users || []).find(u =>
        (app.candidateId && u.id === app.candidateId) ||
        (app.candidateDetails?.userId && u.id === app.candidateDetails.userId) ||
        (app.candidateEmail && u.email && u.email.toLowerCase() === app.candidateEmail.toLowerCase())
      ) || {};

      const cDet = app.candidateDetails || {};

      // Multi-tier candidate resolution: app direct fields -> candidate record -> app.candidateDetails -> user record -> fallback
      const candName = app.candidateName || candidate?.name || cDet.name || cDet.fullName || user.name || 'Anonymous';
      const candEmail = app.candidateEmail || candidate?.email || cDet.email || user.email || '';
      const candMobile = app.candidateMobile || candidate?.mobile || cDet.mobile || cDet.phone || user.mobile || '';
      const candLocation = app.candidateLocation || candidate?.location || cDet.location || cDet.city || user.location || '';
      const candDob = app.candidateDob || app.dob || candidate?.dob || cDet.dob || '';
      const candQualification = app.candidateQualification || candidate?.qualification || cDet.qualification || (candDob ? (candDob.startsWith('DOB:') ? candDob : `DOB: ${candDob}`) : '') || user.qualification || '';
      const candExperience = app.candidateExperience || candidate?.experience || cDet.experience || user.experience || 'Fresher';
      const candResume = app.candidateResumeUrl || app.resumeUrl || candidate?.resumeUrl || cDet.resumeUrl || user.resumeUrl || '';

      let job = (db.jobs || []).find(j => j.id === app.jobId);
      if (!job) {
        const itProc = (db.itTrainingProcesses || []).find(p => p.id === app.jobId);
        if (itProc) {
          const compName = itProc.itCategory === 'Course' ? 'FIC IT Courses' : itProc.itCategory === 'Internship' ? 'FIC Free IT Internship' : 'FIC IT Training & Placement';
          job = {
            id: itProc.id,
            title: itProc.role || itProc.programTitle || 'IT Trainee',
            location: itProc.location || 'PAN INDIA',
            companyId: 'comp_fic_it',
            companyName: compName
          };
        }
      }
      const company = (db.companies || []).find(c => c.id === app.companyId || (job && c.id === job.companyId)) || {};

      return {
        ...app,
        candidateName: candName,
        candidateEmail: candEmail,
        candidateMobile: candMobile,
        candidateLocation: candLocation,
        candidateQualification: candQualification,
        candidateDob: candDob,
        candidateExperience: candExperience,
        candidateResumeUrl: candResume,
        jobTitle: job ? (job.title || job.companyName || 'IT Training Enquiry') : 'Untitled Job',
        jobLocation: job ? (job.location || '') : '',
        companyName: (job && job.companyName) ? job.companyName : (company.name || 'Unknown Company'),
        companyLogo: company.logo || '/logo.png'
      };
    });

    res.json(populated);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications from database.' });
  }
});

// POST /api/applications (Candidate applies for job)
router.post('/', async (req, res) => {
  try {
    const { candidateId, jobId, resumeUrl, coverNotes, referredBy, paymentId, paymentAmount } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required.' });
    }

    const db = await readDBAsync();
    let job = (db.jobs || []).find(j => j.id === jobId);

    if (!job) {
      const itProc = (db.itTrainingProcesses || []).find(p => p.id === jobId);
      if (itProc) {
        const compName = itProc.itCategory === 'Course' ? 'FIC IT Courses' : itProc.itCategory === 'Internship' ? 'FIC Free IT Internship' : 'FIC IT Training & Placement';
        job = {
          id: itProc.id,
          title: itProc.role || itProc.programTitle || 'IT Trainee',
          companyId: 'comp_fic_it',
          companyName: compName,
          categoryId: 'cat_it'
        };
      }
    }

    if (!job) {
      return res.status(404).json({ error: 'Job post not found.' });
    }

    // Extract all candidate profile fields from request body or candidateDetails
    const cDet = req.body.candidateDetails || {};
    const name = (req.body.candidateName || req.body.fullName || req.body.name || cDet.name || cDet.fullName || '').trim();
    const email = (req.body.candidateEmail || req.body.email || cDet.email || '').toLowerCase().trim();
    const mobile = (req.body.candidateMobile || req.body.phone || req.body.mobile || cDet.mobile || cDet.phone || '').trim();
    const city = (req.body.candidateLocation || req.body.city || req.body.location || cDet.location || cDet.city || '').trim();
    const dob = (req.body.candidateDob || req.body.dob || cDet.dob || '').trim();
    const rawQual = (req.body.candidateQualification || req.body.qualification || cDet.qualification || '').trim();
    const qualification = rawQual || (dob ? (dob.startsWith('DOB:') ? dob : `DOB: ${dob}`) : 'Graduate');
    const experience = (req.body.candidateExperience || req.body.experienceYears || req.body.experience || cDet.experience || 'Fresher').trim();

    // Look for existing candidate profile in db
    let cand = null;
    if (candidateId) {
      cand = (db.candidates || []).find(c => c.id === candidateId || c.userId === candidateId);
    }
    if (!cand && email) {
      cand = (db.candidates || []).find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
    }
    if (!cand && mobile) {
      cand = (db.candidates || []).find(c => c.mobile && c.mobile === mobile);
    }

    if (cand) {
      // Update candidate details if missing or if updated
      const updateFields = {};
      if (name && (!cand.name || cand.name === 'Guest Candidate' || cand.name === 'Anonymous')) updateFields.name = name;
      if (mobile && (!cand.mobile || cand.mobile.length < 10)) updateFields.mobile = mobile;
      if (email && !cand.email) updateFields.email = email;
      if (city && !cand.location) updateFields.location = city;
      if (qualification) updateFields.qualification = qualification;
      if (dob && !cand.dob) updateFields.dob = dob;
      if (experience) updateFields.experience = experience;
      if (resumeUrl && !cand.resumeUrl) updateFields.resumeUrl = resumeUrl;

      if (Object.keys(updateFields).length > 0) {
        Object.assign(cand, updateFields);
        try {
          await CandidateModel.updateOne({ id: cand.id }, { $set: updateFields });
        } catch (e) {
          console.warn('Candidate update in MongoDB failed:', e.message);
        }
        saveCandidateInMemory(cand);
      }
    } else {
      // Create candidate record in database
      const newCandId = (candidateId && candidateId.startsWith('cand_')) ? candidateId : ('cand_' + Date.now());
      const newCandData = {
        id: newCandId,
        userId: cDet.userId || req.body.userId || 'usr_candidate',
        name: name || 'Applicant',
        email: email || '',
        mobile: mobile || '',
        location: city || '',
        qualification: qualification || '',
        dob: dob || '',
        experience: experience || '',
        skills: Array.isArray(cDet.skills) ? cDet.skills : [],
        resumeUrl: resumeUrl || cDet.resumeUrl || '',
        createdAt: new Date().toISOString()
      };
      try {
        const created = await CandidateModel.create(newCandData);
        cand = created.toObject ? created.toObject() : created;
      } catch (e) {
        console.warn('Candidate create in MongoDB failed:', e.message);
        cand = newCandData;
      }
      saveCandidateInMemory(cand);
    }

    const effectiveCandId = cand ? cand.id : (candidateId || ('cand_' + Date.now()));
    const effectiveCandName = name || (cand ? cand.name : '') || 'Applicant';
    const effectiveCandEmail = email || (cand ? cand.email : '') || '';
    const effectiveCandMobile = mobile || (cand ? cand.mobile : '') || '';
    const effectiveCandLocation = city || (cand ? cand.location : '') || '';
    const effectiveCandQualification = qualification || (cand ? cand.qualification : '') || '';
    const effectiveCandExperience = experience || (cand ? cand.experience : '') || 'Fresher';
    const effectiveCandDob = dob || (cand ? cand.dob : '') || '';

    // Check if candidate already applied to this job
    let existingApp = null;
    try {
      existingApp = await ApplicationModel.findOne({
        $or: [
          { candidateId: effectiveCandId, jobId },
          ...(effectiveCandEmail ? [{ candidateEmail: effectiveCandEmail, jobId }] : []),
          ...(effectiveCandMobile ? [{ candidateMobile: effectiveCandMobile, jobId }] : [])
        ]
      });
    } catch (e) {
      existingApp = (db.applications || []).find(a => (a.candidateId === effectiveCandId || a.candidateEmail === effectiveCandEmail) && a.jobId === jobId);
    }

    if (existingApp) {
      // If the candidate already has a 'Payment Pending' record, update and return it
      if (existingApp.status === 'Payment Pending') {
        const updateFields = {
          updatedAt: new Date().toISOString()
        };
        if (req.body.status) {
          updateFields.status = req.body.status;
        } else if (paymentId) {
          updateFields.status = 'Applied';
        }
        if (paymentId) updateFields.paymentId = paymentId;
        if (paymentAmount !== undefined) updateFields.paymentAmount = paymentAmount;
        if (effectiveCandName && effectiveCandName !== 'Applicant') updateFields.candidateName = effectiveCandName;
        if (effectiveCandMobile) updateFields.candidateMobile = effectiveCandMobile;
        if (effectiveCandEmail) updateFields.candidateEmail = effectiveCandEmail;
        if (effectiveCandLocation) updateFields.candidateLocation = effectiveCandLocation;
        if (effectiveCandQualification) updateFields.candidateQualification = effectiveCandQualification;
        if (effectiveCandDob) {
          updateFields.candidateDob = effectiveCandDob;
          updateFields.dob = effectiveCandDob;
        }
        if (effectiveCandExperience) updateFields.candidateExperience = effectiveCandExperience;
        if (coverNotes) updateFields.adminNotes = `Candidate Notes: ${coverNotes}`;
        if (referredBy) updateFields.referredBy = referredBy;

        let updatedApp = null;
        try {
          updatedApp = await ApplicationModel.findOneAndUpdate({ id: existingApp.id }, { $set: updateFields }, { new: true }).lean();
        } catch (e) {
          console.warn('Mongo update error on existing pending application:', e.message);
        }
        const memUpdated = updateApplicationInMemory(existingApp.id, updateFields);
        const finalPending = updatedApp || memUpdated || { ...(existingApp.toObject ? existingApp.toObject() : existingApp), ...updateFields };
        return res.status(200).json(finalPending);
      }

      return res.status(400).json({
        error: 'You have already applied for this position.',
        application: existingApp.toObject ? existingApp.toObject() : existingApp
      });
    }

    const appNumber = 'JOB-' + Math.floor(100000 + Math.random() * 900000);
    const newApp = {
      id: 'app_' + Date.now(),
      applicationNumber: appNumber,
      candidateId: effectiveCandId,
      jobId,
      companyId: job.companyId,
      categoryId: job.categoryId,
      status: req.body.status || 'Applied',
      appliedAt: new Date().toISOString(),
      adminNotes: coverNotes ? `Candidate Notes: ${coverNotes}` : '',
      referredBy: referredBy || null,
      paymentId: paymentId || null,
      paymentAmount: paymentAmount || 0,
      updatedAt: new Date().toISOString(),

      // Denormalized candidate fields directly on application
      candidateName: effectiveCandName,
      candidateEmail: effectiveCandEmail,
      candidateMobile: effectiveCandMobile,
      candidateLocation: effectiveCandLocation,
      candidateQualification: effectiveCandQualification,
      candidateExperience: effectiveCandExperience,
      candidateDob: effectiveCandDob,
      dob: effectiveCandDob,
      candidateResumeUrl: resumeUrl || (cand ? cand.resumeUrl : '') || '',
      candidateDetails: {
        userId: cDet.userId || (cand ? cand.userId : 'usr_candidate'),
        name: effectiveCandName,
        email: effectiveCandEmail,
        mobile: effectiveCandMobile,
        location: effectiveCandLocation,
        city: effectiveCandLocation,
        qualification: effectiveCandQualification,
        experience: effectiveCandExperience,
        dob: effectiveCandDob
      }
    };

    let savedApp = null;
    try {
      const createdApp = await ApplicationModel.create(newApp);
      savedApp = createdApp.toObject ? createdApp.toObject() : createdApp;
      console.log('✅ Application saved directly to MongoDB Atlas Cloud:', savedApp.id);
    } catch (err) {
      console.warn('ApplicationModel.create in MongoDB Atlas threw error, saving to memory:', err.message);
      savedApp = newApp;
    }

    saveApplicationInMemory(savedApp);
    res.status(201).json(savedApp);
  } catch (err) {
    console.error('Error applying in applications route:', err);
    res.status(500).json({ error: 'Failed to save application to database.' });
  }
});

// PUT /api/applications/:id/status (Admin updates candidate application status or manually approves payment)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, paymentId, paymentAmount } = req.body;

    const updateObj = { updatedAt: new Date().toISOString() };
    if (status) updateObj.status = status;
    if (adminNotes !== undefined) updateObj.adminNotes = adminNotes;
    if (paymentId !== undefined) updateObj.paymentId = paymentId;
    if (paymentAmount !== undefined) updateObj.paymentAmount = paymentAmount;

    let updated = null;
    try {
      updated = await ApplicationModel.findOneAndUpdate({ id }, { $set: updateObj }, { new: true }).lean();
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
    const memUpdated = updateApplicationInMemory(id, updateObj);
    const finalResult = updated || memUpdated;

    if (!finalResult) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json(finalResult);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update application status in database.' });
  }
});

// PUT /api/applications/:id/incentive-status (Update payout incentive status)
router.put('/:id/incentive-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updateObj = { incentiveStatus: status, updatedAt: new Date().toISOString() };

    let updated = null;
    try {
      updated = await ApplicationModel.findOneAndUpdate(
        { id },
        { $set: updateObj },
        { new: true }
      ).lean();
    } catch (e) {
      console.warn('Mongo update error:', e.message);
    }
    const memUpdated = updateApplicationInMemory(id, updateObj);
    const finalResult = updated || memUpdated;

    if (!finalResult) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json(finalResult);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update incentive status in database.' });
  }
});

module.exports = router;

