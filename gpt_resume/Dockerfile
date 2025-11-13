# ---------- runtime ----------
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# Install minimal runtime deps (certs + curl for healthchecks)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user for better security
RUN groupadd -r app && useradd -r -g app app

# Copy dependencies and app from builder
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app /app

# Switch to non-root user
USER app

# Expose Django default port
EXPOSE 8000

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:8000/ || exit 1

# Start Gunicorn server
CMD ["gunicorn", "gpt_resume.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
