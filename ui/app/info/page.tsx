import Link from 'next/link'

export const metadata = { title: "About • Joy's Local LLMs" }

export default function InfoPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">About this app</h1>
        <p className="text-sm text-gray-500">Local, offline-first assistant with an OpenAI-compatible API and a Next.js UI.</p>
        <div>
          <Link href="/" className="text-blue-600 hover:underline">← Back to chat</Link>
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><b>Backends</b>: Two local backends are supported.
            <ul className="list-[circle] pl-6">
              <li><b>Ollama / llama.cpp</b>: Runs quantized GGUF models on CPU/Apple GPU (Metal). Great on macOS. Exposes OpenAI-compatible <code>/v1</code> API at <code>http://127.0.0.1:11434/v1</code>.</li>
              <li><b>vLLM</b>: High-throughput GPU-first server for HF Transformers models (fp16/bf16). Exposes OpenAI-compatible API at <code>http://127.0.0.1:8000/v1</code>.</li>
            </ul>
          </li>
          <li><b>UI</b>: Next.js streams tokens from the backend via a server proxy (<code>/api/chat</code>) and saves messages to SQLite (Prisma).</li>
          <li><b>Persistence</b>: Threads/messages live in <code>ui/prisma/dev.db</code>. Export/import in the top bar.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Model formats and when to use which</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><b>Ollama models (GGUF)</b>: e.g., <code>llama3.2:3b-instruct</code>, <code>mistral:7b-instruct</code>. Pros: CPU-friendly, easy on macOS. Cons: peak quality trails larger fp16 models.</li>
          <li><b>HF Transformers models (fp16/bf16)</b>: e.g., <code>openai/gpt-oss-20b</code>. Pros: higher quality/contexts. Cons: needs a CUDA GPU for acceptable speed; large VRAM.</li>
          <li><b>Heuristic in this UI</b>: model names with a <code>:</code> use Ollama; names with a <code>/</code> use vLLM.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Why a GPU box?</h2>
        <p>
          vLLM is engineered for CUDA GPUs. A 20B model in fp16 typically needs 20–40 GB VRAM/RAM and massive memory bandwidth.
          On CPU it is 10–100× slower and often impractical. macOS lacks CUDA, so vLLM won’t accelerate there.
          For mac, prefer Ollama models; for larger Transformers models, point the UI at a Linux+CUDA host.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Switching backends and models</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Use the top bar <b>Model</b> dropdown to select a model. The UI auto-picks the backend (Ollama vs vLLM) from the name.</li>
          <li>For Ollama models:
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded"><code>ollama pull llama3.2:3b-instruct
ollama pull mistral:7b-instruct</code></pre>
          </li>
          <li>For vLLM on a GPU host (Linux):
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded"><code>export MODEL_ID=openai/gpt-oss-20b
vllm serve $MODEL_ID --host 0.0.0.0 --port 8000 \
  --download-dir /models --worker-use-ray=false</code></pre>
            Then set the UI base URL to point at that host (in <code>ui/.env.local</code> or via the top bar if exposed).</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Offline mode</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>After models are pulled once, you can disable networking. Ollama and vLLM serve from local cache.</li>
          <li>No telemetry is sent by this app; the API proxy blocks external domains.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Finetuning (QLoRA)</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Prepare data in <code>finetune/data/train.jsonl</code>:
            <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap"><code>{'{"messages":[{"role":"system","content":"You are helpful."},{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello!"}]}'}</code></pre>
          </li>
          <li>Create a Python 3.11 venv and install requirements (Linux/GPU recommended).</li>
          <li>Run LLaMA-Factory with the provided config: <code>finetune/configs/llamafactory.yaml</code>.</li>
          <li>Merge LoRA into base weights with <code>finetune/merge_lora.py</code> and set <code>MODEL_ID</code> to the merged folder for vLLM.
            Optionally convert/quantize to GGUF to run via Ollama.</li>
        </ol>
        <p className="text-sm text-gray-500">See <code>/finetune/README.md</code> in the repo for step-by-step commands.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">RAG (optional)</h2>
        <p>In <code>/rag</code> there is a simple FAISS-based ingestor and query service. When enabled, retrieved chunks are prepended to your prompt.</p>
      </section>

      <footer className="text-sm text-gray-500">Version 0.1 • Local-only by default • OpenAI-compatible API</footer>
    </div>
  )
}


