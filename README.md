# Alpango Design and Build — Employee Tracker (Vercel deployment)

This version is ready to become a real, public website with its own link
(like `alpango-tracker.vercel.app`) — no laptop needs to stay running,
no localhost. Do this once, and the link works for anyone, anytime.

## What you need first
- A free GitHub account (github.com)
- A free Vercel account (vercel.com) — you can sign up using your GitHub
  account in one click, no separate password needed
- Your Anthropic API key (console.anthropic.com → Settings → API Keys)

## Step 1 — Put the code on GitHub
1. Go to github.com, click the **+** in the top right → **New repository**.
2. Name it something like `alpango-employee-tracker`. Keep it **Private**
   (recommended, since it's for a specific company).
3. On the "quick setup" page GitHub shows you, follow the instructions
   under "…or push an existing repository from the command line" — run
   those commands from inside this folder in a terminal.

   (If you've never used git before, GitHub Desktop — desktop.github.com —
   lets you do this by clicking buttons instead of typing commands: open
   it, add this folder as a repository, and click "Publish repository".)

## Step 2 — Import it into Vercel
1. Go to vercel.com, sign in with GitHub.
2. Click **Add New → Project**.
3. Select the `alpango-employee-tracker` repo you just pushed.
4. Vercel will auto-detect it's a Vite project — leave the default
   settings as they are.
5. Before clicking Deploy, open **Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your real API key
6. Click **Deploy**. Wait about a minute.

## Step 3 — Get your link
Once it finishes, Vercel shows you a real URL, like:
`https://alpango-employee-tracker.vercel.app`

That's the link you send. It works on any device, for anyone, with no
setup on their end — the dashboard, Insights charts, and AI chat all
work immediately.

## Updating it later
Any time you want to change something: edit the code, push to GitHub
again (`git add . && git commit -m "update" && git push`), and Vercel
automatically redeploys the same link with your changes — usually
within a minute.

## Important
- Never commit your real API key into the code or push a `.env` file to
  GitHub — it's already excluded via `.gitignore`. The key only lives in
  Vercel's Environment Variables setting, which is private to you.
- Vercel's free plan is enough for a demo like this — no cost.
