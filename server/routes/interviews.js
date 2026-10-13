const express = require('express');
const router = express.Router();
const { readDBAsync, InterviewModel, ApplicationModel } = require('../db');

// GET /api/interviews (supports ?candidateId=xxx or ?applicationId=xxx)
router.get('/', async (req, res) => {
  try {
    const { candidateId, applicationId } = req.query;
    const db = await readDBAsync();
    let interviews = db.interviews || [];

    if (candidateId) {
      interviews = interviews.filter(i => i.candidateId === candidateId);
    }
    if (applicationId) {
      interviews = interviews.filter(i => i.applicationId === applicationId);
    }

    // Populate candidate, job, company
    const populated = interviews.map(int => {
      const candidate = db.candidates.find(c => c.id === int.candidateId) || {};
      const job = db.jobs.find(j => j.id === int.jobId) || {};
      const company = db.companies.find(c => c.id === int.companyId || c.id === job.companyId) || {};

      const app = (db.applications || []).find(a => a.id === int.applicationId || a.candidateId === int.candidateId) || {};
      const hr = (db.users || []).find(u => u.referralCode === app.referredBy) || {};

      return {
        ...int,
        candidateName: candidate.name || 'Candidate',
        candidateEmail: candidate.email || '',
        candidateMobile: candidate.mobile || '',
        jobTitle: job.title || 'Job Role',
        companyName: company.name || 'Company',
        companyLogo: company.logo || '',
        referredBy: app.referredBy || null,
        hrName: hr.name || (app.referredBy ? 'HR Partner' : 'Direct'),
        hrReferralCode: app.referredBy || null,
      };
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch interviews from MongoDB Atlas.' });
  }
});

// POST /api/interviews (Schedule interview)
router.post('/', async (req, res) => {
  try {
    const {
      applicationId,
      candidateId,
      jobId,
      companyId,
      round = 'HR Screening',
      date,
      time,
      mode = 'Online',
      location = '',
      meetingLink = '',
      interviewer = '',
      notes = ''
    } = req.body;

    if (!applicationId || !date || !time) {
      return res.status(400).json({ error: 'Application ID, Date, and Time are required.' });
    }

    const app = await ApplicationModel.findOne({ id: applicationId });
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const newInterview = {
      id: 'int_' + Date.now(),
      applicationId,
      candidateId: candidateId || app.candidateId,
      jobId: jobId || app.jobId,
      companyId: companyId || app.companyId,
      round,
      date,
      time,
      mode,
      location,
      meetingLink,
      interviewer,
      status: 'Scheduled',
      notes,
      createdAt: new Date().toISOString()
    };

    const savedInterview = await InterviewModel.create(newInterview);

    // Automatically update Application status to 'Interview Scheduled'
    await ApplicationModel.findOneAndUpdate(
      { id: applicationId },
      { $set: { status: 'Interview Scheduled', updatedAt: new Date().toISOString() } }
    );

    res.status(201).json(savedInterview.toObject());
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule interview in MongoDB Atlas.' });
  }
});

// PUT /api/interviews/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateObj = { ...req.body, updatedAt: new Date().toISOString() };
    const updated = await InterviewModel.findOneAndUpdate({ id }, { $set: updateObj }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Interview schedule not found.' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update interview schedule in MongoDB Atlas.' });
  }
});

module.exports = router;

