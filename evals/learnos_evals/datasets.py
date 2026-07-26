"""Golden dataset loading.

Datasets are JSONL, one record per line, with the same shape the export
endpoint emits: `{ id, taskId, input, output, ... }`. Curated seeds live in
`datasets/<task-id>.jsonl`; exported traffic is appended to
`datasets/exported/<date>.jsonl` and merged at load time.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

DATASETS_DIR = Path(__file__).resolve().parent.parent / "datasets"
EXPORTED_DIR = DATASETS_DIR / "exported"


@dataclass(frozen=True)
class EvalRecord:
    """One recorded generation, ready to be scored."""

    task_id: str
    inputs: dict[str, Any]
    outputs: Any
    record_id: str | None = None
    expectations: dict[str, Any] | None = None

    def to_mlflow_row(self) -> dict[str, Any]:
        row: dict[str, Any] = {
            "inputs": self.inputs,
            "outputs": self.outputs,
        }
        if self.expectations:
            row["expectations"] = self.expectations
        return row


def _read_jsonl(path: Path) -> Iterable[dict[str, Any]]:
    if not path.exists():
        return []

    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(
                    f"{path}:{line_number} is not valid JSON: {error}"
                ) from error
    return records


def _to_record(raw: dict[str, Any]) -> EvalRecord | None:
    task_id = raw.get("taskId") or raw.get("task_id")
    if not task_id:
        return None

    # Failed runs have no output to score; they are a reliability signal that
    # already lives in AiRun, not an eval case.
    if raw.get("output") is None:
        return None

    inputs = raw.get("input")
    return EvalRecord(
        task_id=str(task_id),
        inputs=inputs if isinstance(inputs, dict) else {"input": inputs},
        outputs=raw.get("output"),
        record_id=raw.get("id"),
        expectations=raw.get("expectations"),
    )


def load_task(task_id: str, include_exported: bool = True) -> list[EvalRecord]:
    """Loads every golden record for one task."""
    paths = [DATASETS_DIR / f"{_slug(task_id)}.jsonl"]
    if include_exported and EXPORTED_DIR.exists():
        paths.extend(sorted(EXPORTED_DIR.glob("*.jsonl")))

    records: list[EvalRecord] = []
    for path in paths:
        for raw in _read_jsonl(path):
            record = _to_record(raw)
            if record and record.task_id == task_id:
                records.append(record)
    return records


def available_tasks() -> list[str]:
    """Task ids that have a curated seed file."""
    if not DATASETS_DIR.exists():
        return []
    return sorted(
        path.stem.replace("__", ".")
        for path in DATASETS_DIR.glob("*.jsonl")
    )


def _slug(task_id: str) -> str:
    # Filenames avoid dots so they read cleanly on disk: topic.lesson -> topic__lesson
    return task_id.replace(".", "__")
