const express = require('express');
const router = express.Router();
const { CategoryModel, readDBAsync } = require('../db');

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const db = await readDBAsync();
    res.json(db.categories || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, status = 'Active' } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const newCat = {
      id: 'cat_' + Date.now(),
      name,
      description: description || '',
      icon: icon || 'Briefcase',
      status,
      createdAt: new Date().toISOString()
    };

    const saved = await CategoryModel.create(newCat);
    res.status(201).json(saved.toObject());
  } catch (err) {
    res.status(500).json({ error: 'Failed to save category into MongoDB Atlas.' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date().toISOString() };
    const updated = await CategoryModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category in MongoDB Atlas.' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CategoryModel.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.json({ message: 'Category deleted successfully from MongoDB Atlas.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category from MongoDB Atlas.' });
  }
});

module.exports = router;

