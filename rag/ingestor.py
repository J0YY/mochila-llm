from __future__ import annotations
import os, json, glob
from typing import List
import faiss
from sentence_transformers import SentenceTransformer
from PyPDF2 import PdfReader

def read_texts(input_dir: str) -> List[str]:
    texts: List[str] = []
    for path in glob.glob(os.path.join(input_dir, '**', '*'), recursive=True):
        if os.path.isdir(path):
            continue
        if path.lower().endswith('.pdf'):
            try:
                reader = PdfReader(path)
                texts.append('\n'.join(page.extract_text() or '' for page in reader.pages))
            except Exception:
                pass
        elif any(path.lower().endswith(ext) for ext in ('.md','.txt','.markdown')):
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                texts.append(f.read())
    return texts

def build_index(texts: List[str], out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    embeddings = model.encode(texts, show_progress_bar=True)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    faiss.write_index(index, os.path.join(out_dir, 'index.faiss'))
    with open(os.path.join(out_dir, 'chunks.json'), 'w') as f:
        json.dump(texts, f)

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--input', required=True, help='Folder with .md/.txt/.pdf')
    p.add_argument('--out', default='rag_store')
    args = p.parse_args()
    texts = read_texts(args.input)
    build_index(texts, args.out)


