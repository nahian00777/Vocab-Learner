const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');

// Get or create user progress for a mountain
router.get('/:mountainId', async (req, res) => {
  try {
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      progress = new UserProgress({
        mountainId: req.params.mountainId,
        currentDay: 1
      });
      await progress.save();
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update current day
router.patch('/:mountainId/day', async (req, res) => {
  try {
    const { currentDay } = req.body;
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      progress = new UserProgress({ mountainId: req.params.mountainId });
    }
    
    progress.currentDay = currentDay;
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update word status
router.patch('/:mountainId/word-status', async (req, res) => {
  try {
    const { word, status, dayLearned } = req.body;
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      progress = new UserProgress({ mountainId: req.params.mountainId });
    }
    
    const wordIndex = progress.wordStatuses.findIndex(ws => ws.word === word);
    
    if (wordIndex >= 0) {
      progress.wordStatuses[wordIndex].status = status;
      if (dayLearned) {
        progress.wordStatuses[wordIndex].dayLearned = dayLearned;
      }
    } else {
      progress.wordStatuses.push({
        word,
        status,
        dayLearned: dayLearned || progress.currentDay
      });
    }
    
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset word status
router.patch('/:mountainId/reset-word', async (req, res) => {
  try {
    const { word } = req.body;
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    progress.wordStatuses = progress.wordStatuses.filter(ws => ws.word !== word);
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset day progress
router.patch('/:mountainId/reset-day', async (req, res) => {
  try {
    const { day } = req.body;
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    // Reset all words learned on this day
    progress.wordStatuses = progress.wordStatuses.filter(ws => ws.dayLearned !== day);
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset everything
router.patch('/:mountainId/reset-all', async (req, res) => {
  try {
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    progress.currentDay = 1;
    progress.wordStatuses = [];
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update settings
router.patch('/:mountainId/settings', async (req, res) => {
  try {
    const settings = req.body;
    let progress = await UserProgress.findOne({ mountainId: req.params.mountainId });
    
    if (!progress) {
      progress = new UserProgress({ mountainId: req.params.mountainId });
    }
    
    progress.settings = { ...progress.settings, ...settings };
    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
