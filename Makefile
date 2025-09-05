SHELL := /bin/bash
ENV_FILE ?= .env
include $(ENV_FILE)

.PHONY: setup dev up build stop clean test ui-install prisma-generate

ui-install:
	cd ui && corepack enable && corepack prepare pnpm@9.1.0 --activate || true && pnpm install || npm install

setup: ui-install
	python3 -m venv .venv || true
	. .venv/bin/activate && pip install -U pip && pip install -r rag/requirements.txt || true
	. .venv/bin/activate && pip install -r finetune/requirements.txt || true
	@echo "Checking GPU availability...";
	nvidia-smi >/dev/null 2>&1 && echo "NVIDIA GPU detected" || echo "No NVIDIA GPU detected (CPU/quantized fallback ok)"

dev:
	# start vLLM locally (bare-metal) and UI dev server concurrently
	./infra/run_vllm.sh &
	cd ui && pnpm run dev || npm run dev

up:
	docker compose up -d --build
	@echo "UI at http://localhost:3000 | OpenAI API at http://127.0.0.1:8000/v1"

build:
	docker compose build

stop:
	docker compose down || true
	pkill -f "vllm.entrypoints.api_server" || true

clean: stop
	docker volume rm local-gpt-oss_models || true
	rm -rf ui/node_modules ui/.next ui/.turbo || true
	rm -rf .venv || true

test:
	set -euo pipefail; \
	# ensure API is up
	if ! curl -s http://127.0.0.1:8000/v1/models | grep -q "models"; then \
		echo "Starting API (vLLM) for tests..."; \
		./infra/run_vllm.sh & sleep 5; \
	fi; \
	echo "Checking /v1/models"; \
	curl -s http://127.0.0.1:8000/v1/models | grep -q "models"; \
	echo "Chat roundtrip"; \
	RESP=$$(curl -s -X POST http://127.0.0.1:8000/v1/chat/completions \
	 -H 'Content-Type: application/json' \
	 -d '{"model":"'"$$MODEL_ID"'","messages":[{"role":"user","content":"Say hi."}],"stream":false}' ); \
	echo $$RESP | grep -q "choices" && echo "OK: chat response" || (echo $$RESP; exit 1)

.PHONY: chat-cli
chat-cli:
	cd cli && node chat.mjs --model $${MODEL_ID:-llama3:8b}


