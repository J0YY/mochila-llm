# syntax=docker/dockerfile:1.6
ARG BASE_IMAGE=nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04
FROM ${BASE_IMAGE} as base

ARG MODEL_ID
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/models \
    HF_HUB_ENABLE_HF_TRANSFER=1 \
    VLLM_WORKER_USE_RAY=false

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv python3-pip git curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel && \
    python3 -m pip install --no-cache-dir vllm==0.5.3.post1 transformers>=4.41.0 accelerate

RUN mkdir -p /models && chmod -R 777 /models

WORKDIR /app

# Optional: pre-seed model weights (internet required at build). Skip if MODEL_ID is local path.
RUN set -eux; \
 if echo "$MODEL_ID" | grep -q "/"; then \
   python3 - <<'PY' || true
from huggingface_hub import snapshot_download
import os
mid=os.environ.get('MODEL_ID')
if mid and '/' in mid:
    try:
        snapshot_download(repo_id=mid, local_dir='/models', local_dir_use_symlinks=False)
    except Exception as e:
        print('Skipping snapshot pre-download:', e)
PY
 ; fi

EXPOSE 8000
CMD ["bash","-lc","HF_HUB_OFFLINE=1 vllm serve ${MODEL_ID} --host 0.0.0.0 --port 8000 --download-dir /models --worker-use-ray=false"]


