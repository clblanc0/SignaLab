"""Parse a BIDS events.tsv-compatible CSV/TSV.

The BIDS spec requires `onset` (seconds, float) and `duration` (seconds or 'n/a').
We treat `trial_type` (or `value` as a fallback) as the event label used for
sync matching against EEG annotations. Extra columns are preserved verbatim
so they survive the round-trip into BIDS output.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class BehavioralEvent:
    onset: float
    duration: float  # 0.0 if unspecified
    label: str  # canonical sync key (trial_type or value)
    extras: dict[str, str] = field(default_factory=dict)


def _to_float_or_none(s: str) -> Optional[float]:
    s = (s or "").strip()
    if s in ("", "n/a", "NA", "NaN", "nan"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_events_csv(path: Path) -> list[BehavioralEvent]:
    """Read a BIDS-style events file (CSV or TSV). Skips rows missing onset.

    Detects delimiter via csv.Sniffer; falls back to tab if the file has a .tsv
    suffix and to comma otherwise. Required columns are looked up case-insensitively.
    """
    suffix = path.suffix.lower()
    text = path.read_text(encoding="utf-8-sig")  # handle BOM gracefully
    sample = "\n".join(text.splitlines()[:5])
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
        delimiter = dialect.delimiter
    except csv.Error:
        delimiter = "\t" if suffix == ".tsv" else ","

    reader = csv.DictReader(text.splitlines(), delimiter=delimiter)
    if not reader.fieldnames:
        raise ValueError(f"{path.name}: no header row")

    # Case-insensitive header lookup.
    headers = {h.strip().lower(): h for h in reader.fieldnames}
    onset_key = headers.get("onset")
    if onset_key is None:
        raise ValueError(
            f"{path.name}: missing required 'onset' column "
            f"(found: {list(reader.fieldnames)})"
        )
    duration_key = headers.get("duration")
    label_key = headers.get("trial_type") or headers.get("value") or headers.get("event_type")

    events: list[BehavioralEvent] = []
    for row in reader:
        onset = _to_float_or_none(row.get(onset_key, ""))
        if onset is None:
            continue
        duration = (
            _to_float_or_none(row.get(duration_key, "")) if duration_key else None
        ) or 0.0
        if label_key:
            label = (row.get(label_key) or "").strip() or "event"
        else:
            label = "event"
        # Stash anything else as extras so it survives into events.tsv.
        extras = {
            k: v for k, v in row.items()
            if k not in {onset_key, duration_key, label_key} and v not in (None, "")
        }
        events.append(BehavioralEvent(onset=onset, duration=duration, label=label, extras=extras))

    if not events:
        raise ValueError(f"{path.name}: no events parsed (all rows missing onset?)")

    events.sort(key=lambda e: e.onset)
    return events
