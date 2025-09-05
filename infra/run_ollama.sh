#!/usr/bin/env bash
set -euo pipefail

MODEL_TAG=${1:-"llama3:8b"}
PORT=${PORT:-11434}

if ! command -v ollama &>/dev/null; then
  echo "Please install Ollama from https://ollama.com/download"
  exit 1
fi

echo "Starting Ollama serve on port ${PORT}..."
OLLAMA_HOST=127.0.0.1 OLLAMA_ORIGINS=* ollama serve &
sleep 2
echo "Pulling model ${MODEL_TAG} (first time only)..."
ollama pull "${MODEL_TAG}" || true
echo "Ready: POST http://127.0.0.1:${PORT}/v1/chat/completions"
wait


