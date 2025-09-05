gpu s# Finetuning (QLoRA) with LLaMA-Factory

This folder contains a minimal QLoRA SFT workflow using LLaMA-Factory.

## Data format
JSONL with lines like:
```
{"messages":[{"role":"system","content":"You are helpful."},{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello!"}]}
```

## Steps
1) Create venv and install requirements:
```
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
```
2) Prepare your dataset at `data/train.jsonl`.
3) Launch training:
```
llamafactory-cli train configs/llamafactory.yaml
```
4) Merge LoRA into base weights:
```
python merge_lora.py --base <BASE_MODEL_DIR_OR_ID> --lora <LORA_DIR> --out merged_model
```
5) Point `MODEL_ID=merged_model` in `.env` and restart the app.

For quick eval, hold out ~50 examples and run qualitative checks via the UI.


