const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const VocabMountain = require('../models/VocabMountain');

// This script requires the PDF to be converted to text first
// You can use: pdftotext "path/to/file.pdf" output.txt
// Or use an online PDF to text converter

async function parseVocabFromText(text) {
  const vocabList = [];
  const lines = text.split('\n');
  
  let currentWord = null;
  let currentDef = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (currentWord && currentDef.length > 0) {
        vocabList.push({
          word: currentWord.trim(),
          definition: currentDef.join(' ').trim(),
          synonyms: [],
          examples: []
        });
      }
      currentWord = null;
      currentDef = [];
      continue;
    }
    
    // Pattern: Word - Definition or Word: Definition
    const match1 = line.match(/^([A-Za-z]+(?:[\s\-'][A-Za-z]+)*)\s*[-:]\s*(.+)$/);
    if (match1) {
      if (currentWord && currentDef.length > 0) {
        vocabList.push({
          word: currentWord.trim(),
          definition: currentDef.join(' ').trim(),
          synonyms: [],
          examples: []
        });
      }
      currentWord = match1[1];
      currentDef = [match1[2]];
      continue;
    }
    
    // Pattern: Number. Word - Definition
    const match2 = line.match(/^\d+\.\s*([A-Za-z]+(?:[\s\-'][A-Za-z]+)*)\s*[-:]\s*(.+)$/);
    if (match2) {
      if (currentWord && currentDef.length > 0) {
        vocabList.push({
          word: currentWord.trim(),
          definition: currentDef.join(' ').trim(),
          synonyms: [],
          examples: []
        });
      }
      currentWord = match2[1];
      currentDef = [match2[2]];
      continue;
    }
    
    // Pattern: Just a word (might be standalone or start of entry)
    if (/^[A-Za-z]+(?:[\s\-'][A-Za-z]+)*$/.test(line) && line.split(/\s+/).length <= 3) {
      if (currentWord && currentDef.length > 0) {
        vocabList.push({
          word: currentWord.trim(),
          definition: currentDef.join(' ').trim(),
          synonyms: [],
          examples: []
        });
      }
      currentWord = line;
      currentDef = [];
      continue;
    }
    
    // Otherwise, treat as definition continuation
    if (currentWord) {
      currentDef.push(line);
    }
  }
  
  // Add last word if exists
  if (currentWord && currentDef.length > 0) {
    vocabList.push({
      word: currentWord.trim(),
      definition: currentDef.join(' ').trim(),
      synonyms: [],
      examples: []
    });
  }
  
  return vocabList;
}

function organizeIntoGroups(vocabList, wordsPerGroup = 30) {
  const groups = [];
  for (let i = 0; i < vocabList.length; i += wordsPerGroup) {
    const groupWords = vocabList.slice(i, i + wordsPerGroup);
    groups.push({
      groupNumber: groups.length + 1,
      words: groupWords
    });
  }
  return groups;
}

async function createVocabMountain() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Read text file (user needs to convert PDF to text first)
    const textFilePath = process.argv[2] || path.join(__dirname, 'gregmat_vocab.txt');
    
    if (!fs.existsSync(textFilePath)) {
      console.error(`\nError: Text file not found at: ${textFilePath}`);
      console.log('\nPlease convert the PDF to text first:');
      console.log('1. Use an online PDF to text converter');
      console.log('2. Or use pdftotext command: pdftotext "path/to/file.pdf" gregmat_vocab.txt');
      console.log('3. Save the text file as: backend/scripts/gregmat_vocab.txt');
      console.log('\nOr provide the path as an argument:');
      console.log('  node import_gregmat_vocab.js "path/to/vocab.txt"');
      process.exit(1);
    }

    console.log(`Reading text file: ${textFilePath}`);
    const text = fs.readFileSync(textFilePath, 'utf-8');
    
    console.log('Parsing vocabulary...');
    const vocabList = parseVocabFromText(text);
    
    console.log(`Found ${vocabList.length} vocabulary words`);
    
    if (vocabList.length === 0) {
      console.error('No vocabulary words found. Please check the text file format.');
      process.exit(1);
    }
    
    // Show first few words for verification
    console.log('\nFirst 5 words:');
    vocabList.slice(0, 5).forEach((v, i) => {
      console.log(`${i + 1}. ${v.word} - ${v.definition.substring(0, 50)}...`);
    });
    
    // Organize into groups (30 words per group)
    const groups = organizeIntoGroups(vocabList, 30);
    console.log(`\nOrganized into ${groups.length} groups (${vocabList.length} total words)`);
    
    // Create vocab mountain
    const mountain = new VocabMountain({
      name: "Greg Mat's Vocabulary List",
      description: "Complete vocabulary list from Greg Mat's study materials",
      isDefault: false,
      totalDays: 34,
      groups: groups
    });
    
    await mountain.save();
    console.log(`\n✅ Successfully created vocab mountain: "${mountain.name}"`);
    console.log(`   Mountain ID: ${mountain._id}`);
    console.log(`   Total words: ${vocabList.length}`);
    console.log(`   Total groups: ${groups.length}`);
    
    await mongoose.connection.close();
    console.log('\nDone!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createVocabMountain();
