# ---- Stage 1: build the React frontend ----
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend that also serves the built frontend ----
FROM python:3.11-slim
WORKDIR /app

# System certs for outbound HTTPS (Google APIs, Drive)
RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
# Built static frontend from stage 1
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Credentials are supplied at runtime via Railway env vars
# (GOOGLE_CREDENTIALS as JSON, GMAP_API as the Maps key) — see backend/config.py.

EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
