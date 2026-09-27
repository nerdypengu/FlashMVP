## QA demo

Run `uv run uvicorn main:app --port 8001` from `backend/`. With `DEMO_MODE=true`, QA runs are simulated and saved in `backend/flashmvp_demo.sqlite3` (ignored by Git), separately for each project. The frontend needs this backend running to load the pipeline and its saved history.

Bob's project-specific stages are read from `FLASHMVP_PROJECTS_DIR/<project_id>/flashmvp.json` using `qa_pipeline: [{"stage": "Unit Tests", "files": ["backend/tests/test_*.py"]}]`. Set `FLASHMVP_PROJECTS_DIR` to the parent folder where Bob writes projects. Until that file exists in demo mode, the `react-fastapi` template manifest is used for preview.

With `DEMO_MODE=false`, existing run history is read from Supabase `flashmvp.run_history`; starting real QA runs requires the Bob runner integration.

## GitHub starter initialization

Register a GitHub **OAuth App** in Settings > Developer settings > OAuth Apps.
For local development, set its homepage to `http://localhost:5173` and its authorization callback to
`http://localhost:8001/api/v1/github/callback`. Configure the backend using the variable names in
`.env.example`, including a generated Fernet session key. Never put the client secret or session
key into `VITE_*` variables. Keep the session key stable across restarts and workers.

Start backend on port 8001 and frontend on port 5173; set `VITE_API_URL` to `http://localhost:8001`.
Use the same host spelling on both (localhost, not one localhost and one 127.0.0.1).
Production requires HTTPS and frontend/API on the same site for SameSite=Lax cookies; a reverse
proxy on the frontend domain works. Set `FRONTEND_URL` and the callback URL to those public addresses.
The credentialed CORS allowlist replaces the previous wildcard; configure `CORS_ORIGINS` for other clients.

Open Starter or Dashboard > Create New Project, connect GitHub, choose a template, repository name,
description and visibility, then click Create repository & publish starter. The OAuth `repo` scope
supports public and private repositories in the connected user's personal account. Existing
repositories are never reused or overwritten. GitHub creates an initial README; the starter files
are then committed together to the repository's actual default branch via the Git data API.
The current templates contain Dockerfiles, `.gitignore` and `flashmvp.json`, not a complete generated app.
The operation does not deploy containers or create a Supabase project record. The created repository
persists on GitHub; the success panel shows its URL and commit SHA.

GitHub tokens are encrypted in `backend/github_connections.sqlite3`, keyed by the authenticated
Supabase user. A returning user restores their connection without another OAuth flow, even after
browser cookies are cleared. Set `FLASHMVP_GITHUB_DB` to a persistent shared volume when deploying
multiple workers on one host; separate hosts need a shared database before horizontal scaling.
Keep `GITHUB_SESSION_KEY` stable: rotating it requires reconnecting existing accounts.
An encrypted HttpOnly cookie is renewed on connection checks, with a one-year browser lifetime;
JavaScript cannot read it. Demo connections stay only in this cookie to isolate the shared demo
account between browsers. OAuth uses state validation and PKCE. Demo mode still requires genuine GitHub authorization and creates
real repositories when this button is used. Disconnect revokes the provider token, clears saved
credentials and cookies, and prevents old cookies from restoring access. Revoked tokens require reconnecting.
If creation succeeds but publishing fails, the UI links to the partial repository for inspection;
it does not delete it or silently retry. A timeout during creation may also leave a repository on GitHub.

This feature does not install push webhooks. OAuth and API references:
https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user
