# Architecture Decision Record (ADR) 0001: Backend Hosting & IBM Cloud Container Execution Strategy

| Metadata | Details |
| :--- | :--- |
| **Status** | Accepted — IBM Bob 2.0 Middleware Proxy Architecture |
| **Date** | 2026-09-25 |
| **Authors** | FlashMVP Architecture Team |
| **Deciders** | Platform Core Team |
| **Relates To** | PRD §2.4, Architecture Spec §4.2, Backlog `50-container-playground-observability` |

---

## 1. Context & Problem Statement

FlashMVP acts as a **Zero-Learning Developer Middleware Proxy for IBM Environment Tools**, allowing users to generate, deploy, and test full-stack web applications on **IBM Cloud Code Engine** and **IBM Cloud Databases for PostgreSQL** using **IBM Bob 2.0 Agent Mode**.

During the hackathon judging period, the platform must satisfy two key execution goals:
1. **IBM Cloud Tool Integration:** Demonstrating seamless 1-click deployment to **IBM Cloud Code Engine (`https://app-8f92a.us-south.codeengine.appdomain.cloud`)**, isolated PostgreSQL schema provisioning (`CREATE SCHEMA app_xxxx`), and **IBM Secrets Manager** vault key sync.
2. **24/7 Availability & Zero Cloud Overhead:** Anonymous judges must be able to test the FlashMVP platform link at any time without requiring expensive active cloud billing accounts or team laptops running continuously.

---

## 2. Options Evaluated

### Option A: IBM Cloud Code Engine + GCP `e2-micro` Proxy VM *(TOP PICK & ACCEPTED)*
* **Mechanism:** IBM Cloud Code Engine handles serverless app container execution; GCP `e2-micro` Always Free VM handles 24/7 FastAPI proxy middleware execution with `docker-py` and Supabase/IBM Postgres client bindings.
* **Pros:** 
  * Full-fidelity IBM Cloud deployment experience.
  * 744 hours/month (24/7 uptime) for **$0 forever** for the proxy backend.
  * Instant subagent task delegation via IBM Bob 2.0 Agent Core.
* **Cons:** Requires lightweight memory safeguards (Section 4).

### Option B: Local Laptop + IBM Cloud CLI & `cloudflared` *(Development & Pitch Phase)*
* **Mechanism:** FastAPI backend runs locally with Docker Desktop and IBM Cloud CLI (`ibmcloud ce`). `cloudflared` tunnels local endpoints to public URLs.
* **Pros:** $0 cost, instant local velocity during video pitch recording.
* **Cons:** Requires laptop to be powered on continuously for 24/7 availability.

---

## 3. Final Deployment Architecture

* **Frontend (`client/`):** Deployed to **Vercel** (`https://flashmvp.vercel.app`) with `VITE_DEMO_MODE=true` for 24/7 static judge testing, featuring simulated real-time IBM Cloud Code Engine build logs and live container telemetry.
* **Backend Proxy (`server/`):** 
  * **Development & Video Pitch:** Local FastAPI + IBM Cloud CLI + Docker Desktop + `cloudflared` tunnel (`DEMO_MODE=false`).
  * **24/7 Cloud Host:** GCP `e2-micro` Always Free VM running FastAPI IBM Proxy middleware.

---

## 4. Container Resource & Memory Safeguards (1GB RAM Optimization)

To maintain high performance on a 1GB VM during user/judge testing, the backend enforces:
1. **10-Minute Idle Auto-Teardown (TTL):** Background task automatically stops and removes user containers older than 10 minutes (`docker stop` + `docker rm`).
2. **Max Active Container Quota:** Caps concurrent active containers to max 3. If a 4th container is launched, the oldest container is automatically purged.
3. **One-Click Admin Purge:** Admin dashboard button to clean inactive containers in 1 second.
