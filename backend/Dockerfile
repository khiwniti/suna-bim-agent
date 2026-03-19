FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

ENV ENV_MODE production
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    # Python compilation tools
    build-essential \
    gcc \
    python3-dev \
    libffi-dev \
    # WeasyPrint dependencies (PDF generation)
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-dev \
    libfreetype6-dev \
    fontconfig \
    fonts-dejavu-core \
    fonts-liberation \
    # PostgreSQL client (psycopg)
    libpq-dev \
    # IFC/geometry support
    gfortran \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# Install ifcopenshell and BIM analysis libraries
RUN uv pip install --system ifcopenshell numpy networkx

# Install Python dependencies
COPY pyproject.toml uv.lock ./
ENV UV_LINK_MODE=copy
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked

# Copy application code
COPY . .

ENV PYTHONPATH=/app
EXPOSE 8000

# WORKERS and TIMEOUT are set via env variables at runtime (ECS task definition)
# Defaults: WORKERS=4 (2 per vCPU), TIMEOUT=75 (worker heartbeat - async workers stay alive during active streams)
CMD ["sh", "-c", "uv run gunicorn api:app -w ${WORKERS:-4} -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout ${TIMEOUT:-75} --graceful-timeout 30 --keep-alive 65"]
