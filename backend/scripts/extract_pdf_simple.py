#!/usr/bin/env python3
"""Simple PDF to text extractor - just drag and drop your PDF file"""

import sys
import os
import pdfplumber

print("=" * 60)
print("PDF to Text Extractor for Greg Mat Vocabulary")
print("=" * 60)
print()

# Get PDF path
if len(sys.argv) > 1:
    pdf_path = sys.argv[1]
else:
    pdf_path = input("Enter the full path to your PDF file: ").strip().strip('"')

# Check if file exists
if not os.path.exists(pdf_path):
    print(f"\nError: File not found: {pdf_path}")
    print("\nPlease check the path and try again.")
    print("Tip: You can drag and drop the PDF file into this terminal window.")
    sys.exit(1)

# Output path
output_path = os.path.join(os.path.dirname(pdf_path), "gregmat_vocab.txt")
if len(sys.argv) > 2:
    output_path = sys.argv[2]

print(f"\nReading PDF: {os.path.basename(pdf_path)}")
print(f"Output will be saved to: {output_path}")
print()

try:
    with pdfplumber.open(pdf_path) as pdf:
        text_parts = []
        total_pages = len(pdf.pages)
        print(f"Found {total_pages} pages. Extracting text...")
        
        for i, page in enumerate(pdf.pages, 1):
            if i % 10 == 0 or i == total_pages:
                print(f"  Page {i}/{total_pages}...", end='\r')
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        
        print(f"\nExtracted text from {len(text_parts)} pages")
        
        full_text = '\n'.join(text_parts)
        
        print(f"Writing to: {output_path}")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_text)
        
        print(f"\nSuccess! Text saved to: {output_path}")
        print(f"Total characters: {len(full_text):,}")
        print(f"\nNow run this command to import:")
        print(f'  node scripts/import_gregmat_pdf.js "{output_path}"')
        
except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
