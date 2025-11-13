# ---------- builder ----------
FROM python:3.12-slim AS builder

LABEL maintainer="Kiran <you@example.com>"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build tools needed to compile some Python packages (only in builder)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     build-essential gcc pkg-config libmupdf-dev libpq-dev curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only requirements first to leverage layer caching
COPY requirements.txt /app/requirements.txt

# Upgrade pip and install dependencies
RUN python -m pip install --upgrade pip setuptools wheel \
  && pip install --no-cache-dir -r /app/requirements.txt

# Install Gunicorn (production WSGI server) if not already present in requirements
RUN pip install --no-cache-dir gunicorn

# Copy application source
COPY . /app

# Ensure files in builder have readable/executable perms
RUN chmod -R a+rX /app

# ---------- runtime ----------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install runtime-only system packages required by healthcheck / runtime libs
# libpq5 provides runtime postgres client libs; postgresql-client gives pg_isready
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     libpq5 postgresql-client curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for better security
RUN groupadd -r app && useradd -r -g app app

# Copy installed Python libs and app from builder; set ownership to 'app'
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder --chown=app:app /app /app

# Switch to non-root user
USER app

# Expose Django default port
EXPOSE 8000

# Health check (optional) - will use curl available in runtime
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:8000/ || exit 1

# Start Gunicorn server (adjust workers if needed)
CMD ["gunicorn", "gpt_resume.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
