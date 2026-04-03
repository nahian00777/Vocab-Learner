// Helper script to convert PDF to text using external tools
// This is a fallback when pdf-parse doesn't work due to Node version

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const pdfPath = process.argv[2];

if (!pdfPath) {
  console.log('Usage: node convert_pdf_to_text.js "path/to/file.pdf"');
  console.log('\nThis script will try to extract text using available tools:');
  console.log('1. pdftotext (if installed)');
  console.log('2. Python pdfplumber (if available)');
  console.log('3. Manual conversion instructions');
  process.exit(1);
}

if (!pdfPath.endsWith('.pdf')) {
  console.error('Error: File must be a PDF');
  process.exit(1);
}

const outputPath = pdfPath.replace('.pdf', '.txt');

// Try pdftotext (common on Linux/Mac, available on Windows via poppler)
console.log('Trying pdftotext...');
exec(`pdftotext "${pdfPath}" "${outputPath}"`, (error, stdout, stderr) => {
  if (!error) {
    console.log(`✅ Success! Text extracted to: ${outputPath}`);
    console.log(`\nNow run: node scripts/import_gregmat_pdf.js "${outputPath}"`);
    return;
  }
  
  // Try Python pdfplumber
  console.log('Trying Python pdfplumber...');
  const pythonScript = `
import sys
try:
    import pdfplumber
    with pdfplumber.open('${pdfPath.replace(/\\/g, '/')}') as pdf:
        text = ''
        for page in pdf.pages:
            text += page.extract_text() + '\\n'
        with open('${outputPath.replace(/\\/g, '/')}', 'w', encoding='utf-8') as f:
            f.write(text)
    print('SUCCESS')
except ImportError:
    print('pdfplumber not installed. Install with: pip install pdfplumber')
except Exception as e:
    print(f'ERROR: {e}')
`;
  
  fs.writeFileSync('temp_extract.py', pythonScript);
  exec('python temp_extract.py', (error, stdout, stderr) => {
    if (stdout.includes('SUCCESS')) {
      console.log(`✅ Success! Text extracted to: ${outputPath}`);
      console.log(`\nNow run: node scripts/import_gregmat_pdf.js "${outputPath}"`);
      fs.unlinkSync('temp_extract.py');
      return;
    }
    
    // Manual instructions
    console.log('\n❌ Automatic extraction failed.');
    console.log('\n📝 Manual conversion options:');
    console.log('1. Online converter: https://www.ilovepdf.com/pdf_to_txt');
    console.log('2. Install pdftotext:');
    console.log('   Windows: Download poppler from https://github.com/oschwartz10612/poppler-windows/releases');
    console.log('   Mac: brew install poppler');
    console.log('   Linux: sudo apt-get install poppler-utils');
    console.log('3. Install Python pdfplumber: pip install pdfplumber');
    console.log(`\nSave the text file and run: node scripts/import_gregmat_pdf.js "path/to/text.txt"`);
    
    if (fs.existsSync('temp_extract.py')) {
      fs.unlinkSync('temp_extract.py');
    }
  });
});
