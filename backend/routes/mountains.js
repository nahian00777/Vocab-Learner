const express = require('express');
const router = express.Router();
const VocabMountain = require('../models/VocabMountain');

// Get all vocab mountains
router.get('/', async (req, res) => {
  try {
    const mountains = await VocabMountain.find().sort({ createdAt: -1 });
    res.json(mountains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific vocab mountain
router.get('/:id', async (req, res) => {
  try {
    const mountain = await VocabMountain.findById(req.params.id);
    if (!mountain) {
      return res.status(404).json({ error: 'Vocab mountain not found' });
    }
    res.json(mountain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new vocab mountain
router.post('/', async (req, res) => {
  try {
    const { name, description, totalDays, groups } = req.body;
    const mountain = new VocabMountain({
      name,
      description,
      totalDays: totalDays || 34,
      groups: groups || []
    });
    await mountain.save();
    res.status(201).json(mountain);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a vocab mountain
router.put('/:id', async (req, res) => {
  try {
    const mountain = await VocabMountain.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!mountain) {
      return res.status(404).json({ error: 'Vocab mountain not found' });
    }
    res.json(mountain);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a vocab mountain
router.delete('/:id', async (req, res) => {
  try {
    const mountain = await VocabMountain.findByIdAndDelete(req.params.id);
    if (!mountain) {
      return res.status(404).json({ error: 'Vocab mountain not found' });
    }
    res.json({ message: 'Vocab mountain deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
