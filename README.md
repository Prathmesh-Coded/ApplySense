# ApplySense

ApplySense is a self-hosted job application tracker. It helps you keep application details and status changes together, with Gmail-based tracking planned for a later phase. Your data stays in the Supabase project you configure.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Backend: FastAPI, Python, Supabase Python client
- Database and authentication: Supabase Auth and Postgres with row-level security

## Requirements

- Node.js 20 or later
- Python 3.11 or later
- A Supabase project with `backend/migrations/initial_schema.sql` applied

## Configure Supabase

In the Supabase dashboard, enable email authentication and set the Auth site URL to `http://localhost:3000` for local development. Copy the project URL and publishable key for the frontend. The backend also needs the project's secret key and JWT signing secret; find the latter in the project's JWT settings. Never expose the secret key or JWT secret to the frontend or commit them.

Copy `frontend/.env.example` to `frontend/.env.local` and fill in the values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```dotenv
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_JWT_SECRET=
FRONTEND_URL=http://localhost:3000
```

The frontend and backend `.gitignore` files exclude local env files.

## Run locally

Install frontend dependencies and start Next.js:

```bash
cd frontend
npm install
npm run dev
```

In another terminal, install backend dependencies and start FastAPI:

```bash
cd backend
python -m venv .venv
```

Activate the environment with `.venv\Scripts\activate` on Windows or `source .venv/bin/activate` on macOS/Linux, then run:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Open [http://localhost:3000](http://localhost:3000), create an account, and add applications. The API health endpoint is available at [http://localhost:8000/health](http://localhost:8000/health).

## Current scope

Applications can be created, listed, edited, and deleted. Gmail connection, email classification, timeline events, and reminders are planned for later implementation phases.

## License

ApplySense is licensed under the MIT License. See [LICENSE](./LICENSE).
