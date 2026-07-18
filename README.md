# AI Job Market Dashboard — India 🇮🇳

**Live demo:** [ai-job-market-dashboard-six.vercel.app](https://ai-job-market-dashboard-six.vercel.app/)

An interactive dashboard analyzing real AI/ML/GenAI job postings across India — skill demand, salary bands by experience level and city, GenAI skill momentum over time, and a personal "skill gap checker" that shows you exactly what to learn next for a target role.

![status](https://img.shields.io/badge/data-live-brightgreen) ![stack](https://img.shields.io/badge/stack-React%20%2B%20Python-blue)

---

## What it does

- 📊 **Filters real job postings** by role (AI Engineer / GenAI Engineer / ML Engineer / Data Scientist), experience level, and city
- 🔥 **Tracks skill demand** — see which skills show up most often across current postings
- 💰 **Compares salary bands** by experience level and city
- 📈 **Visualizes GenAI skill momentum** — how fast skills like LangChain, RAG, and Agentic AI are trending
- 🎯 **Skill gap checker** — select the skills you already have, pick a target role, and instantly see your match % and the highest-value skills to learn next

## Why this project exists

Most beginner data projects run one-off analysis on a static Kaggle dataset. This one instead:
- Pulls **live data** from a real job-listings API (not a downloaded CSV)
- Runs it through an actual **data pipeline**: fetch → clean → extract features → serve
- **Refreshes itself automatically every day** via GitHub Actions — no manual re-running needed
- Solves a problem I actually have: knowing what to learn next for my own AI Engineer job search

## Architecture

```
Adzuna Jobs API
      │
      ▼
pipeline/fetch_jobs.py      →  raw postings pulled from the live API
      │
      ▼
pipeline/clean_data.py      →  deduped, standardized, salary converted to LPA
      │
      ▼
pipeline/build_dataset.py   →  skills extracted, shaped for the dashboard
      │
      ▼
dashboard/ (React + Vite)   →  interactive charts, deployed on Vercel
      │
      ▲
.github/workflows/refresh-data.yml   →  re-runs the whole pipeline daily and
                                         commits fresh data automatically
```

## Tech stack

| Layer | Tool |
|---|---|
| Data source | [Adzuna Jobs API](https://developer.adzuna.com/) — free, legal job-listings aggregator |
| Data pipeline | Python, `requests`, `pandas` |
| Skill extraction | Keyword-taxonomy matching (transparent, zero training cost) |
| Frontend | React + Vite |
| Charts | Recharts |
| Automation | GitHub Actions (scheduled daily data refresh) |
| Hosting | Vercel (auto-deploys on every push) |

## Running it locally

```bash
# 1. Set up the data pipeline
cd pipeline
pip install -r requirements.txt
cp ../.env.example ../.env   # add your free Adzuna API credentials
python fetch_jobs.py
python clean_data.py
python build_dataset.py

# 2. Run the dashboard
cd ../dashboard
npm install
npm run dev
```

Full setup, architecture notes, and "what I'd extend next" are in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

## Screenshots



Built as part of my AI Engineering learning journey. Feedback welcome — feel free to open an issue.
