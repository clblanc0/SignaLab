> **Note:** This repository is the early open-source prototype of SignaLab. The current SignaLab platform is closed-source and under active development. Demos are available on request: christian.lopezblanco.1@gmail.com

# SignaLab

Multi-modal biosignal ingestion and standardization platform. Drop in heterogeneous
time-series recordings — EEG, behavioral logs, response data — and get out a
[BIDS](https://bids.neuroimaging.io/) dataset your analysis pipeline can use
immediately. Runs locally, no cloud, your data never leaves your machine.

> **Status: early MVP.** EDF + behavioral CSV → BIDS-EEG works end to end.
> Cross-stream time alignment (offset + drift correction) is implemented and
> verified on synthetic data to sub-millisecond residual. More input formats
> and NWB export are on the roadmap below.

---

## Prototype vs. current platform

This prototype proved the core idea: drop in heterogeneous recordings, get back an analysis-ready, standards-compliant dataset. The current platform builds on it.

| | This prototype (open) | Current platform (closed) |
|---|---|---|
| **Inputs** | EDF EEG + behavioral CSV | EEG, EMG, ECG, HRV, and EHR data |
| **Outputs** | BIDS-EEG | BIDS, NWB, and HL7 FHIR |
| **Orchestration** | In-memory job store, worker thread | Prefect-orchestrated pipelines |
| **Performance** | Not benchmarked | 17,000–32,000x faster than manual workflows in internal benchmarks |
| **Status** | Reference implementation, frozen | In development with clinical research partners |

## What works today

| Capability | Status |
|---|---|
| Drag-and-drop upload UI with extension-based stream detection | ✅ |
| EDF (EEG/physiology) ingestion via MNE-Python | ✅ |
| BIDS events.tsv-compatible CSV/TSV (behavioral) ingestion | ✅ |
| Multiple behavioral files per session | ✅ |
| Cross-stream sync (linear fit on shared event labels — recovers offset + drift) | ✅ |
| Event dedup between EEG triggers and CSV log | ✅ |
| BIDS 1.9.0 EEG dataset output, packaged as a downloadable zip | ✅ |
| Real-time pipeline progress + per-file sync metrics in the UI | ✅ |
| BrainVision / BDF / FIF / EGI MFF input | 🚧 Phase 3 |
| NWB export alongside BIDS | 🚧 Phase 4 |
| Overview / Datasets / QC views wired to real backend data | 🚧 Phase 5 |

---

## How the pipeline works

```
                  ┌───────────────────────────────────────────────────┐
upload  ──────►   │  Ingestion → Format Parsing → Stream Detection    │
(EDF + 1..N CSV)  │       ↓                                           │
                  │  Clock Sync (per CSV)  ─► Event Merge (dedup)     │
                  │       ↓                                           │
                  │  BIDS Standardization  ─► Packaging (.zip)        │
                  └───────────────────────────────────────────────────┘
                                          │
                                          ▼
                                  BIDS-EEG dataset
                          (drops into MNE / EEGLAB / FieldTrip)
```

**Clock Sync** is the headline feature. For every behavioral CSV uploaded
alongside an EEG file:

1. Match CSV `trial_type` values against the EEG's annotation descriptions
   (case-insensitive, normalized).
2. With ≥ 2 matched anchor pairs, solve `eeg_t = a + b · csv_t` via closed-form
   least squares. Recovers both offset and clock drift.
3. With exactly 1 anchor, apply a constant offset (no drift correction).
4. With 0, write events as-is and surface a clear warning.

The synced events become MNE annotations on the raw object, so
[`mne-bids`](https://mne.tools/mne-bids/) writes them into a canonical
`events.tsv`. EEG↔CSV duplicates are removed inside ±50 ms.

---

## Quick start

### Prerequisites

- **Node 18+** (frontend)
- **Python 3.10+** (backend) — Python 3.13 is what the project develops against

### Setup

```bash
git clone https://github.com/clblanc0/SignaLab.git
cd SignaLab

# Frontend deps
npm install

# Backend deps (isolated venv)
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Run

Two terminals:

```bash
# Terminal 1 — backend (FastAPI + MNE)
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — frontend (Vite + React)
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api/*` → backend at
`localhost:8000`, so calls work without CORS configuration.

API docs are auto-generated at <http://localhost:8000/docs>.

---

## Using the app

1. **Ingest** tab → drag in an EDF (required) and one or more behavioral CSVs
   (optional). The "Post-experiment time-series sync" card updates live with
   detected streams.
2. Fill in **Subject ID**. Paradigm and notes are optional.
3. Click **Run Pipeline**.
4. **Pipeline** tab shows the 7-stage progress in real time. Expand a job to
   see the per-file sync panel (offset, drift, anchor count, RMS residual,
   dedup count, warnings).
5. When the job is complete, hit **Download BIDS dataset (.zip)** in the
   expanded job view.

### Behavioral CSV format

The simplest layout (BIDS `events.tsv`-compatible) is what the backend expects:

| onset | duration | trial_type | (any other columns) |
|---|---|---|---|
| 4.7525 | 0 | stim_onset | … |
| 5.1525 | 0 | response | … |

- `onset` is required (seconds, float).
- `duration` is optional; missing → 0.
- `trial_type` is what gets matched against EEG annotation labels for sync.
  Falls back to `value` or `event_type` if `trial_type` is absent.
- Any extra columns survive into the output `events.tsv`.

---

## Output: what you get

A BIDS 1.9.0 directory:

```
bids_<JOB-ID>/
├── README
├── dataset_description.json
├── participants.json
├── participants.tsv
└── sub-<ID>/
    ├── sub-<ID>_scans.tsv
    └── eeg/
        ├── sub-<ID>_task-<TASK>_eeg.edf
        ├── sub-<ID>_task-<TASK>_eeg.json       # sampling rate, refs, EEG metadata
        ├── sub-<ID>_task-<TASK>_channels.tsv   # per-channel info
        ├── sub-<ID>_task-<TASK>_events.tsv     # merged EEG + behavioral events
        └── sub-<ID>_task-<TASK>_events.json
```

This drops straight into MNE-BIDS, EEGLAB (`bids-matlab-tools`), FieldTrip
(`ft_read_data`), and other BIDS-aware tooling.

---

## Architecture

```
 ┌──────────────────────┐         ┌──────────────────────────────────┐
 │   Browser (5173)     │  /api   │   FastAPI backend (8000)         │
 │                      │ ───────►│                                  │
 │   Vite + React 18    │         │   • routes: ingest, jobs,        │
 │   Tailwind UI        │         │     datasets/download, health    │
 │                      │         │   • in-memory JobStore (thread)  │
 │   src/api.js wraps   │         │   • pipeline.py orchestrates 7   │
 │   /api calls         │         │     stages on a worker thread    │
 │                      │         │   • parsers: edf (MNE), csv      │
 │                      │         │   • sync: least-squares fit      │
 │                      │         │   • exporter: mne-bids           │
 └──────────────────────┘         └──────────────────────────────────┘
                                              │
                                              ▼
                                  backend/data/
                                    ├── uploads/   (raw inputs)
                                    └── outputs/   (BIDS dirs + zips)
```

The in-memory job store is intentional Phase 1 simplicity; swapping in
SQLite or Redis is a one-file change (see `backend/app/jobs.py`).

---

## Repo layout

```
SignaLab/
├── index.html                         # Vite entry
├── package.json                       # frontend deps
├── vite.config.js                     # /api proxy → :8000
├── src/
│   ├── main.jsx
│   ├── api.js                         # fetch client + backend↔UI adapter
│   └── dashboard/
│       ├── Dashboard.jsx              # shell + view state
│       ├── appConfig.jsx              # nav registry
│       ├── mockData.js                # mock data for not-yet-wired views
│       └── views/
│           ├── Ingest.jsx             # upload + live sync preview
│           ├── Pipeline.jsx           # real-time job list + sync panels
│           ├── Overview.jsx           # 🚧 still on mock data
│           ├── QCReports.jsx          # 🚧 still on mock data
│           ├── Visualizer.jsx         # 🚧 still on mock data
│           └── Datasets.jsx           # 🚧 still on mock data
└── backend/
    ├── requirements.txt
    ├── README.md
    └── app/
        ├── main.py                    # FastAPI app + routes
        ├── jobs.py                    # thread-safe JobStore + models
        ├── pipeline.py                # 7-stage orchestration
        ├── csv_events.py              # BIDS-events-style CSV parser
        └── sync.py                    # offset + drift alignment
```

---

## Roadmap

- **Phase 3** — additional input formats (BrainVision `.vhdr`, BDF, FIF, EGI MFF)
  via existing MNE readers. Broadens "physiology" coverage beyond EDF.
- **Phase 4** — NWB output target alongside BIDS, for multi-modal containers
  and DANDI archive compatibility.
- **Phase 5** — replace the mock-data views (Overview, Datasets, QC Reports,
  Signal Viewer) with real backend endpoints over the persisted job/dataset
  store.
- **Real-data shakedown** — test the pipeline against actual lab recordings;
  expect to learn what assumptions break.

---

## Development notes

- Backend hot-reload: `uvicorn ... --reload` picks up Python edits.
- Frontend HMR: Vite picks up JSX/CSS edits without a refresh.
- API contract is OpenAPI-documented at `/docs`; the React adapter
  (`src/api.js`) maps snake_case → camelCase between the two.
- `backend/data/uploads/` and `backend/data/outputs/` are gitignored; clear
  them by hand if disk fills up during heavy testing.

---

## License

TBD — add a `LICENSE` file before sharing outside the lab.
