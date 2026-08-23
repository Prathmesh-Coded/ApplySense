# ApplySense

## Problem

Job seekers manually log applications in spreadsheets or worse, keep everything in their head, while status updates (interviews, rejections, onboarding invites) arrive via email and are easy to miss or forget to log — including company-specific emails like pre-onboarding session invites that don't follow standard "interview/rejected" wording.

## Solution

A web app that connects to a user's Gmail, automatically detects and classifies job-application-related emails, and maintains a timeline per application with intelligent, context-aware classification.


---

## Tech Stack

### Frontend

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend

- **Framework**: FastAPI / Python
- **Key Libraries**: Gmail API client, LLM integration (Groq/Gemini)
- **Deployment**: Railway / Render

### Infrastructure

- **Database**: Supabase
- **Authentication**: OAuth2 (Gmail)
- **LLM**: Groq / Google Gemini

---

## Repository Structure

```
ApplySense/
├── frontend/           # Next.js web application
│   └── ...
├── backend/            # FastAPI backend service
│   └── ...
├── .gitignore
├── LICENSE
└── README.md           # This file
```

---

## Getting Started (Development)

### Prerequisites

- Node.js 24+ (frontend)
- Python 3.14+ (backend)
- PostgreSQL (local or Supabase)
- Gmail API credentials (OAuth2 setup)
- Groq / Gemini API key

### Frontend

```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend

```bash
cd Backend
python -m venv venv
venv\Scripts\activate   #On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

---

## License

See [LICENSE](./LICENSE) for details.