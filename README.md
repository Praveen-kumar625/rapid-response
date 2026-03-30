# 📡 Rapid Crisis Response – Local Development Guide

> **setup** – Clone → `npm ci` → `docker compose up -d` → `npm run db:migrate` → `npm run dev` (three terminals).  
> UI: **http://localhost:3000** API: **http://localhost:3001** Worker runs in background pulling external feeds.

---

## Table of Contents
1. [Project Overview](#project-overview)  
2. [Prerequisites](#prerequisites)  
3. [Repository Layout](#repository-layout)  
4. [Setup – Step‑by‑Step](#setup---step‑by‑step)  
   - 4.1 Clone & install  
   - 4.2 Environment variables  
   - 4.3 Start Docker services  
   - 4.4 Run DB migrations  
   - 4.5 Launch the three apps  
5. [Quick Sanity‑Check Checklist](#quick-sanity‑check-checklist)  
6. [Optional: Full Docker‑Compose (production‑like) Run](#optional‑full-docker‑compose‑production‑like‑run)  
7. [Testing & Linting](#testing‑&‑linting)  
8. [Common Gotchas & Tips](#common‑gotchas‑&‑tips)  
9. [Deploy to AWS (cheat‑sheet)](#deploy-to-aws‑cheat‑sheet)  
10. [Contributing](#contributing)  
11. [License](#license)

---

## 1️⃣ Project Overview

| Component | Tech Stack | Port |
|-----------|------------|------|
| **API** | NestJS + TypeORM + PostgreSQL (PostGIS) + Redis (pub/sub) | 3001 |
| **Worker** | Node.js (TypeScript) + node‑cron + Axios | – (no HTTP) |
| **Web UI** | Next.js (React) + Mapbox GL + Socket.io‑client | 3000 |
| **Database** | PostgreSQL + PostGIS (Docker) | 5432 |
| **Cache / Bus** | Redis (Docker) | 6379 |

All three apps live inside a **single Nx monorepo** (`apps/api`, `apps/worker`, `apps/web`) and share type definitions from `libs/contracts`.

---

## 2️⃣ Prerequisites

| Tool | Minimum version |
|------|-----------------|
| **Node** | `20.x` (LTS) |
| **npm** | `10.x` (or `pnpm`/`yarn` – scripts are npm‑centric) |
| **Docker + Docker‑Compose** | `>= 2.25` |
| **Git** | any recent version |
| **(Optional) AWS CLI** | for cloud deployment |
| **(Optional) Terraform** | `>= 1.8` |

> macOS / Linux users can use `nvm` or `asdf` to install Node 20: `nvm install 20 && nvm use 20`.

---


All **Nx** commands are executed from the repository root.

---

## 4️⃣ Setup – Step‑by‑Step  

### 4.1 Clone the repo & install dependencies  

```bash
git clone https://github.com/Praveen-kumar625/rapid-response.git
cd rapid-response
npm ci                # installs root dev deps and links workspaces

  -e NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN \
  -p 3000:3000 rapid-response-web:dev
