"""Entry point: score golden datasets and gate on regression.

    python -m learnos_evals.run --task topic.lesson
    python -m learnos_evals.run --all --no-judges
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import mlflow
from mlflow.genai import evaluate

from learnos_evals import datasets
from learnos_evals.scorers import scorers_for

BASELINE_PATH = Path(__file__).resolve().parent.parent / "baselines.json"

# Below this, a task is considered regressed and CI fails.
DEFAULT_THRESHOLD = 0.8
# Allowed drop against the recorded baseline before failing.
REGRESSION_TOLERANCE = 0.05


def _configure_mlflow() -> None:
    tracking_uri = os.environ.get("MLFLOW_TRACKING_URI", "databricks")
    mlflow.set_tracking_uri(tracking_uri)

    experiment_id = os.environ.get("MLFLOW_EXPERIMENT_ID")
    if experiment_id:
        mlflow.set_experiment(experiment_id=experiment_id)
    else:
        mlflow.set_experiment("/Shared/learnos-evals")


def _rows_for(task_id: str) -> list[dict[str, Any]]:
    rows = []
    for record in datasets.load_task(task_id):
        row = record.to_mlflow_row()
        # Scorers need the task id to resolve which invariants apply.
        row["inputs"] = {**row["inputs"], "__taskId": task_id}
        rows.append(row)
    return rows


def _mean_score(result: Any) -> float:
    metrics = getattr(result, "metrics", {}) or {}
    values = [
        value
        for key, value in metrics.items()
        if isinstance(value, (int, float)) and key.endswith("/mean")
    ]
    if not values:
        return 0.0
    return sum(values) / len(values)


def _load_baselines() -> dict[str, float]:
    if not BASELINE_PATH.exists():
        return {}
    try:
        return json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def evaluate_task(task_id: str, include_judges: bool) -> tuple[float, int]:
    rows = _rows_for(task_id)
    if not rows:
        print(f"[skip] {task_id}: no golden records")
        return (1.0, 0)

    with mlflow.start_run(run_name=f"eval-{task_id}"):
        mlflow.log_param("task_id", task_id)
        mlflow.log_param("record_count", len(rows))

        result = evaluate(
            data=rows,
            scorers=scorers_for(task_id, include_judges=include_judges),
        )

    score = _mean_score(result)
    print(f"[score] {task_id}: {score:.3f} over {len(rows)} records")
    return (score, len(rows))


def main() -> int:
    parser = argparse.ArgumentParser(description="Run LearnOS GenAI evals")
    parser.add_argument("--task", action="append", dest="tasks", default=None)
    parser.add_argument("--all", action="store_true")
    parser.add_argument(
        "--no-judges",
        action="store_true",
        help="Run only the deterministic code scorers (no LLM cost).",
    )
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument(
        "--update-baselines",
        action="store_true",
        help="Rewrite baselines.json with this run's scores.",
    )
    args = parser.parse_args()

    task_ids = args.tasks or (datasets.available_tasks() if args.all else [])
    if not task_ids:
        parser.error("pass --task <id> at least once, or --all")

    _configure_mlflow()

    baselines = _load_baselines()
    scores: dict[str, float] = {}
    failures: list[str] = []

    for task_id in task_ids:
        score, count = evaluate_task(task_id, include_judges=not args.no_judges)
        if count == 0:
            continue

        scores[task_id] = round(score, 4)

        if score < args.threshold:
            failures.append(
                f"{task_id}: {score:.3f} below absolute threshold {args.threshold:.2f}"
            )
            continue

        baseline = baselines.get(task_id)
        if baseline is not None and score < baseline - REGRESSION_TOLERANCE:
            failures.append(
                f"{task_id}: {score:.3f} regressed from baseline {baseline:.3f}"
            )

    if args.update_baselines:
        merged = {**baselines, **scores}
        BASELINE_PATH.write_text(
            json.dumps(merged, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        print(f"[baselines] wrote {BASELINE_PATH}")

    if failures:
        print("\nEval gate failed:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("\nEval gate passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
