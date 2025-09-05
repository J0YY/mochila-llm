#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a; source .env; set +a
fi

MODEL_ID=${MODEL_ID:-"TinyLlama/TinyLlama-1.1B-Chat-v1.0"}
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-8000}

export HF_HOME=${HF_HOME:-"$ROOT_DIR/models"}
mkdir -p "$HF_HOME"

if ! command -v vllm &>/dev/null; then
  echo "Installing vLLM locally (user)..."
  python3 -m pip install --user --upgrade vllm==0.5.3.post1 transformers accelerate
fi

echo "Starting vLLM: $MODEL_ID on $HOST:$PORT"
export HF_HUB_OFFLINE=${HF_HUB_OFFLINE:-0}
exec python3 -m vllm.entrypoints.api_server \
  --model "$MODEL_ID" \
  --host "$HOST" \
  --port "$PORT" \
  --download-dir "$HF_HOME" \
  --worker-use-ray false


