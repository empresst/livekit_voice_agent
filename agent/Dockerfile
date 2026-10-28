# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.14
FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm-slim AS base

ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1
ENV HF_HOME=/app/.cache/huggingface
ENV TORCH_HOME=/app/.cache/torch

# --- Build stage ---
FROM base AS build

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better caching)
COPY pyproject.toml uv.lock ./
RUN mkdir -p src
RUN uv sync --locked

# Pre-download LiveKit model files
RUN uv run --module livekit.agents download-files

# Copy the rest of the code (including prisma/schema.prisma)
COPY . .

# Generate Prisma client (this was missing)
RUN uv run prisma generate

# --- Production stage ---
FROM base

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

COPY --from=build --chown=appuser:appuser /app /app
WORKDIR /app
USER appuser

CMD ["uv", "run", "src/agent.py", "start"]