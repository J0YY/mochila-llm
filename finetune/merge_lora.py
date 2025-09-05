from __future__ import annotations
import argparse, os
from transformers import AutoModelForCausalLM, AutoTokenizer

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', required=True)
    p.add_argument('--lora', required=True)
    p.add_argument('--out', required=True)
    args = p.parse_args()

    print('Loading base model...')
    model = AutoModelForCausalLM.from_pretrained(args.base, torch_dtype="auto")
    print('Merging LoRA...')
    model.load_adapter(args.lora)
    model.merge_and_unload()
    print('Saving merged model to', args.out)
    model.save_pretrained(args.out)
    tok = AutoTokenizer.from_pretrained(args.base, use_fast=True)
    tok.save_pretrained(args.out)

if __name__ == '__main__':
    main()


