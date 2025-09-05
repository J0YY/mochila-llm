## Local LLMs: Offline ChatGPT-Style Assistant

## What to run for offline use really quickly
### Terminal 1 (Ollama):
OLLAMA_HOST=127.0.0.1 OLLAMA_ORIGINS='' ollama serve > /tmp/ollama_serve.log 2>&1 &
### Terminal 2 (UI):
cd /Users/joyyang/Projects/local-gpt-oss/ui
pnpm build
pnpm start
Open http://localhost:3000

### To free port 3000 (macOS/Linux):
lsof -ti:3000 | xargs kill -9 || true

### Or just run the UI on another port: 
PORT=3001 pnpm start


Local, offline assistant with OpenAI-compatible API at `http://127.0.0.1:8000/v1`, a fast Next.js UI, SQLite persistence, and optional RAG/finetuning.

### Requirements
- Node.js 20+
- Python 3.11+
- (Optional) NVIDIA GPU + drivers (for vLLM). CPU/quantized fallback via Ollama.

### Setup (bare-metal)
1) Copy `.env.example` to `.env` and set `MODEL_ID` (e.g., `TinyLlama/TinyLlama-1.1B-Chat-v1.0`).
2) Install and start:
```
make setup
make dev
```
Open `http://localhost:3000`.

### Setup (Docker)
```
make up
```
API: `http://127.0.0.1:8000/v1`, UI: `http://localhost:3000`.

### Change Model
Edit `.env` `MODEL_ID=...` and restart. After first download, the app runs offline.

### Make targets
```
make setup   # install UI deps, create Python venvs
make dev     # run local vLLM + Next.js dev server
make up      # docker-compose up (vLLM + UI)
make build   # docker build images
make stop    # stop services
make clean   # remove volumes, caches
make test    # basic API health + chat roundtrip
```

### Fully offline quickstart

Do this once online to cache models and build the UI. Afterward, you can disable networking.

- macOS (Ollama + UI):
  1) Install Ollama and pull a model
     - `brew install ollama`
     - `ollama pull llama3:8b`
  2) Build UI
     - `cd ui && pnpm install && pnpm build`
  3) Run completely offline
     - Turn off Wi‑Fi
     - `OLLAMA_HOST=127.0.0.1 OLLAMA_ORIGINS='*' ollama serve > /tmp/ollama_serve.log 2>&1 &`
     - `cd ui && OPENAI_BASE_URL=http://127.0.0.1:11434/v1 pnpm start`
     - Open `http://localhost:3000`

- GPU/Linux (vLLM + UI):
  1) Warm model cache
     - `pip install -U vllm transformers accelerate`
     - `HF_HOME=/models vllm serve <HF_MODEL_ID> --host 0.0.0.0 --port 8000 --download-dir /models --worker-use-ray=false`
  2) Build UI
     - `cd ui && pnpm install && pnpm build`
  3) Run offline
     - `export HF_HUB_OFFLINE=1`
     - `HF_HOME=/models vllm serve <HF_MODEL_ID> --host 0.0.0.0 --port 8000 --download-dir /models --worker-use-ray=false`
     - `cd ui && OPENAI_BASE_URL=http://127.0.0.1:8000/v1 pnpm start`

Notes
- The UI auto-routes to Ollama if the model name looks like `name:tag`, and to vLLM if it looks like `org/model`.
- SQLite lives at `ui/prisma/dev.db`. Export/import chats from the top bar.

### Notes
- Offline-first: After initial weights download, `HF_HUB_OFFLINE=1` prevents egress.
- Security: Localhost only. For remote access, add HTTPS + auth (not enabled by default).
- Troubleshooting: Port conflicts (change ports), CUDA mismatch (use CPU/ollama), context too long (UI truncates with confirmation).

## Local LLMs: Offline ChatGPT-Style Assistant

A fully offline, local ChatGPT-style assistant with an OpenAI-compatible API, a clean Next.js web UI, and optional RAG/finetuning workflows. Designed for simplicity, reliability, and reproducible local development.

### Highlights
- Offline-first after initial model downloads. No telemetry, no external calls during chat.
- OpenAI-compatible API at `http://127.0.0.1:8000/v1` (works with any OpenAI SDK).
- Streaming tokens to the UI with markdown + code highlighting.
- Local conversation storage via SQLite + export/import.
- Configurable system prompt + sampling params.
- Easy model swap via `MODEL_ID`, supports quantized weights (Ollama fallback).
- One-command lifecycle: `make dev`, `make build`, `make up`.

### Hardware Guidance
- 7B: 8–12 GB VRAM (GPU) or 16–32 GB RAM (CPU/quantized).
- 13B: 16–24 GB VRAM or 32–64 GB RAM (quantized).
- 20B+: 24–48 GB VRAM recommended. CPU-only works but will be slow.

### Quick Start (Bare-metal)
1) Install prerequisites: Node.js >= 20, pnpm or npm, Python 3.11+. GPU optional (CUDA if present).
2) Copy `.env.example` to `.env` and adjust `MODEL_ID`.
3) Run:

```
make setup
make dev
```

This starts vLLM locally and the Next.js UI. Visit `http://localhost:3000`.

### Quick Start (Docker)
```
make up
```
Starts vLLM and UI via docker-compose. To enable GPU on Linux: install NVIDIA Container Toolkit and run `make up` (compose will detect GPUs if available).

### Change Model
Edit `.env` and set `MODEL_ID` to a local path or HF id, then restart (`make stop && make dev` or `make up`).

### Offline Mode
After the first download, weights are kept locally. The stack runs with `HF_HUB_OFFLINE=1` to avoid egress. Confirm no network by disconnecting Wi‑Fi; chatting should still work.

### Troubleshooting
- Port conflicts: change `HOST/PORT` or UI port in `ui/package.json`.
- CUDA mismatch: ensure host drivers match container CUDA base, or run CPU/quantized fallback via Ollama.
- Context too long: the UI truncates with confirmation when exceeding `CONTEXT_LENGTH`.

### Security Note
By default, everything binds to localhost. For remote access, place behind HTTPS and add authentication (left to user; see comments in `docker-compose.yml`).

### Project Layout
See repository tree and inline docs in each directory:

```
/local-gpt-oss/
  README.md
  Makefile
  .env.example
  docker-compose.yml
  /infra/
    vllm.Dockerfile
    ollama.Dockerfile
    run_vllm.sh
    run_ollama.sh
  /ui/
    ... Next.js app (App Router) with Tailwind, Prisma/SQLite, API proxy ...
  /server/
    openai-types.ts
  /rag/
    ingestor.py, query.py, requirements.txt
  /finetune/
    README.md, data/README.md, configs/llamafactory.yaml, merge_lora.py
```

### Make Targets
```
make setup   # install Node deps, create Python venvs, basic checks
make dev     # run local vLLM + Next.js dev server
make up      # docker-compose up (vLLM + UI)
make build   # docker build images
make stop    # stop services
make clean   # remove volumes, caches
make test    # basic API health + chat roundtrip test
```


