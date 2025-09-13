# Backend Dockerfile - Production (Flask + Gunicorn)

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps first for better caching
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . /app

# Expose Flask port defined in config (default 5002)
EXPOSE 5002

# Gunicorn config
ENV GUNICORN_WORKERS=3 \
    GUNICORN_BIND=0.0.0.0:5002 \
    GUNICORN_TIMEOUT=120

# Use gunicorn to serve Flask app factory (env-expanded via shell)
# Module path: main:create_app
CMD sh -c "gunicorn -w ${GUNICORN_WORKERS:-3} -b ${GUNICORN_BIND:-0.0.0.0:5002} --timeout ${GUNICORN_TIMEOUT:-120} 'main:create_app()'"


