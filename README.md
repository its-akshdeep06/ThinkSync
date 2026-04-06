# ThinkSync

AI-powered repository intelligence platform. Connect your GitHub repositories, visualize code structure, and gain deep insights into your codebase.

## Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router
- **TypeScript** — Type-safe development
- **Tailwind CSS 4** — Utility-first styling
- **Radix UI** — Accessible component primitives
- **Lucide React** — Icon library
- **Recharts** — Data visualization

### Backend
- **Node.js + Express** — REST API server
- **Supabase** — PostgreSQL database & auth
- **Octokit** — GitHub API integration
- **JWT** — Token-based authentication

## Project Structure

```
ThinkSync/
├── app/                    # Next.js pages (App Router)
│   ├── api/auth/           # OAuth callback handler
│   ├── dashboard/          # Dashboard page
│   └── repo/[id]/          # Repository detail pages
├── components/             # React components
│   └── ui/                 # Reusable UI primitives
├── backend/                # Express REST API
│   └── src/
│       ├── routes/         # API route handlers
│       ├── middleware/     # Auth middleware
│       └── lib/            # Utility libraries
├── lib/                    # Shared utilities & API client
├── hooks/                  # Custom React hooks
├── styles/                 # Global CSS
└── public/                 # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub OAuth App credentials
- Supabase project

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

### Environment Variables

#### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `JWT_SECRET` | Secret for JWT signing |
| `PORT` | API server port (default: 4000) |
| `FRONTEND_URL` | Frontend URL (default: http://localhost:3000) |

## License

MIT