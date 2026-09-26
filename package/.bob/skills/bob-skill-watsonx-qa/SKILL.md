---
name: bob-skill-watsonx-qa
description: Autonomous ESLint, Pytest, and Watsonx AI security leak auditing skill for IBM Bob 2.0 Agent Mode.
---

# IBM Bob 2.0 Skill: IBM Watsonx QA & Security Inspector

## Overview

Empowers **IBM Bob 2.0 Agent Mode** to execute automated multi-stage test pipelines (ESLint, Pytest, dependency security scans) and perform AI-assisted code vulnerability analysis using **IBM Watsonx AI**.

## Target IBM Infrastructure

* **Service**: IBM Watsonx AI Governance & Security Audit
* **Pipeline Config**: `.watsonx-qa.yml`

## Executable Skill Commands

```bash
# Execute Watsonx QA test suite defined in .watsonx-qa.yml
bob run skill:bob-skill-watsonx-qa --action=run-pipeline --config=.watsonx-qa.yml

# Scan repository for hardcoded secret leaks and CVE vulnerabilities
bob run skill:bob-skill-watsonx-qa --action=security-audit
```

## Boundaries & Safety Rules

- **Always** fail pipeline execution if high-severity security vulnerabilities are detected.
- **Always** export test run telemetry to the FlashMVP observability engine.
