"""Bridge to the app's TypeScript invariants.

Markdown lint and question normalization are production code that ships with
the app. Reimplementing them in Python would guarantee drift, so the scorers
shell out to `scripts/eval-invariants.ts`, which runs the very same
`validate` functions the kernel uses at generation time.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Sequence

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
SCRIPT = "scripts/eval-invariants.ts"
TIMEOUT_SECONDS = 180


class InvariantRunnerError(RuntimeError):
    """Raised when the Node bridge cannot be executed at all."""


@dataclass(frozen=True)
class Verdict:
    task_id: str
    ok: bool
    issues: list[str]


def _package_manager() -> list[str]:
    override = os.environ.get("LEARNOS_EVAL_NODE_CMD")
    if override:
        return override.split()

    if shutil.which("pnpm"):
        return ["pnpm", "exec", "tsx", SCRIPT]
    if shutil.which("npx"):
        return ["npx", "--yes", "tsx", SCRIPT]

    raise InvariantRunnerError(
        "Neither pnpm nor npx is available; set LEARNOS_EVAL_NODE_CMD to the "
        "command that runs scripts/eval-invariants.ts."
    )


def check_batch(
    records: Sequence[tuple[str, Any, Any]],
) -> list[Verdict]:
    """Validates `(task_id, inputs, outputs)` triples in a single Node call.

    Batching matters: starting a Node process per record would dominate the
    runtime of the whole eval suite.
    """
    if not records:
        return []

    payload = "\n".join(
        json.dumps({"taskId": task_id, "input": inputs, "output": outputs})
        for task_id, inputs, outputs in records
    )

    try:
        completed = subprocess.run(
            _package_manager(),
            input=payload,
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
            timeout=TIMEOUT_SECONDS,
            check=False,
        )
    except FileNotFoundError as error:
        raise InvariantRunnerError(str(error)) from error
    except subprocess.TimeoutExpired as error:
        raise InvariantRunnerError("invariant bridge timed out") from error

    if completed.returncode != 0:
        raise InvariantRunnerError(
            f"invariant bridge failed ({completed.returncode}): {completed.stderr.strip()}"
        )

    verdicts: list[Verdict] = []
    for line in completed.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        parsed = json.loads(line)
        verdicts.append(
            Verdict(
                task_id=parsed.get("taskId", ""),
                ok=bool(parsed.get("ok")),
                issues=list(parsed.get("issues") or []),
            )
        )

    if len(verdicts) != len(records):
        raise InvariantRunnerError(
            f"expected {len(records)} verdicts, got {len(verdicts)}"
        )

    return verdicts
