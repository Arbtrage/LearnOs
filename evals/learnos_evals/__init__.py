"""Evaluation harness for LearnOS AI tasks.

`mlflow.genai.evaluate` and its LLM-judge scorers are Python-only, so evals
cannot live inside the Next.js app. This package reads golden datasets produced
from sampled `AiRun` rows and scores them with a mix of built-in judges and
custom code scorers that call the app's real TypeScript invariants.
"""

__all__ = ["datasets", "scorers", "run"]
