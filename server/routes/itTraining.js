const express = require('express');
const router = express.Router();
const { ItTrainingProcessModel, readDBAsync } = require('../db');

// GET /api/it-training-processes
router.get('/', async (req, res) => {
  try {
    const db = await readDBAsync();
    const processes = (db.itTrainingProcesses || []).filter(p => (p.status || 'Active') === 'Active');
    res.json(processes);
  } catch (err) {
    console.error('IT processes fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch IT training processes.' });
  }
});

// GET /api/it-training-processes/all (for admin)
router.get('/all', async (req, res) => {
  try {
    const db = await readDBAsync();
    res.json(db.itTrainingProcesses || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch IT training processes.' });
  }
});

// POST /api/it-training-processes
router.post('/', async (req, res) => {
  try {
    const {
      processName,
      itCategory,
      programTitle,
      role,
      salary,
      location,
      trainingPeriod,
      trainingSubtext,
      stipend,
      stipendSubtext,
      trainingFee,
      feeSubtext,
      bondPeriod,
      originalsRequired,
      description,
      trainingPhases,
      selectionSteps,
      order,
      status = 'Active'
    } = req.body;

    if (!processName) {
      return res.status(400).json({ error: 'Process name is required (e.g. PROCESS 1).' });
    }

    const count = await ItTrainingProcessModel.countDocuments();
    const newProcess = {
      id: 'it_proc_' + Date.now(),
      processName: processName.trim(),
      itCategory: itCategory || 'Placement',
      programTitle: programTitle || 'FIC IT Training & 100% Placement Programme',
      role: role || 'Software Engineer Trainee',
      salary: salary || '3.5 - 5.0 LPA',
      location: location || 'PAN INDIA / Chennai / Bangalore',
      trainingPeriod: trainingPeriod || '6 Months',
      trainingSubtext: trainingSubtext || '3 Months Classroom Training | 3 Months Real Project Training',
      stipend: stipend || '12,000',
      stipendSubtext: stipendSubtext || 'Stipend ₹12,000 per month during training',
      trainingFee: trainingFee || '1.6 LPA',
      feeSubtext: feeSubtext || 'Training Program Cost',
      bondPeriod: bondPeriod || '1 Year Bond',
      originalsRequired: originalsRequired || 'Originals Need to Submit',
      description: description || '',
      trainingPhases: trainingPhases || [],
      selectionSteps: selectionSteps || [
        { stepNumber: 1, title: 'Screening & Registration', description: 'Application review and initial profile shortlisting' },
        { stepNumber: 2, title: 'Technical Assessment', description: 'Basic coding, problem solving and aptitude round' },
        { stepNumber: 3, title: 'Technical & HR Interview', description: 'Discussion with hiring manager & interview clearance' },
        { stepNumber: 4, title: 'Batch Onboarding', description: 'Offer letter issuance, document submission, and training commencement' }
      ],
      order: order !== undefined ? Number(order) : count + 1,
      status,
      createdAt: new Date().toISOString()
    };

    const saved = await ItTrainingProcessModel.create(newProcess);
    res.status(201).json(saved.toObject());
  } catch (err) {
    res.status(500).json({ error: 'Failed to create IT training process: ' + err.message });
  }
});

// PUT /api/it-training-processes/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    const updated = await ItTrainingProcessModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'IT training process not found.' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update IT training process: ' + err.message });
  }
});

// DELETE /api/it-training-processes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ItTrainingProcessModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'IT training process not found.' });
    }
    res.json({ message: 'IT training process deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete IT training process.' });
  }
});

module.exports = router;
