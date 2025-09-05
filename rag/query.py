from __future__ import annotations
import os, json
from typing import List
import faiss
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

class Query(BaseModel):
  q: str
  k: int = 4

app = FastAPI()

INDEX_PATH = os.environ.get('RAG_INDEX', 'rag_store/index.faiss')
CHUNKS_PATH = os.environ.get('RAG_CHUNKS', 'rag_store/chunks.json')
_index = None
_chunks: List[str] = []
_encoder = None

def ensure_loaded():
  global _index, _chunks, _encoder
  if _index is None:
    _index = faiss.read_index(INDEX_PATH)
    with open(CHUNKS_PATH, 'r') as f:
      _chunks = json.load(f)
    _encoder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

@app.post('/rag/query')
def rag_query(q: Query):
  ensure_loaded()
  emb = _encoder.encode([q.q])
  scores, idxs = _index.search(emb, q.k)
  results = [{ 'text': _chunks[i], 'score': float(scores[0][j]) } for j, i in enumerate(idxs[0])]
  return { 'results': results }

if __name__ == '__main__':
  uvicorn.run(app, host='127.0.0.1', port=5555)


