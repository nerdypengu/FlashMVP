# Architecture Decision Record (ADR) 0001: Backend Hosting & 24/7 Container Execution Strategy

| Metadata | Details |
| :--- | :--- |
| **Status** | Accepted — Primary 24/7 Cloud Architecture |
| **Date** | 2026-09-25 |
| **Authors** | FlashMVP Architecture Team |
| **Deciders** | Platform Core Team |
| **Relates To** | PRD §2.4, Architecture Spec §4.2, Backlog `50-container-playground-observability` |

---

## 1. Context & Problem Statement

FlashMVP allows users to generate, deploy, and test full-stack web applications as isolated Docker containers (`frontend` on port 3001, `backend` on port 8001). 

During the hackathon judging period, the platform must satisfy two conflicting constraints:
1. **24/7 Availability:** Anonymous judges must be able to visit and test the FlashMVP platform link at any time (day or night) without team members keeping personal laptops powered on 24/7.
2. **Docker Engine Access:** The FastAPI backend requires access to a Docker daemon (`docker-py` / `/var/run/docker.sock`) to build, run, monitor, and stream logs for user containers.

Standard free serverless platforms (such as Vercel or standard free PaaS tiers) **block Docker socket access** and enforce 10-15 second execution timeouts.

---

## 2. Options Evaluated

### Option A: GCP `e2-micro` Always Free VM *(TOP PICK & ACCEPTED)*
* **Mechanism:** 1 `e2-micro` instance in `us-central1`, `us-west1`, or `us-east1`. Includes 744 hours/month (24/7 uptime) for **$0 forever**.
* **Pros:** 
  * Native x86_64 architecture (avoids ARM image compatibility landmines).
  * Standard Ubuntu VM with root SSH access to install Docker natively (`get.docker.com`) and mount `/var/run/docker.sock`.
  * Instant provisioning with no "out of capacity" queues.
  * New GCP accounts include $300 in credits (allows temporarily bumping to `e2-small` 2GB RAM for judging day for $0 out of pocket).
* **Cons:** Base e2-micro is ~1GB RAM; requires resource safeguards (Section 4).

### Option B: Local Laptop + Cloudflare Quick Tunnel (`cloudflared`) *(Development Phase)*
* **Mechanism:** FastAPI backend runs on a team member's laptop with Docker Desktop open. `cloudflared` tunnels `http://localhost:8000` to a public URL (`https://xxxx.trycloudflare.com`).
* **Pros:** $0 cost, instant local velocity.
* **Cons (Blocker for 24/7):** Requires laptop to be powered on continuously.

### Option C: AWS Free Tier `t2.micro` / `t3.micro` *(Backup Cloud Pick)*
* **Mechanism:** 12-month free tier x86 VM. Install Docker natively.
* **Cons:** 12-month limit vs GCP's Always Free tier.

### Option D: Oracle Cloud ARM Always Free (Rejected)
* **Reason for Rejection:** Frequent "out of capacity" provisioning errors, account signup anti-fraud rejections, and ARM architecture image compatibility risks with x86 user Docker base images.

---

## 3. Final Deployment Architecture

* **Frontend (`client/`):** Deployed to **Vercel** (`https://flashmvp.vercel.app`) for instant global CDN delivery and free SSL.
* **Backend (`server/`):** 
  * **Development Phase:** Local Laptop + Docker Desktop + `cloudflared` tunnel.
  * **24/7 Judging Phase:** GCP `e2-micro` Always Free VM in `us-central1` with native Docker installed and Cloudflare free proxy / SSL.

---

## 4. Container Resource & Memory Safeguards (1GB RAM Optimization)

To maintain high performance on a 1GB VM during user/judge testing, the backend enforces:
1. **10-Minute Idle Auto-Teardown (TTL):** Background task automatically stops and removes user containers older than 10 minutes (`docker stop` + `docker rm`).
2. **Max Active Container Quota:** Caps concurrent active containers to max 3. If a 4th container is launched, the oldest container is automatically purged.
3. **One-Click Admin Purge:** Admin dashboard button to clean inactive containers in 1 second.
