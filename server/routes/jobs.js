const express = require('express');
const router = express.Router();
const {
  readDBAsync,
  JobModel,
  saveJobInMemory,
  updateJobInMemory,
  deleteJobInMemory,
  getIsMongoConnected
} = require('../db');

// GET /api/jobs (supports query: categoryId, companyId, status, search, location)
router.get('/', async (req, res) => {
  try {
    const { categoryId, companyId, status, search, location } = req.query;
    const db = await readDBAsync();
    let jobs = db.jobs || [];

    if (categoryId) {
      jobs = jobs.filter(j => j.categoryId === categoryId);
    }
    if (companyId) {
      jobs = jobs.filter(j => j.companyId === companyId);
    }
    if (status) {
      jobs = jobs.filter(j => j.status && j.status.toLowerCase() === status.toLowerCase());
    }
    if (location) {
      jobs = jobs.filter(j => j.location && j.location.toLowerCase().includes(location.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j => 
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.description && j.description.toLowerCase().includes(q)) ||
        (j.skills && j.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    // Populate company and category details for easy UI rendering
    const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const populated = jobs.map(job => {
      const company = db.companies.find(c => c.id === job.companyId);
      const category = db.categories.find(cat => cat.id === job.categoryId);
      let companyLogo = company ? (company.logo || '') : '';
      // Strip any localhost URLs stored in the DB (old/dev data)
      if (companyLogo.match(/^https?:\/\/localhost(:\d+)?/)) {
        companyLogo = companyLogo.replace(/^https?:\/\/localhost(:\d+)?/, baseUrl);
      } else if (companyLogo.startsWith('/')) {
        companyLogo = `${baseUrl}${companyLogo}`;
      }
      return {
        ...job,
        companyName: company ? company.name : 'Unknown Company',
        companyLogo,
        categoryName: category ? category.name : 'Uncategorized'
      };
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs from MongoDB Atlas.' });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDBAsync();
    let job = db.jobs.find(j => j.id === id);

    if (!job) {
      // Check IT training processes
      const itProcesses = db.itTrainingProcesses || [];
      const itProc = itProcesses.find(p => p.id === id);
      if (itProc) {
        const itCategory = itProc.itCategory || 'Placement';
        const isCourse = itCategory === 'Course';
        const isInternship = itCategory === 'Internship';
        const companyName = isCourse ? 'FIC IT Courses' : isInternship ? 'FIC Free IT Internship' : 'FIC IT Training & Placement';

        return res.json({
          id: itProc.id,
          title: itProc.role || 'Software Engineer Trainee',
          role: itProc.role || 'Software Engineer Trainee',
          company: companyName,
          companyName: companyName,
          companyLogo: '/logo.png',
          categoryName: 'IT & Software Development',
          categoryId: 'cat_it',
          itCategory: itCategory,
          processName: itProc.processName || 'PROCESS 1',
          programName: `${itProc.processName || 'PROCESS 1'}: ${itProc.programTitle || 'FIC IT Training Program'}`,
          programTitle: itProc.programTitle,
          salary: itProc.salary || (isInternship ? 'Stipend: ₹0' : '3.5 - 6.0 LPA'),
          experience: 'Fresher & Experience',
          experienceTag: 'Fresher & Experience',
          location: itProc.location || 'PAN INDIA',
          trainingPeriod: itProc.trainingPeriod || '6 Months',
          trainingTitle: itProc.trainingPeriod || '6 Months',
          trainingSubtext: itProc.trainingSubtext || '3 Months Classroom Training | 3 Months Real Project Training',
          stipend: `STIPEND ₹${itProc.stipend || (isInternship ? '0' : '12,000')}`,
          stipendTitle: `STIPEND ₹${itProc.stipend || (isInternship ? '0' : '12,000')}`,
          stipendSubtext: itProc.stipendSubtext || (isInternship ? '100% Free Internship - Zero Cost' : `Stipend ₹${itProc.stipend || '12,000'} per month during training`),
          trainingFee: itProc.trainingFee || (isInternship ? '100% FREE' : '1.6 LPA'),
          feeRefundType: isCourse ? 'Course Fee' : isInternship ? '100% Free' : '100% Placement Guarantee',
          feeRefundDetails: isInternship ? 'Zero Cost Internship' : '100% money back guarantee upon successful training completion',
          bondPeriod: itProc.bondPeriod || (isInternship || isCourse ? 'No Bond' : '1 Year Bond'),
          originalsRequired: itProc.originalsRequired || (isInternship || isCourse ? 'Not Required' : 'Originals Need to Submit'),
          description: itProc.description || (isCourse 
            ? `Comprehensive IT course in ${itProc.role || 'Software Development'} with practical labs and mentorship.`
            : isInternship
            ? `Join our exclusive 100% Free Internship program. Work on live industry projects alongside experienced developers without paying any fees.`
            : `Complete IT Job Training with 100% placement guarantee in top IT companies.`),
          responsibilities: isCourse ? [
            'Master core concepts, modern frameworks, and design patterns.',
            'Build full stack portfolio applications with industry best practices.',
            'Participate in live coding sessions, problem solving, and architecture reviews.',
            'Complete milestone capstone projects with code walkthroughs.'
          ] : isInternship ? [
            'Work on live enterprise and customer projects under guidance of senior technical leads.',
            'Collaborate with development teams in daily standups, code reviews, and sprints.',
            'Build real-world features, write clean maintainable code, and fix defects.',
            'Gain hands-on software development lifecycle (SDLC) experience.'
          ] : [
            'Complete comprehensive software development and full stack curriculum.',
            'Work on live enterprise projects under guidance of senior technical leads.',
            'Participate in mock technical interviews, system design sessions, and client presentations.',
            'Clear evaluation rounds and get deployed to hiring partner tech firms.'
          ],
          requirements: (isCourse || isInternship) ? [
            'Any Degree (B.E, B.Tech, B.Sc, BCA, MCA, M.Tech) with interest in IT careers.',
            'Basic logical thinking, computer fundamentals, and readiness to learn.'
          ] : [
            'Any Degree (B.E, B.Tech, B.Sc, BCA, MCA, M.Tech) with interest in IT careers.',
            'Basic logical thinking, computer fundamentals, and readiness to learn.',
            `Agreement to program terms: ${itProc.bondPeriod || '1 Year Bond'}.`,
            `${itProc.originalsRequired || 'Originals Need to Submit'} for document verification.`
          ],
          interviewSteps: (itProc.selectionSteps && itProc.selectionSteps.length > 0) ? itProc.selectionSteps : [
            { stepNumber: 1, title: 'Screening & Registration', description: 'Application review and initial profile shortlisting' },
            { stepNumber: 2, title: 'Technical Assessment', description: 'Basic coding, problem solving and aptitude round' },
            { stepNumber: 3, title: 'Technical & HR Interview', description: 'Discussion with hiring manager & interview clearance' },
            { stepNumber: 4, title: 'Batch Onboarding', description: 'Offer letter issuance, document submission, and training commencement' }
          ],
          trainingPhases: (itProc.trainingPhases && itProc.trainingPhases.length > 0) ? itProc.trainingPhases : (
            (itProc.trainingSubtext && itProc.trainingSubtext.includes('|')) ? [
              { title: 'Phase 1 Training', duration: itProc.trainingSubtext.split('|')[0].trim(), mode: 'Classroom Training', stipend: `STIPEND ₹${itProc.stipend || '12,000'}` },
              { title: 'Phase 2 Training', duration: itProc.trainingSubtext.split('|')[1].trim(), mode: 'Real Project Training (OJT)', stipend: `STIPEND ₹${itProc.stipend || '12,000'}` }
            ] : [
              { title: 'Phase 1 Training', duration: itProc.trainingPeriod || '3 Months', mode: 'Classroom Training', stipend: `STIPEND ₹${itProc.stipend || '12,000'}` },
              { title: 'Phase 2 Training', duration: '3 Months', mode: 'Real Project Training (OJT)', stipend: `STIPEND ₹${itProc.stipend || '12,000'}` }
            ]
          ),
          itProcessList: itProcesses.filter(p => (p.role || '').trim().toLowerCase() === (itProc.role || '').trim().toLowerCase() && (p.itCategory || 'Placement') === itCategory)
        });
      }

      return res.status(404).json({ error: 'Job not found.' });
    }

    const company = db.companies.find(c => c.id === job.companyId);
    const category = db.categories.find(cat => cat.id === job.categoryId);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let companyLogo = company ? (company.logo || '') : '';
    // Strip any localhost URLs stored in the DB (old/dev data)
    if (companyLogo.match(/^https?:\/\/localhost(:\d+)?/)) {
      companyLogo = companyLogo.replace(/^https?:\/\/localhost(:\d+)?/, baseUrl);
    } else if (companyLogo.startsWith('/')) {
      companyLogo = `${baseUrl}${companyLogo}`;
    }

    res.json({
      ...job,
      companyName: company ? company.name : 'Unknown Company',
      companyLogo,
      companyDescription: company ? company.description : '',
      companyWebsite: company ? company.website : '',
      categoryName: category ? category.name : 'Uncategorized'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job from MongoDB Atlas.' });
  }
});

// POST /api/jobs
router.post('/', async (req, res) => {
  try {
    const {
      companyId,
      categoryId,
      title,
      jobType = 'Full Time',
      location,
      experience,
      qualification,
      salary,
      trainingPeriod,
      trainingFee,
      feeRefundType,
      feeRefundDetails,
      interviewCrackFee,
      interviewFeeStage,
      interviewFeeDetails,
      ficTrainingPeriod,
      trainingDetails,
      trainingTitle,
      trainingSubtext,
      stipendTitle,
      stipendSubtext,
      salarySubtext,
      locationSubtext,
      trainingPhases = [],
      openings = 1,
      description,
      responsibilities = [],
      requirements = [],
      skills = [],
      interviewSteps = [],
      documentsRequired = [],
      lastDate,
      status = 'Active'
    } = req.body;

    if (!companyId || !categoryId || !title) {
      return res.status(400).json({ error: 'Company ID, Category ID, and Job Title are required.' });
    }

    const newJob = {
      id: 'job_' + Date.now(),
      companyId,
      categoryId,
      title,
      jobType,
      location: location || 'Flexible',
      experience: experience || '0 - 1 Years',
      qualification: qualification || 'Any Degree',
      salary: salary || 'As per industry standards',
      trainingPeriod: trainingPeriod || '',
      trainingFee: trainingFee || '',
      feeRefundType: feeRefundType || '',
      feeRefundDetails: feeRefundDetails || '',
      interviewCrackFee: interviewCrackFee || '',
      interviewFeeStage: interviewFeeStage || '',
      interviewFeeDetails: interviewFeeDetails || '',
      ficTrainingPeriod: ficTrainingPeriod || '',
      trainingDetails: trainingDetails || null,
      trainingTitle: trainingTitle || '',
      trainingSubtext: trainingSubtext || '',
      stipendTitle: stipendTitle || '',
      stipendSubtext: stipendSubtext || '',
      salarySubtext: salarySubtext || '',
      locationSubtext: locationSubtext || '',
      trainingPhases: Array.isArray(trainingPhases) ? trainingPhases : [],
      openings: Number(openings) || 1,
      description: description || '',
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      skills: Array.isArray(skills) ? skills : [],
      interviewSteps: Array.isArray(interviewSteps) ? interviewSteps : [],
      documentsRequired: Array.isArray(documentsRequired) ? documentsRequired : [],
      lastDate: lastDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status,
      createdAt: new Date().toISOString()
    };

    let savedJob = null;
    if (getIsMongoConnected()) {
      try {
        const created = await JobModel.create(newJob);
        savedJob = created ? created.toObject() : null;
        console.log('✅ New Job saved directly into MongoDB Atlas Cloud:', newJob.id);
      } catch (mongoErr) {
        console.warn('MongoDB create failed, falling back to local memory:', mongoErr.message);
      }
    }
    
    // Always sync to in-memory/disk store so it is instantly available
    savedJob = saveJobInMemory(savedJob || newJob);
    res.status(201).json(savedJob);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Failed to save job opening: ' + err.message });
  }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateObj = { ...req.body, updatedAt: new Date().toISOString() };
    let updated = null;

    if (getIsMongoConnected()) {
      try {
        updated = await JobModel.findOneAndUpdate({ id }, { $set: updateObj }, { new: true }).lean();
      } catch (mongoErr) {
        console.warn('MongoDB update failed, falling back to local memory:', mongoErr.message);
      }
    }

    // Always update in-memory store
    const memUpdated = updateJobInMemory(id, updateObj);
    const finalJob = updated || memUpdated;

    if (!finalJob) {
      return res.status(404).json({ error: 'Job opening not found.' });
    }

    res.json(finalJob);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Failed to update job opening.' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getIsMongoConnected()) {
      try {
        await JobModel.deleteOne({ id });
      } catch (mongoErr) {
        console.warn('MongoDB delete failed, falling back to local memory:', mongoErr.message);
      }
    }

    deleteJobInMemory(id);
    res.json({ message: 'Job opening deleted successfully.' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Failed to delete job opening.' });
  }
});

module.exports = router;

