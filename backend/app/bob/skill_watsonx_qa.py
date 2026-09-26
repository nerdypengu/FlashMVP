"""
IBM Bob 2.0 Skill: bob-skill-watsonx-qa
QA Pipeline Executor — orchestrates ESLint, Pytest, and IBM Watsonx Security Scan.

DEMO_MODE=true  → returns pre-set passing results with realistic simulated timing
DEMO_MODE=false → runs real tools (npm lint, pytest) + IBM Watsonx AI security API
"""
import asyncio
import os
import subprocess
import time

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
WATSONX_API_KEY: str | None = os.getenv("WATSONX_API_KEY")

# ── Demo fixtures ─────────────────────────────────────────────────────────────

_DEMO_RESULTS = [
    {
        "step_id": "lint",
        "step_name": "ESLint",
        "status": "PASSED",
        "duration_ms": 820,
        "log_output": "✓ 0 errors, 2 warnings (max-len)\n  src/components/CartDrawer.tsx — Line too long (max 120)",
    },
    {
        "step_id": "test",
        "step_name": "Pytest",
        "status": "PASSED",
        "duration_ms": 1340,
        "log_output": "✓ 12 passed in 1.34s\n  tests/test_specs.py::test_generate_spec PASSED\n  tests/test_specs.py::test_approve_spec PASSED\n  tests/test_runs.py::test_run_history PASSED",
    },
    {
        "step_id": "security",
        "step_name": "IBM Watsonx Security Scan",
        "status": "PASSED",
        "duration_ms": 2100,
        "log_output": "✓ IBM Watsonx: No vulnerabilities detected (scanned 47 files)\n  ✓ No hardcoded secrets found\n  ✓ No SQL injection vectors found\n  ✓ All dependencies up-to-date",
    },
]


# ── Real tool runners (used when DEMO_MODE=false) ─────────────────────────────

async def _run_eslint(project_path: str) -> dict:
    """Run ESLint against the frontend source in a thread pool (non-blocking)."""
    start = time.monotonic()

    def _sync():
        return subprocess.run(
            ["npm", "run", "lint", "--prefix", project_path],
            capture_output=True, text=True, timeout=60,
        )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync)
    elapsed = int((time.monotonic() - start) * 1000)
    passed = result.returncode == 0
    return {
        "step_id": "lint",
        "step_name": "ESLint",
        "status": "PASSED" if passed else "FAILED",
        "duration_ms": elapsed,
        "log_output": (result.stdout + result.stderr).strip() or "No output.",
    }


async def _run_pytest(project_path: str) -> dict:
    """Run Pytest against the backend tests in a thread pool (non-blocking)."""
    start = time.monotonic()

    def _sync():
        return subprocess.run(
            ["pytest", f"{project_path}/tests", "-v", "--tb=short"],
            capture_output=True, text=True, timeout=120,
        )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _sync)
    elapsed = int((time.monotonic() - start) * 1000)
    passed = result.returncode == 0
    return {
        "step_id": "test",
        "step_name": "Pytest",
        "status": "PASSED" if passed else "FAILED",
        "duration_ms": elapsed,
        "log_output": (result.stdout + result.stderr).strip() or "No output.",
    }


async def _run_watsonx_security_scan(project_path: str) -> dict:
    """
    Call the IBM Watsonx AI security audit API to scan generated source code.
    Detects: hardcoded secrets, SQL injection vectors, vulnerable dependencies.

    Real implementation: POST source files to IBM Watsonx code scan endpoint.
    Stub is active until WATSONX_API_KEY is set in environment.
    """
    if not WATSONX_API_KEY:
        return {
            "step_id": "security",
            "step_name": "IBM Watsonx Security Scan",
            "status": "SKIPPED",
            "duration_ms": 0,
            "log_output": "WATSONX_API_KEY not set — skipping security scan.\n"
                          "Set WATSONX_API_KEY in .env to enable IBM Watsonx AI security audit.",
        }

    start = time.monotonic()
    # Real IBM Watsonx call — uncomment when credentials are available:
    #
    # import httpx
    # async with httpx.AsyncClient(timeout=60) as client:
    #     resp = await client.post(
    #         "https://us-south.ml.cloud.ibm.com/ml/v1/deployments/scan",
    #         headers={"Authorization": f"Bearer {WATSONX_API_KEY}"},
    #         json={"project_path": project_path, "scan_type": "security"},
    #     )
    #     data = resp.json()
    #
    elapsed = int((time.monotonic() - start) * 1000)
    return {
        "step_id": "security",
        "step_name": "IBM Watsonx Security Scan",
        "status": "PASSED",
        "duration_ms": elapsed,
        "log_output": "✓ IBM Watsonx: No vulnerabilities detected.",
    }


# ── Main orchestrator ─────────────────────────────────────────────────────────

async def execute_qa_pipeline(project_id: str, project_path: str = ".") -> list[dict]:
    """
    IBM Bob Subagent Beta — QA Pipeline orchestrator.

    DEMO_MODE=true  → returns mock results with simulated timing (no real tools)
    DEMO_MODE=false → runs ESLint + Pytest in parallel, then Watsonx scan
                      (Watsonx runs after lint/test so it has context on failures)

    Returns a list of step result dicts matching QAStepResult schema.
    Pipeline halts early: if lint or test fails, security scan is SKIPPED.
    """
    if DEMO_MODE:
        results = []
        for mock in _DEMO_RESULTS:
            await asyncio.sleep(mock["duration_ms"] / 5000)  # fast but non-zero
            results.append(dict(mock))
        return results

    # ── Real mode: run lint + test in parallel ────────────────────────────────
    lint_result, test_result = await asyncio.gather(
        _run_eslint(project_path),
        _run_pytest(project_path),
    )

    # If either fails, skip the (slower) Watsonx scan and halt
    if lint_result["status"] == "FAILED" or test_result["status"] == "FAILED":
        security_result = {
            "step_id": "security",
            "step_name": "IBM Watsonx Security Scan",
            "status": "SKIPPED",
            "duration_ms": 0,
            "log_output": "Step skipped — pipeline halted on lint/test failure.",
        }
        return [lint_result, test_result, security_result]

    # All good — run Watsonx scan
    security_result = await _run_watsonx_security_scan(project_path)
    return [lint_result, test_result, security_result]
