# Library Management System Platform

Minimal scaffold for a Library Management System (React frontend, Node/Express backend, PostgreSQL via Prisma).

Quick start with Docker Compose:

```bash
docker-compose up --build
```

Backend: see `backend/` — run `npm install` then `npm run dev` or use Docker.

Frontend: see `frontend/` — uses Vite.

Prisma: `npx prisma generate` and configure `DATABASE_URL` before running migrations.
