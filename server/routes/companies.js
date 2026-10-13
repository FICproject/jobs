const express = require('express');
const router = express.Router();
const { CompanyModel, readDBAsync } = require('../db');

// GET /api/companies (optional query ?categoryId=xxx)
router.get('/', async (req, res) => {
  try {
    const { categoryId } = req.query;
    const db = await readDBAsync();
    let companies = db.companies || [];
    if (categoryId) {
      companies = companies.filter(c => c.categoryId === categoryId);
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formatted = companies.map(c => {
      let logo = c.logo || '';
      if (logo.startsWith('http://localhost:5000')) {
        logo = logo.replace('http://localhost:5000', baseUrl);
      } else if (logo.startsWith('/')) {
        logo = `${baseUrl}${logo}`;
      }
      return { ...c, logo };
    });
    res.json(formatted);
  } catch (err) {
    console.error('Companies fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch companies.' });
  }
});

// POST /api/companies
router.post('/', async (req, res) => {
  try {
    const { categoryId, name, logo, description, website, status = 'Active' } = req.body;
    if (!name || !categoryId) {
      return res.status(400).json({ error: 'Company name and category ID are required.' });
    }

    const newCompany = {
      id: 'comp_' + Date.now(),
      categoryId,
      name,
      logo: logo || '/logos/axis_bank.svg',
      description: description || '',
      website: website || '',
      status,
      createdAt: new Date().toISOString()
    };

    const saved = await CompanyModel.create(newCompany);
    res.status(201).json(saved.toObject());
  } catch (err) {
    res.status(500).json({ error: 'Failed to save company into MongoDB Atlas.' });
  }
});

// PUT /api/companies/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    const updated = await CompanyModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update company in MongoDB Atlas.' });
  }
});

// DELETE /api/companies/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CompanyModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }
    res.json({ message: 'Company deleted successfully from MongoDB Atlas.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete company from MongoDB Atlas.' });
  }
});

module.exports = router;

