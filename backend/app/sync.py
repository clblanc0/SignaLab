"""Align CSV behavioral events to the EEG clock.

The sync problem in lab data: two recording systems (EEG amp + stimulus PC,
say) tag the same events with onsets in their own clocks. Clocks have a fixed
offset (PC started 200 ms after EEG amp armed) and a slow drift (cheap crystals
diverge by ~100 ppm).

Strategy here, in order of preference:
  1) **Linear fit** — match events by label across the two streams; if we get
     ≥2 paired anchor events, solve `eeg_t = a + b * csv_t` via least squares.
     This recovers both offset and drift.
  2) **Constant offset** — exactly 1 paired anchor: subtract the difference,
     no drift correction.
  3) **No sync** — no labels match; events stay as-is with a warning. Useful
     when the user knows the clocks are already aligned and just wants the
     data merged.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

from .csv_events import BehavioralEvent


@dataclass
class SyncResult:
    method: str  # "linear" | "constant" | "no_sync"
    offset_s: float  # intercept of csv→eeg mapping (seconds)
    drift_rate: float  # slope - 1 (dimensionless, ~ppm × 1e-6)
    matched_event_count: int
    rms_residual_s: Optional[float] = None
    warnings: list[str] = field(default_factory=list)


def _norm(label: str) -> str:
    """Normalize a label for matching: lowercase, collapse whitespace/punct."""
    return re.sub(r"[\s_\-/]+", "", label.strip().lower())


def _pair_by_label(
    eeg_times: list[float],
    eeg_labels: list[str],
    csv_events: list[BehavioralEvent],
) -> list[tuple[float, float]]:
    """For each label present in both streams, pair occurrences by sorted order.

    A label with 3 EEG hits and 5 CSV hits contributes 3 pairs (the first
    three CSV occurrences pair with the EEG ones). This is a stable heuristic
    that survives most lab mismatches; it's not optimal under heavy noise.
    """
    eeg_by_label: dict[str, list[float]] = {}
    for t, lbl in zip(eeg_times, eeg_labels):
        eeg_by_label.setdefault(_norm(lbl), []).append(t)
    for lst in eeg_by_label.values():
        lst.sort()

    csv_by_label: dict[str, list[float]] = {}
    for ev in csv_events:
        csv_by_label.setdefault(_norm(ev.label), []).append(ev.onset)
    for lst in csv_by_label.values():
        lst.sort()

    pairs: list[tuple[float, float]] = []
    for key, eeg_list in eeg_by_label.items():
        csv_list = csv_by_label.get(key)
        if not csv_list:
            continue
        for csv_t, eeg_t in zip(csv_list, eeg_list):
            pairs.append((csv_t, eeg_t))
    return pairs


def align_events(
    eeg_annotation_times: list[float],
    eeg_annotation_labels: list[str],
    csv_events: list[BehavioralEvent],
) -> tuple[SyncResult, list[BehavioralEvent]]:
    pairs = _pair_by_label(eeg_annotation_times, eeg_annotation_labels, csv_events)
    warnings: list[str] = []

    if len(pairs) >= 2:
        # Closed-form least squares for y = a + b*x; avoids a numpy dep.
        n = len(pairs)
        sx = sum(p[0] for p in pairs)
        sy = sum(p[1] for p in pairs)
        sxx = sum(p[0] * p[0] for p in pairs)
        sxy = sum(p[0] * p[1] for p in pairs)
        denom = n * sxx - sx * sx
        if denom == 0:
            # All anchor events at the same csv time — fall back to constant offset.
            return _constant_offset(pairs, csv_events, warnings)
        b = (n * sxy - sx * sy) / denom
        a = (sy - b * sx) / n
        aligned = [
            BehavioralEvent(
                onset=a + b * ev.onset,
                duration=ev.duration,
                label=ev.label,
                extras=ev.extras,
            )
            for ev in csv_events
        ]
        # RMS residual on the anchor pairs — gives the user a confidence number.
        residuals = [(a + b * px) - py for px, py in pairs]
        rms = (sum(r * r for r in residuals) / n) ** 0.5
        if abs(b - 1.0) > 0.05:
            warnings.append(
                f"large drift detected: {(b - 1) * 1000:.1f} ms/s — "
                "verify clock anchoring is correct"
            )
        return (
            SyncResult(
                method="linear",
                offset_s=a,
                drift_rate=b - 1.0,
                matched_event_count=n,
                rms_residual_s=rms,
                warnings=warnings,
            ),
            aligned,
        )

    if len(pairs) == 1:
        return _constant_offset(pairs, csv_events, warnings)

    warnings.append(
        "no shared event labels between EEG annotations and CSV — "
        "events written without time-base correction"
    )
    return (
        SyncResult(
            method="no_sync",
            offset_s=0.0,
            drift_rate=0.0,
            matched_event_count=0,
            warnings=warnings,
        ),
        list(csv_events),
    )


def _constant_offset(
    pairs: list[tuple[float, float]],
    csv_events: list[BehavioralEvent],
    warnings: list[str],
) -> tuple[SyncResult, list[BehavioralEvent]]:
    csv_t, eeg_t = pairs[0]
    offset = eeg_t - csv_t
    aligned = [
        BehavioralEvent(
            onset=ev.onset + offset,
            duration=ev.duration,
            label=ev.label,
            extras=ev.extras,
        )
        for ev in csv_events
    ]
    warnings.append("only 1 shared event — applied constant offset, drift uncorrected")
    return (
        SyncResult(
            method="constant",
            offset_s=offset,
            drift_rate=0.0,
            matched_event_count=1,
            warnings=warnings,
        ),
        aligned,
    )
