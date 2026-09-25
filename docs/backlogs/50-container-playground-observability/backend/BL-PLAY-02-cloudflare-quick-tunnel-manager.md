# Backlog Item: BL-PLAY-02 - Cloudflare Quick Tunnel Manager
> **Feature:** Container Playground & Observability | **Layer:** Backend (`server/app/services/tunnel_service.py`)

---

## 🎯 Task Objective
Implement the `cloudflared` subprocess runner that establishes a free SSL public tunnel (`https://xxxx.trycloudflare.com`) on port 3001 in 1-2 seconds.

---

## 🛠️ File Locations & Component Specs
* **Backend Service:** `server/app/services/tunnel_service.py`

---

## 📝 Implementation Tasks
1. Execute subprocess `cloudflared tunnel --url http://localhost:3001`.
2. Parse `stderr` for output URL matching `https://.*\.trycloudflare\.com`.
3. Return public HTTPS URL to deployment orchestrator.

---

## 🧪 How to Test (Backend)
1. Run Python test script calling `start_cloudflare_tunnel(3001)` -> verify it returns `https://xxxx.trycloudflare.com`.
