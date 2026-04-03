#!/usr/bin/env python3
"""Extract text from PDF and save to text file"""

import sys
import pdfplumber

def extract_pdf_to_text(pdf_path, output_path):
    """Extract text from PDF and save to text file"""
    try:
        print(f"Reading PDF: {pdf_path}")
        with pdfplumber.open(pdf_path) as pdf:
            text_parts = []
            total_pages = len(pdf.pages)
            print(f"Found {total_pages} pages")
            
            for i, page in enumerate(pdf.pages, 1):
                print(f"Extracting page {i}/{total_pages}...", end='\r')
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            
            print(f"\nExtracted text from {len(text_parts)} pages")
            
            full_text = '\n'.join(text_parts)
            
            print(f"Writing to: {output_path}")
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            print(f"Success! Text saved to: {output_path}")
            print(f"   Total characters: {len(full_text)}")
            return True
            
    except FileNotFoundError:
        print(f"Error: PDF file not found: {pdf_path}")
        print("\nPlease check the file path and try again.")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf_text.py <pdf_path> [output_path]")
        print("\nExample:")
        print('  python extract_pdf_text.py "d:\\path\\to\\file.pdf"')
        print('  python extract_pdf_text.py "d:\\path\\to\\file.pdf" "output.txt"')
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else pdf_path.replace('.pdf', '.txt')
    
    if not pdf_path.lower().endswith('.pdf'):
        print("❌ Error: Input file must be a PDF (.pdf)")
        sys.exit(1)
    
    success = extract_pdf_to_text(pdf_path, output_path)
    sys.exit(0 if success else 1)
