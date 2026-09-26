## QA demo

Run `uv run uvicorn main:app --port 8001` from `backend/`. With `DEMO_MODE=true`, QA runs are simulated and saved in `backend/flashmvp_demo.sqlite3` (ignored by Git), separately for each project. The frontend needs this backend running to load the pipeline and its saved history.

Bob's project-specific stages are read from `FLASHMVP_PROJECTS_DIR/<project_id>/flashmvp.json` using `qa_pipeline: [{"stage": "Unit Tests", "files": ["backend/tests/test_*.py"]}]`. Set `FLASHMVP_PROJECTS_DIR` to the parent folder where Bob writes projects. Until that file exists in demo mode, the `react-fastapi` template manifest is used for preview.

With `DEMO_MODE=false`, existing run history is read from Supabase `flashmvp.run_history`; starting real QA runs requires the Bob runner integration.
