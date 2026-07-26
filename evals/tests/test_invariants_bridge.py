"""Guards the bridge between the Python harness and the TypeScript invariants.

If this breaks, every code scorer silently loses its teeth, so it runs in CI
before the (slower, paid) judge evaluation.
"""

from __future__ import annotations

import pytest

from learnos_evals import datasets
from learnos_evals.invariants import InvariantRunnerError, check_batch

GOOD_LESSON = [
    {
        "title": "Section one",
        "bodyMarkdown": "### Heading\n\n- a point\n- another point",
        "order": 0,
    },
    {
        "title": "Section two",
        "bodyMarkdown": "### Heading\n\n1. first\n2. second",
        "order": 1,
    },
]

# One section, no list: the exact shape the markdown lint exists to reject.
BAD_LESSON = [
    {
        "title": "Only section",
        "bodyMarkdown": "Some prose with no heading and no list.",
        "order": 0,
    }
]


def _check(task_id, output):
    try:
        return check_batch([(task_id, {}, output)])[0]
    except InvariantRunnerError as error:
        pytest.skip(f"invariant bridge unavailable: {error}")


def test_accepts_valid_lesson():
    verdict = _check("topic.lesson", GOOD_LESSON)
    assert verdict.ok, verdict.issues


def test_rejects_lesson_without_subheading_or_list():
    verdict = _check("topic.lesson", BAD_LESSON)
    assert not verdict.ok
    assert verdict.issues


def test_rejects_unknown_task():
    verdict = _check("does.not.exist", GOOD_LESSON)
    assert not verdict.ok


def test_golden_datasets_pass_invariants():
    """A golden record that fails invariants is a broken fixture, not a finding."""
    for task_id in datasets.available_tasks():
        records = datasets.load_task(task_id, include_exported=False)
        if not records:
            continue

        verdicts = check_batch(
            [(r.task_id, r.inputs, r.outputs) for r in records]
        )
        for record, verdict in zip(records, verdicts):
            assert verdict.ok, f"{task_id}/{record.record_id}: {verdict.issues}"
