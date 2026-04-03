const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const VocabMountain = require('../models/VocabMountain');

// Try to use pdf-parse if available, otherwise fall back to text file
let pdfParse;
try {
  // Check Node version first
  const nodeVersion = process.version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  const major = parseInt(nodeVersion[1]);
  const minor = parseInt(nodeVersion[2]);
  
  if (major > 20 || (major === 20 && minor >= 16)) {
    pdfParse = require('pdf-parse');
  } else {
    console.log(`⚠️  Node.js version ${process.version} detected. pdf-parse requires Node >=20.16.0`);
    console.log('   Will use text file instead. Please convert PDF to text first.\n');
  }
} catch (e) {
  console.log('⚠️  pdf-parse not available. Will use text file instead.');
  console.log('   To use PDF directly, upgrade Node.js to >=20.16.0 or convert PDF to text.\n');
}

async function extractTextFromPDF(pdfPath) {
  if (!pdfParse) {
    throw new Error('PDF parsing not available with current Node.js version');
  }
  
  try {
    const fs = require('fs');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    if (error.message.includes('getBuiltinModule') || error.message.includes('polyfill')) {
      throw new Error('PDF parsing failed due to Node.js version incompatibility');
    }
    throw error;
  }
}

function parseVocabFromText(text) {
  const vocabList = [];
  const lines = text.split('\n');
  
  let currentWord = null;
  let currentDef = [];
  let inDefinition = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentWord && currentDef.length > 0) {
        vocabList.push({
          word: currentWord.trim(),
          definition: currentDef.join(' ').trim(),
          synonyms: [],
          examples: []
        });
        currentWord = null;
        currentDef = [];
      }
      continue;
    }
    
    // Pattern 1: Number. Word - Definition or Word - Definition
    let match = line.match(/^(\d+\.\s*)?([A-Za-z]+(?:[\s\-'][A-Za-z]+)*)\s*[-:–—]\s*(.+)$/);
    if (match) {
      if (currentWord && currentDef.length > 0) {
        vocabList.push({
          word: currentWord.trim(),
          definition: currentDef.join(' ').trim(),
          synonyms: [],
          examples: []
        });
      }
      currentWord = match[2];
      currentDef = [match[3]];
      inDefinition = true;
      continue;
    }
    
    // Pattern 2: Just a word (capitalized, likely start of entry)
    if (/^[A-Z][a-z]+(?:[\s\-'][a-z]+)*$/.test(line) && line.split(/\s+/).length <= 3 && !inDefinition) {
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
      inDefinition = false;
      continue;
    }
    
    // Pattern 3: Line starting with lowercase or contains definition-like text
    if (currentWord) {
      // If line starts with lowercase or contains definition markers, it's part of definition
      if (/^[a-z]/.test(line) || /[;,]/.test(line) || line.length > 20) {
        currentDef.push(line);
        inDefinition = true;
      } else if (inDefinition) {
        // Continue definition
        currentDef.push(line);
      }
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
  
  // Filter out invalid entries
  return vocabList.filter(v => v.word && v.definition && v.word.length > 1);
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
    console.log('✅ MongoDB Connected\n');

    const pdfPath = process.argv[2];
    
    if (!pdfPath) {
      console.error('Usage: node import_gregmat_pdf.js "path/to/vocab.pdf"');
      console.error('\nOr provide a text file:');
      console.error('  node import_gregmat_pdf.js "path/to/vocab.txt"');
      process.exit(1);
    }

    let text;
    const fs = require('fs');
    
    if (pdfPath.endsWith('.pdf')) {
      if (!pdfParse) {
        console.error('\n❌ Cannot process PDF directly with current Node.js version.');
        console.log(`   Your Node.js version: ${process.version}`);
        console.log('   Required: >=20.16.0\n');
        console.log('📝 Solution: Convert PDF to text first:');
        console.log('   1. Use an online converter: https://www.ilovepdf.com/pdf_to_txt');
        console.log('   2. Or use: pdftotext "file.pdf" output.txt');
        console.log('   3. Then run: node scripts/import_gregmat_pdf.js "output.txt"\n');
        console.log('💡 Alternative: Upgrade Node.js to >=20.16.0 to use PDF directly');
        process.exit(1);
      }
      
      console.log(`📄 Extracting text from PDF: ${pdfPath}`);
      text = await extractTextFromPDF(pdfPath);
    } else {
      console.log(`📄 Reading text file: ${pdfPath}`);
      if (!fs.existsSync(pdfPath)) {
        console.error(`❌ File not found: ${pdfPath}`);
        process.exit(1);
      }
      text = fs.readFileSync(pdfPath, 'utf-8');
    }
    
    console.log('🔍 Parsing vocabulary...');
    const vocabList = parseVocabFromText(text);
    
    console.log(`\n📊 Found ${vocabList.length} vocabulary words`);
    
    if (vocabList.length === 0) {
      console.error('❌ No vocabulary words found.');
      console.log('\nThe PDF might need manual processing.');
      console.log('Try converting PDF to text first using an online converter.');
      process.exit(1);
    }
    
    // Show sample words
    console.log('\n📝 Sample words (first 5):');
    vocabList.slice(0, 5).forEach((v, i) => {
      const defPreview = v.definition.length > 60 
        ? v.definition.substring(0, 60) + '...' 
        : v.definition;
      console.log(`   ${i + 1}. ${v.word.padEnd(20)} - ${defPreview}`);
    });
    
    // Organize into groups
    const wordsPerGroup = 30;
    const groups = organizeIntoGroups(vocabList, wordsPerGroup);
    console.log(`\n📦 Organized into ${groups.length} groups (~${wordsPerGroup} words per group)`);
    
    // Check if mountain already exists
    const existing = await VocabMountain.findOne({ name: "Greg Mat's Vocabulary List" });
    if (existing) {
      console.log('\n⚠️  A mountain with this name already exists.');
      console.log('   Updating existing mountain...');
      existing.groups = groups;
      existing.totalDays = 34;
      await existing.save();
      console.log(`\n✅ Updated vocab mountain: "${existing.name}"`);
      console.log(`   Mountain ID: ${existing._id}`);
      console.log(`   Total words: ${vocabList.length}`);
      console.log(`   Total groups: ${groups.length}`);
    } else {
      // Create new mountain
      const mountain = new VocabMountain({
        name: "Greg Mat's Vocabulary List",
        description: "Complete vocabulary list from Greg Mat's study materials - 1000+ words",
        isDefault: false,
        totalDays: 34,
        groups: groups
      });
      
      await mountain.save();
      console.log(`\n✅ Successfully created vocab mountain: "${mountain.name}"`);
      console.log(`   Mountain ID: ${mountain._id}`);
      console.log(`   Total words: ${vocabList.length}`);
      console.log(`   Total groups: ${groups.length}`);
    }
    
    await mongoose.connection.close();
    console.log('\n🎉 Done! You can now access the vocab mountain in the app.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

createVocabMountain();
