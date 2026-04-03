# Quick Fix: Import PDF Vocabulary

## The Problem
Your Node.js version (v20.11.0) is too old for `pdf-parse` which requires >=20.16.0.

## Solution: Convert PDF to Text First

### Option 1: Online Converter (Easiest)
1. Go to https://www.ilovepdf.com/pdf_to_txt
2. Upload your PDF: `7.1. Greg Mat's Vocabulary List - PDF FORM.pdf`
3. Download the text file
4. Save it as `gregmat_vocab.txt` in the `backend` folder
5. Run:
   ```bash
   cd backend
   node scripts/import_gregmat_pdf.js gregmat_vocab.txt
   ```

### Option 2: Use Python (If you have Python)
```bash
pip install pdfplumber
python -c "import pdfplumber; pdf = pdfplumber.open('"d:\TBD Courses\GregMat - Two-Month Study Plan\Week 1\2. Before you begin - Materials and Other Things\7.1. Greg Mat's Vocabulary List - PDF FORM.pdf"'); text = '\n'.join([p.extract_text() for p in pdf.pages]); open('gregmat_vocab.txt', 'w', encoding='utf-8').write(text)"
```

Then import:
```bash
cd backend
node scripts/import_gregmat_pdf.js gregmat_vocab.txt
```

### Option 3: Upgrade Node.js (For Future)
1. Download Node.js 20.16.0+ from https://nodejs.org/
2. Install it
3. Then PDF import will work directly

## After Converting to Text

Once you have the text file, run:
```bash
cd "d:\Projects 2026\Vocab Learner\backend"
node scripts/import_gregmat_pdf.js "path/to/your/textfile.txt"
```

The script will:
- ✅ Parse all vocabulary words and definitions
- ✅ Organize into groups (30 words per group)
- ✅ Create "Greg Mat's Vocabulary List" mountain
- ✅ Save to your database

## Expected Text Format

The script works best with text that looks like:
```
abound - to exist in great quantities
adulterate - to make impure by adding inferior materials
abate - to reduce in amount, degree, or intensity
```

Or:
```
1. abound - to exist in great quantities
2. adulterate - to make impure by adding inferior materials
```

Any format with "word - definition" or "word: definition" will work!
