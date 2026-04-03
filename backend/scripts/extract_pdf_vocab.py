import sys
import json
import re
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    print("PyPDF2 not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None
    return text

def parse_vocab_from_text(text):
    """Parse vocabulary words and definitions from extracted text"""
    vocab_list = []
    
    # Common patterns for vocab lists:
    # 1. Word - Definition
    # 2. Word: Definition
    # 3. Word (Definition)
    # 4. Number. Word - Definition
    
    lines = text.split('\n')
    current_word = None
    current_def = []
    
    for line in lines:
        line = line.strip()
        if not line:
            if current_word and current_def:
                vocab_list.append({
                    'word': current_word.strip(),
                    'definition': ' '.join(current_def).strip()
                })
                current_word = None
                current_def = []
            continue
        
        # Pattern: Word - Definition or Word: Definition
        match = re.match(r'^([A-Za-z]+(?:[\s\-][A-Za-z]+)*)\s*[-:]\s*(.+)$', line)
        if match:
            if current_word and current_def:
                vocab_list.append({
                    'word': current_word.strip(),
                    'definition': ' '.join(current_def).strip()
                })
            current_word = match.group(1)
            current_def = [match.group(2)]
            continue
        
        # Pattern: Number. Word - Definition
        match = re.match(r'^\d+\.\s*([A-Za-z]+(?:[\s\-][A-Za-z]+)*)\s*[-:]\s*(.+)$', line)
        if match:
            if current_word and current_def:
                vocab_list.append({
                    'word': current_word.strip(),
                    'definition': ' '.join(current_def).strip()
                })
            current_word = match.group(1)
            current_def = [match.group(2)]
            continue
        
        # Pattern: Just a word (might be continuation)
        if re.match(r'^[A-Za-z]+(?:[\s\-][A-Za-z]+)*$', line) and len(line.split()) <= 3:
            if current_word and current_def:
                vocab_list.append({
                    'word': current_word.strip(),
                    'definition': ' '.join(current_def).strip()
                })
            current_word = line
            current_def = []
            continue
        
        # Otherwise, treat as definition continuation
        if current_word:
            current_def.append(line)
    
    # Add last word if exists
    if current_word and current_def:
        vocab_list.append({
            'word': current_word.strip(),
            'definition': ' '.join(current_def).strip()
        })
    
    return vocab_list

def organize_into_groups(vocab_list, words_per_group=30):
    """Organize vocabulary into groups"""
    groups = []
    for i in range(0, len(vocab_list), words_per_group):
        group_words = vocab_list[i:i + words_per_group]
        groups.append({
            'groupNumber': len(groups) + 1,
            'words': group_words
        })
    return groups

if __name__ == "__main__":
    pdf_path = r"d:\TBD Courses\GregMat - Two-Month Study Plan\Week 1\2. Before you begin - Materials and Other Things\7.1. Greg Mat's Vocabulary List - PDF FORM.pdf"
    
    print(f"Extracting text from PDF: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    
    if not text:
        print("Failed to extract text from PDF")
        sys.exit(1)
    
    print("Parsing vocabulary...")
    vocab_list = parse_vocab_from_text(text)
    
    print(f"Found {len(vocab_list)} vocabulary words")
    
    # Save raw text for debugging
    with open('extracted_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    
    # Save parsed vocab
    with open('parsed_vocab.json', 'w', encoding='utf-8') as f:
        json.dump(vocab_list, f, indent=2, ensure_ascii=False)
    
    # Organize into groups
    groups = organize_into_groups(vocab_list, words_per_group=30)
    
    # Save groups
    with open('vocab_groups.json', 'w', encoding='utf-8') as f:
        json.dump(groups, f, indent=2, ensure_ascii=False)
    
    print(f"Organized into {len(groups)} groups")
    print(f"First few words: {vocab_list[:5]}")
    print("\nFiles created:")
    print("- extracted_text.txt (raw PDF text)")
    print("- parsed_vocab.json (parsed vocabulary)")
    print("- vocab_groups.json (organized groups)")
