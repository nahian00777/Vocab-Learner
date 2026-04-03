# Import Greg Mat's Vocabulary List

This guide will help you import Greg Mat's vocabulary list from the PDF into your Vocab Mountain app.

## Option 1: Direct PDF Import (Recommended)

1. **Install the PDF parsing library:**
   ```bash
   cd backend
   npm install pdf-parse
   ```

2. **Run the import script:**
   ```bash
   npm run import-gregmat "d:\TBD Courses\GregMat - Two-Month Study Plan\Week 1\2. Before you begin - Materials and Other Things\7.1. Greg Mat's Vocabulary List - PDF FORM.pdf"
   ```

   Or use the direct path:
   ```bash
   node scripts/import_gregmat_pdf.js "path/to/your/vocab.pdf"
   ```

## Option 2: Convert PDF to Text First

If the PDF import doesn't work well, you can convert the PDF to text first:

1. **Convert PDF to text:**
   - Use an online PDF to text converter (like https://www.ilovepdf.com/pdf_to_txt)
   - Or use command line: `pdftotext "file.pdf" output.txt`
   - Save the text file

2. **Import the text file:**
   ```bash
   node scripts/import_gregmat_pdf.js "path/to/vocab.txt"
   ```

## What the Script Does

1. ✅ Extracts text from PDF (or reads text file)
2. ✅ Parses vocabulary words and definitions
3. ✅ Organizes words into groups (30 words per group)
4. ✅ Creates a new vocab mountain called "Greg Mat's Vocabulary List"
5. ✅ Saves everything to MongoDB

## Troubleshooting

- **"pdf-parse not installed"**: Run `npm install pdf-parse` in the backend directory
- **"No vocabulary words found"**: The PDF format might be complex. Try converting to text first
- **"File not found"**: Check the file path - use quotes around paths with spaces
- **Parsing issues**: The script tries to detect word-definition patterns, but complex PDFs may need manual cleanup

## After Import

Once imported, you'll see "Greg Mat's Vocabulary List" in your app. You can:
- Start learning immediately
- Add synonyms/examples to words
- Organize into different groups if needed
- Use shuffle features to test yourself

## Notes

- The script organizes words into groups of 30
- If a mountain with the same name exists, it will update it
- All words start with empty synonyms and examples (you can add them later)
