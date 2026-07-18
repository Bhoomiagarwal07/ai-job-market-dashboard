Development Guide

Detailed setup, architecture reasoning, and extension ideas for this project.

Full local setup

1. Data pipeline

bashcd pipeline
pip install -r requirements.txt
cp ../.env.example ../.env

Get free Adzuna API credentials at https://developer.adzuna.com/ (instant signup), then fill in .env:

ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here

Run the pipeline:

bashpython fetch_jobs.py     # pulls real postings -> data/raw_jobs.json
python clean_data.py     # cleans -> data/clean_jobs.json
python build_dataset.py  # extracts skills -> dashboard/public/data.json

2. Dashboard

bashcd dashboard
npm install
npm run dev

Tech stack reasoning (for interviews / code review)

ChoiceWhyAdzuna API over scrapingLinkedIn/Naukri block scrapers and prohibit it in ToS. A legal, free API is the correct engineering choice, not just the easier one.pandas for cleaningDedup, filtering, and column transforms are naturally vectorized — the right tool over manual loops.Keyword taxonomy over NER/ML for skill extractionTransparent, fast, zero training cost, easy to extend. A proper NER model would generalize better to novel phrasing — a legitimate tradeoff to discuss, not an oversight.Static JSON file over a databaseDataset is small, refreshed periodically (not real-time), and read-only from the frontend. A database would be over-engineering at this scale.Vite over Create React AppFaster dev server startup and build times.Recharts over D3Declarative, composes well with React state; D3 gives more control but far more code for standard chart types.GitHub Actions for auto-refreshFree, versioned, and demonstrates a real CI/CD automation pattern rather than a one-off script.

Auto-refresh via GitHub Actions

.github/workflows/refresh-data.yml re-runs the full pipeline daily and commits the refreshed dashboard/public/data.json back to the repo. Since Vercel auto-deploys on every push, this means the live site updates itself daily with zero manual work.

One-time setup: add ADZUNA_APP_ID and ADZUNA_APP_KEY as GitHub repo secrets (Settings → Secrets and variables → Actions → New repository secret).

Manual trigger: Actions tab → "Refresh Job Market Data" → Run workflow.

Project structure

ai-job-market-dashboard/
├── pipeline/
│   ├── fetch_jobs.py         # pulls postings from Adzuna API
│   ├── clean_data.py         # dedup, standardize, salary conversion
│   ├── build_dataset.py      # skill extraction + final shape for frontend
│   ├── skills_taxonomy.py    # keyword-based skill dictionary
│   └── requirements.txt
├── dashboard/
│   ├── src/App.jsx           # main dashboard component
│   ├── public/data.json      # current dataset (refreshed by pipeline)
│   └── package.json
├── .github/workflows/refresh-data.yml
├── data/                     # raw/clean intermediate files (gitignored)
├── .env.example
└── README.md

What I'd extend next


Swap keyword-based skill extraction for a lightweight NER model or LLM-based extraction, and compare precision/recall against the keyword baseline
Add a small backend (FastAPI) + database once the dataset grows enough that a static JSON file stops being sustainable
Track historical trends by timestamping each pipeline run instead of overwriting data.json
Fuzzy-match deduplication instead of exact title+company matching