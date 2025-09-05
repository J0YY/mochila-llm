FROM ollama/ollama:latest

ENV OLLAMA_ORIGINS=*
EXPOSE 11434

# Optionally pre-pull a model (requires network at build time). Safe to skip.
ARG OLLAMA_MODEL=gpt-oss:7b
RUN ollama serve & sleep 2 && (ollama pull ${OLLAMA_MODEL} || true) && pkill ollama || true

CMD ["ollama","serve"]


