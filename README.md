# Wealth Journal — 90 Day Foundations

A daily wealth mindset journal with magic link auth, persistent cloud storage, and mindset trend tracking.

## Setup (15 min)

### 1. Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `wealth-journal`, pick a region, set a DB password
3. Once created, go to **SQL Editor** → paste the contents of `supabase-setup.sql` → Run
4. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel URL (after deploy) or `http://localhost:5173` for now
   - Add `http://localhost:5173` to **Redirect URLs**
5. Go to **Project Settings → API** → copy your **Project URL** and **anon public key**

### 2. Local Setup (3 min)

```bash
cp .env.example .env
```

Edit `.env` with your Supabase values:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

```bash
npm install
npm run dev
```

Open http://localhost:5173

### 3. Deploy to Vercel (5 min)

1. Push to GitHub:
```bash
git init
git add .
git commit -m "wealth journal"
gh repo create wealth-journal --private --push
```

2. Go to [vercel.com](https://vercel.com) → Import from GitHub
3. Select your repo
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` → your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Deploy

6. **Important**: Go back to Supabase → Authentication → URL Configuration:
   - Update **Site URL** to your Vercel URL (e.g., `https://wealth-journal.vercel.app`)
   - Add it to **Redirect URLs** too

That's it. Magic link login works, data syncs across all devices.

## Architecture

- **Frontend**: Vite + React
- **Auth**: Supabase magic link (passwordless email)
- **Database**: Supabase Postgres with Row Level Security
- **Hosting**: Vercel (static)

One table: `journal_entries` with `user_id`, `entry_date`, and `data` (JSONB).
Each user can only read/write their own entries (RLS policies).
