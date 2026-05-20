# SignaLab backend

FastAPI service that ingests biosignal recordings and standardizes them into BIDS datasets.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

API docs at http://localhost:8000/docs once running.

## Layout

- `app/main.py` — FastAPI app, routes
- `app/jobs.py` — in-memory job store with progress tracking
- `app/pipeline.py` — EDF → BIDS conversion pipeline
- `data/uploads/` — raw uploaded files (gitignored)
- `data/outputs/` — BIDS datasets + zipped artifacts (gitignored)

## Phase 1 scope

One real end-to-end path:

1. `POST /api/ingest` — upload an EDF + subject metadata
2. Pipeline runs async: parse with MNE → write BIDS-EEG with mne-bids → zip
3. `GET /api/jobs` / `GET /api/jobs/{id}` — poll progress
4. `GET /api/datasets/{job_id}/download` — download zipped BIDS dataset
