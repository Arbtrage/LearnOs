"""Scorers: built-in LLM judges plus code scorers over real invariants.

Code scorers run first and are cheap and deterministic. Judges are only worth
paying for on output that already satisfies the structural contract.
"""

from __future__ import annotations

from typing import Any

from mlflow.genai.scorers import Correctness, Guidelines, scorer
from mlflow.entities import AssessmentSource, AssessmentSourceType, Feedback

from learnos_evals.invariants import InvariantRunnerError, check_batch

_CODE_SOURCE = AssessmentSource(
    source_type=AssessmentSourceType.CODE,
    source_id="learnos-invariants",
)


def _feedback(name: str, value: bool, rationale: str) -> Feedback:
    return Feedback(
        name=name,
        value=value,
        rationale=rationale,
        source=_CODE_SOURCE,
    )


@scorer
def task_invariants(inputs: dict[str, Any], outputs: Any, trace=None) -> Feedback:
    """Runs the production `validate` for the task that produced this record.

    For lessons this is the markdown lint; for question generation it is the
    normalization survival rule. Failing here means the app itself would have
    retried or degraded the response.
    """
    task_id = inputs.get("__taskId") or inputs.get("taskId") or ""

    if not task_id:
        return _feedback(
            "task_invariants",
            False,
            "record does not carry a taskId, so invariants cannot be resolved",
        )

    try:
        verdict = check_batch([(task_id, inputs, outputs)])[0]
    except InvariantRunnerError as error:
        # An infrastructure failure is not a model failure; surface it loudly
        # rather than silently scoring the run as passing.
        return _feedback("task_invariants", False, f"bridge error: {error}")

    return _feedback(
        "task_invariants",
        verdict.ok,
        "all invariants hold" if verdict.ok else "; ".join(verdict.issues),
    )


@scorer
def non_empty_output(outputs: Any) -> Feedback:
    """Catches the degenerate 'schema-valid but useless' response."""
    if outputs is None:
        return _feedback("non_empty_output", False, "output is null")

    if isinstance(outputs, (list, dict, str)) and len(outputs) == 0:
        return _feedback("non_empty_output", False, "output is empty")

    return _feedback("non_empty_output", True, "output has content")


LESSON_GUIDELINES = Guidelines(
    name="lesson_quality",
    guidelines=[
        "The lesson must teach the stated topic, not describe how to learn it.",
        "Explanations must include at least one concrete example or worked case.",
        "The lesson must not invent citations, URLs, or statistics.",
        "Tone must be direct and free of filler like 'in today's fast-paced world'.",
    ],
)

QUESTION_GUIDELINES = Guidelines(
    name="question_quality",
    guidelines=[
        "Every question must be answerable from the stated topic alone.",
        "Exactly one option must be defensibly correct for single-answer questions.",
        "Distractors must be plausible, not obviously wrong or joke answers.",
        "Explanations must justify the correct answer rather than restate it.",
    ],
)

ROADMAP_GUIDELINES = Guidelines(
    name="roadmap_quality",
    guidelines=[
        "Topics must progress from prerequisites to dependent material.",
        "Each stage must be achievable within its stated time budget.",
        "The roadmap must cover the learner's stated goal without padding.",
    ],
)

CORRECTNESS = Correctness()

CODE_SCORERS = [task_invariants, non_empty_output]

JUDGES_BY_TASK: dict[str, list[Any]] = {
    "topic.lesson": [LESSON_GUIDELINES],
    "topic.objectives": [LESSON_GUIDELINES],
    "topic.questions": [QUESTION_GUIDELINES],
    "project.mockExam": [QUESTION_GUIDELINES],
    "project.roadmap": [ROADMAP_GUIDELINES],
    "project.blueprint": [ROADMAP_GUIDELINES],
}


def scorers_for(task_id: str, include_judges: bool = True) -> list[Any]:
    """Code scorers always run; judges are opt-out for cheap local iteration."""
    scorers = list(CODE_SCORERS)
    if include_judges:
        scorers.extend(JUDGES_BY_TASK.get(task_id, []))
    return scorers
