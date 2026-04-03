const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const VocabMountain = require('../models/VocabMountain');

/**
 * Parses vocab.txt into structured groups.
 *
 * The file format uses blank lines to separate everything:
 *   Group N          ← group header
 *                    ← blank
 *   abound be present in large quantities   ← new word
 *                    ← blank
 *   austere 1. (of a person) strict...      ← new word with numbered def
 *                    ← blank
 *   2. (of living conditions) lacking...    ← continuation (numbered)
 *                    ← blank
 *   advocate support; be in favor of        ← new word
 *                    ← blank
 *   someone who supports a cause...         ← continuation (un-numbered)
 *
 * Strategy: split into blank-line-separated blocks, then classify each block.
 */
function parseVocabFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  // Step 1: Collect non-empty blocks (each block is one or more consecutive non-blank lines)
  const blocks = [];
  let currentBlock = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.map(l => l.trim()).join(' '));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.map(l => l.trim()).join(' '));
  }

  // Step 2: Classify each block and build groups
  const groups = [];
  let currentGroup = null;
  let currentWord = null;

  for (const block of blocks) {
    // Is it a group header?  e.g. "Group 1"
    const groupMatch = block.match(/^Group\s+(\d+)$/i);
    if (groupMatch) {
      // Finalize previous word
      if (currentWord && currentGroup) {
        currentGroup.words.push(finalizeWord(currentWord));
        currentWord = null;
      }
      currentGroup = { groupNumber: parseInt(groupMatch[1], 10), words: [] };
      groups.push(currentGroup);
      continue;
    }

    if (!currentGroup) continue;

    // Is it a numbered continuation?  e.g. "2. (of living conditions) lacking luxury"
    if (/^\d+\.\s/.test(block) && currentWord) {
      currentWord.definition += '\n' + block;
      continue;
    }

    // Is it an un-numbered continuation?
    // These start with lowercase or '(' and are NOT a vocab entry.
    // A vocab entry always has a single word first, then a definition.
    // Continuations are full phrases like "someone who supports a cause"
    // or "(of a thing) responsive to".
    // Detect: if block starts with '(' it's always a continuation.
    if (/^\(/.test(block) && currentWord) {
      currentWord.definition += ' ' + block;
      continue;
    }

    // For lines starting with a lowercase letter, we need to distinguish
    // "advocate support; be in favor of" (new word) from
    // "someone who supports a cause" (continuation).
    //
    // Rule: a new word entry's first token is a single vocab word, and the
    // second token onwards forms the definition. We check: if the first
    // space-separated token does NOT look like a standalone vocab word
    // (i.e., the "definition" part after it doesn't parse well, or the
    // first token is a common English word used in continuations), treat
    // as continuation.
    //
    // Simplest reliable heuristic that works for this file:
    // If the block starts with a word that is NOT followed by something that
    // looks like a definition start (a verb, adj, noun phrase), it's a
    // continuation. But that's hard to detect.
    //
    // Better heuristic: vocab words in this file have definitions that begin
    // with known patterns. But the BEST approach for THIS specific file:
    // a continuation phrase has its first word be a common article/pronoun/
    // preposition ("a", "an", "the", "someone", "not", "having", "being").
    // A vocab entry word would never be one of these.
    const firstToken = block.split(/\s+/)[0].toLowerCase();
    const continuationStarters = [
      'a', 'an', 'the', 'someone', 'not', 'having', 'being', 'to',
      'showing', 'lacking', 'giving', 'causing', 'making', 'expressing',
      'one', 'that', 'done', 'used'
    ];

    if (currentWord && continuationStarters.includes(firstToken)) {
      currentWord.definition += ' ' + block;
      continue;
    }

    // Otherwise, this is a new word entry.
    // Finalize previous word.
    if (currentWord && currentGroup) {
      currentGroup.words.push(finalizeWord(currentWord));
    }

    // Parse: first token = word, rest = definition
    const spaceIndex = block.indexOf(' ');
    if (spaceIndex === -1) {
      currentWord = { word: block, definition: '' };
    } else {
      currentWord = {
        word: block.substring(0, spaceIndex),
        definition: block.substring(spaceIndex + 1).trim()
      };
    }
  }

  // Finalize last word
  if (currentWord && currentGroup) {
    currentGroup.words.push(finalizeWord(currentWord));
  }

  return groups;
}

function finalizeWord(wordObj) {
  // Clean up the definition — join multi-line definitions nicely
  let def = wordObj.definition
    .replace(/\n/g, '; ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  if (def.length > 0) {
    def = def.charAt(0).toUpperCase() + def.slice(1);
  }

  return {
    word: wordObj.word.toLowerCase().trim(),
    definition: def,
    synonyms: [],
    examples: []
  };
}

async function seedGregmat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Parse vocab.txt
    const vocabPath = path.join(__dirname, '..', '..', 'vocab.txt');
    if (!fs.existsSync(vocabPath)) {
      console.error('❌ vocab.txt not found at:', vocabPath);
      process.exit(1);
    }

    console.log('📖 Parsing vocab.txt...');
    const groups = parseVocabFile(vocabPath);

    console.log(`📊 Found ${groups.length} groups:`);
    let totalWords = 0;
    groups.forEach(g => {
      console.log(`   Group ${g.groupNumber}: ${g.words.length} words`);
      totalWords += g.words.length;
    });
    console.log(`   Total: ${totalWords} words`);

    // Check if GregMAT mountain already exists
    const existing = await VocabMountain.findOne({ name: 'GregMAT Vocabulary' });
    if (existing) {
      console.log('\n⚠️  GregMAT mountain already exists. Replacing...');
      await VocabMountain.deleteOne({ _id: existing._id });
    }

    // Create the mountain
    const gregmatMountain = new VocabMountain({
      name: 'GregMAT Vocabulary',
      description: 'Complete GregMAT GRE vocabulary word list — 32 groups, 900+ words',
      isDefault: true,
      totalDays: 34,
      groups: groups
    });

    await gregmatMountain.save();
    console.log('\n🏔️  GregMAT Vocabulary mountain created successfully!');
    console.log(`   ID: ${gregmatMountain._id}`);
    console.log(`   Groups: ${groups.length}`);
    console.log(`   Total words: ${totalWords}`);

    await mongoose.connection.close();
    console.log('\n✅ Done! You can now see the mountain in the app.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding GregMAT data:', error);
    process.exit(1);
  }
}

seedGregmat();
