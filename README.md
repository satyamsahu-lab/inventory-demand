# Inventory Demand

Full-stack Inventory Demand system.

## Monorepo
- `backend/` Node.js + Express + PostgreSQL (JWT + RBAC)
- `frontend/` React + Tailwind + AG Grid + Apache ECharts

## Setup

### 1) Environment
Copy env templates:
- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`

### 2) Install
```bash
npm install
```

### 3) Database
Create a Postgres database, then run:
```bash
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
```

### 4) Run
```bash
npm run dev
```

## Notes
- Backend serves uploads from `/uploads`.
- Password reset uses SMTP settings in `backend/.env`.
