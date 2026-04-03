# Extract PDF to Text - Simple Guide

Since the PDF file path might be different, here's the easiest way to extract it:

## Method 1: Run the Python Script (Easiest)

1. **Open PowerShell in the backend folder:**
   ```powershell
   cd "d:\Projects 2026\Vocab Learner\backend\scripts"
   ```

2. **Run the script:**
   ```powershell
   python extract_pdf_simple.py
   ```

3. **When prompted, paste or drag-and-drop your PDF file path:**
   - You can drag the PDF file from Windows Explorer into the terminal
   - Or copy the full path and paste it

4. **The script will create `gregmat_vocab.txt`**

5. **Then import it:**
   ```powershell
   cd ..
   node scripts/import_gregmat_pdf.js scripts/gregmat_vocab.txt
   ```

## Method 2: Direct Command (If you know the exact path)

```powershell
cd "d:\Projects 2026\Vocab Learner\backend\scripts"
python extract_pdf_simple.py "FULL_PATH_TO_YOUR_PDF.pdf"
```

## Method 3: Online Converter (No Python needed)

1. Go to: https://www.ilovepdf.com/pdf_to_txt
2. Upload your PDF
3. Download the text file
4. Save it as `gregmat_vocab.txt` in the `backend` folder
5. Run:
   ```powershell
   cd "d:\Projects 2026\Vocab Learner\backend"
   node scripts/import_gregmat_pdf.js gregmat_vocab.txt
   ```

## Finding Your PDF File

If you're not sure where the PDF is:

1. Open Windows Explorer
2. Search for: `7.1. Greg Mat`
3. Note the full path
4. Use that path in the script

## After Extraction

Once you have the text file, the import script will:
- Parse all vocabulary words
- Create groups (30 words each)
- Save to your database
- Create "Greg Mat's Vocabulary List" mountain
