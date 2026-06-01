# Deployment Guide — MediStore Pro

## Prerequisites
- Docker ≥ 24 and Docker Compose v2
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

---

## Quick Start (Docker Compose)

```bash
# 1. Clone / enter the project
cd medical-store-management

# 2. Create env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start all services (postgres + backend + frontend)
docker compose up --build

# Services started:
#   PostgreSQL  → localhost:5432
#   Backend API → http://localhost:8000
#   Frontend    → http://localhost:3000
#   Swagger UI  → http://localhost:8000/api/docs/
```

On first boot, Django automatically:
1. Runs all migrations
2. Runs `python manage.py seed_data` — creates 4 default users

---

## Default Login Credentials

| Role               | Email                      | Password       |
|--------------------|----------------------------|----------------|
| Admin              | admin@medistore.com        | Admin@1234     |
| Pharmacist         | pharmacist@medistore.com   | Pharma@1234    |
| Cashier            | cashier@medistore.com      | Cashier@1234   |
| Inventory Manager  | inventory@medistore.com    | Inventory@1234 |

**Change all passwords after first login.**

---

## Local Development (without Docker)

### Backend
```bash
cd backend

# Create virtualenv
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env — set POSTGRES_HOST=localhost

# Run migrations and seed
python manage.py migrate
python manage.py seed_data

# Start dev server
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                         | Description                        | Default                  |
|----------------------------------|------------------------------------|--------------------------|
| `SECRET_KEY`                     | Django secret key                  | (change in production)   |
| `DEBUG`                          | Enable debug mode                  | `True`                   |
| `DATABASE_URL`                   | PostgreSQL connection string        | auto-built from parts    |
| `POSTGRES_DB`                    | Database name                      | `medical_store`          |
| `POSTGRES_USER`                  | DB username                        | `msm_user`               |
| `POSTGRES_PASSWORD`              | DB password                        | `msm_secret`             |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | Access token lifetime           | `60`                     |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS`   | Refresh token lifetime          | `7`                      |
| `AWS_ACCESS_KEY_ID`              | AWS key for S3 prescriptions       | —                        |
| `AWS_SECRET_ACCESS_KEY`          | AWS secret for S3                  | —                        |
| `AWS_STORAGE_BUCKET_NAME`        | S3 bucket name                     | —                        |
| `CORS_ALLOWED_ORIGINS`           | Comma-separated allowed origins    | `http://localhost:3000`  |

### Frontend (`frontend/.env`)

| Variable             | Description          | Default                        |
|----------------------|----------------------|--------------------------------|
| `REACT_APP_API_URL`  | Backend API base URL | `http://localhost:8000/api/v1` |

---

## Production Checklist

- [ ] Set `DEBUG=False` and `DJANGO_SETTINGS_MODULE=config.settings.production`
- [ ] Generate a strong `SECRET_KEY` (`python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Set `CORS_ALLOWED_ORIGINS` to your frontend domain only
- [ ] Use RDS (PostgreSQL) with SSL (`ssl_require=True` already in production settings)
- [ ] Configure AWS S3 credentials for prescription file uploads
- [ ] Set up HTTPS (nginx + certbot, or AWS ALB + ACM)
- [ ] Run `python manage.py collectstatic` before deployment
- [ ] Configure Celery + Redis for async notifications (optional in Phase 1)
- [ ] Change all default user passwords

---

## API Documentation

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc:       `http://localhost:8000/api/redoc/`
- OpenAPI JSON: `http://localhost:8000/api/schema/`
- Django Admin: `http://localhost:8000/admin/`

---

## Database Migrations

```bash
# Create new migration after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

---

## Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=html

# Run specific app tests
pytest apps/authentication/tests.py -v
```
