# MediStore Pro — Pharmacy Management System

Production-ready Medical Store Management System for retail and wholesale pharmacies.

## Phase 1 Deliverables (Complete)

| Item                         | Status |
|------------------------------|--------|
| Project architecture         | Done   |
| Folder structure             | Done   |
| Database schema (PostgreSQL) | Done   |
| Entity Relationship Diagram  | Done   |
| Backend: Django auth module  | Done   |
| Frontend: React login UI     | Done   |
| Docker Compose setup         | Done   |
| API documentation            | Done   |
| Deployment guide             | Done   |
| Seed data (4 user roles)     | Done   |

## Quick Start

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- Frontend:   http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- Swagger UI:  http://localhost:8000/api/docs/

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full setup instructions.

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | React 18, TypeScript, Material UI 5, React Query  |
| Backend   | Python 3.11, Django 4.2, Django REST Framework    |
| Auth      | JWT (SimpleJWT) with refresh token rotation       |
| Database  | PostgreSQL 15                                     |
| Storage   | AWS S3 (prescriptions)                            |
| Deploy    | Docker + Docker Compose                           |

## Modules Roadmap

- **Phase 1** — Auth, Dashboard UI, DB Schema (current)
- **Phase 2** — Medicine + Inventory Management
- **Phase 3** — Purchase Management + Supplier Ledger
- **Phase 4** — POS Billing + GST + PDF Invoices
- **Phase 5** — Reports + Export (PDF/Excel)
- **Phase 6** — Customer Loyalty + Prescriptions (S3)
- **Phase 7** — Notifications + Alerts + Celery

## Docs

- [API Documentation](docs/API.md)
- [ERD](docs/ERD.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
