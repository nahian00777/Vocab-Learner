const express = require('express');
const router = express.Router();
const VocabMountain = require('../models/VocabMountain');

// Add a word to a specific group in a mountain
router.post('/:mountainId/:groupNumber', async (req, res) => {
  try {
    const { mountainId, groupNumber } = req.params;
    const { word, definition, synonyms, examples } = req.body;

    const mountain = await VocabMountain.findById(mountainId);
    if (!mountain) {
      return res.status(404).json({ error: 'Vocab mountain not found' });
    }

    let group = mountain.groups.find(g => g.groupNumber === parseInt(groupNumber));
    
    if (!group) {
      // Create new group if it doesn't exist
      group = {
        groupNumber: parseInt(groupNumber),
        words: []
      };
      mountain.groups.push(group);
    }

    group.words.push({
      word,
      definition,
      synonyms: synonyms || [],
      examples: examples || []
    });

    await mountain.save();
    res.json(mountain);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a word in a specific group
router.put('/:mountainId/:groupNumber/:wordIndex', async (req, res) => {
  try {
    const { mountainId, groupNumber, wordIndex } = req.params;
    const updates = req.body;

    const mountain = await VocabMountain.findById(mountainId);
    if (!mountain) {
      return res.status(404).json({ error: 'Vocab mountain not found' });
    }

    const group = mountain.groups.find(g => g.groupNumber === parseInt(groupNumber));
    const index = parseInt(wordIndex);
    if (!group || !group.words[index]) {
      return res.status(404).json({ error: 'Word not found' });
    }

    Object.assign(group.words[index], updates);
    await mountain.save();
    res.json(mountain);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a word from a specific group
router.delete('/:mountainId/:groupNumber/:wordIndex', async (req, res) => {
  try {
    const { mountainId, groupNumber, wordIndex } = req.params;

    const mountain = await VocabMountain.findById(mountainId);
    if (!mountain) {
      return res.status(404).json({ error: 'Vocab mountain not found' });
    }

    const group = mountain.groups.find(g => g.groupNumber === parseInt(groupNumber));
    const index = parseInt(wordIndex);
    if (!group || !group.words[index]) {
      return res.status(404).json({ error: 'Word not found' });
    }

    group.words.splice(index, 1);
    
    // Remove group if it's empty
    if (group.words.length === 0) {
      mountain.groups = mountain.groups.filter(g => g.groupNumber !== parseInt(groupNumber));
    }

    await mountain.save();
    res.json(mountain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
