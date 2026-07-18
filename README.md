# AI Job Market Dashboard — India

An interactive dashboard analyzing real AI/ML/GenAI job postings in India — skill demand, salary bands by experience level and city, GenAI skill momentum over time, and a personal "skill gap checker" that tells you what to learn next for a target role.

**Live demo:** *(add your deployed link here after following the deploy steps below)*

---

## Why this project

Most beginner portfolios do generic Kaggle-dataset analysis. This project instead:
- Pulls **real job postings** via a public API (not a static downloaded dataset)
- Runs them through an actual **data pipeline** (fetch → clean → extract features → serve)
- Is directly relevant to an AI Engineer job search — the questions it answers are the ones I actually needed answered

---

## Architecture

```
Adzuna Jobs API
      │
      ▼
pipeline/fetch_jobs.py      →  data/raw_jobs.json      (raw API responses)
      │
      ▼
pipeline/clean_data.py      →  data/clean_jobs.json     (deduped, standardized, salary in LPA)
      │
      ▼
pipeline/build_dataset.py   →  dashboard/public/data.json  (skills extracted, shaped for the UI)
      │
      ▼
dashboard/ (React + Vite)   →  interactive charts & filters, served as a static site
```

Each pipeline stage writes its output to a file rather than passing data in memory — this makes each stage independently re-runnable and debuggable, which matters a lot when you're iterating on cleaning/extraction logic.

---

## Tech stack (and why each piece was chosen)

| Layer | Tool | Why |
|---|---|---|
| Data source | **Adzuna Jobs API** | Free, legal, ToS-compliant job aggregator API. LinkedIn/Naukri actively block scraping and prohibit it in their ToS — using a proper API avoids that entirely and is the "correct" engineering choice, not just an easier one. |
| Data pipeline | **Python + `requests`** | Standard for API calls; `requests` over raw `urllib` for readability and easier error handling. |
| Data cleaning | **pandas** | Dedup, filtering, and column transforms are naturally vectorized operations — pandas is the right tool over writing manual loops. |
| Skill extraction | **Keyword taxonomy (`skills_taxonomy.py`)** | A simple, explainable, fast approach — no ML/NER needed to get real signal. This is a legitimate engineering tradeoff to be able to explain: a proper NER model would generalize better to skills phrased in new ways, but keyword matching is transparent, easy to extend, and has zero training cost — the right choice at this project's scale. |
| Config/secrets | **`python-dotenv`** | Keeps API keys out of source code — a `.env` file (gitignored) holds real credentials, `.env.example` documents what's needed. |
| Frontend framework | **React + Vite** | Vite over Create React App for faster dev server startup and build times; React for component-based UI state management (filters, selected skills, etc.) |
| Charts | **Recharts** | Declarative, React-native charting library — composes well with component state, good documentation, widely used in industry (a reasonable "why this and not D3" answer for interviews: D3 gives more control but far more code for standard chart types). |
| Styling | **Inline styles + CSS variables pattern** | No CSS framework dependency for a project this size; keeps everything in one file per component, easy to reason about. |
| Data handoff | **Static JSON file (`public/data.json`)** | No backend/database needed — the pipeline writes a JSON file directly into the frontend's public folder, and the frontend just fetches it. This is a deliberate simplicity choice: a "real" production version would swap this for a database + API endpoint, but for a portfolio project serving a static file is honest about the actual data freshness (refreshed by re-running the pipeline, not live). |

**If asked "why no database/backend":** the dataset is small (hundreds of postings), refreshed periodically rather than in real time, and read-only from the frontend's perspective — a static JSON file is the simplest correct solution. Adding a database would be over-engineering for this scale, and I can articulate that tradeoff rather than just not having done it.

---

## Setup & running locally

### 1. Get the data pipeline running

```bash
cd pipeline
pip install -r requirements.txt
cp ../.env.example ../.env   # then fill in your Adzuna credentials
python fetch_jobs.py         # pulls real postings -> data/raw_jobs.json
python clean_data.py         # cleans -> data/clean_jobs.json
python build_dataset.py      # extracts skills -> dashboard/public/data.json
```

Free Adzuna API credentials: https://developer.adzuna.com/ (instant signup, 500 free calls/month).

### 2. Run the dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). It works out of the box with the included **sample `data.json`** even before you run the pipeline — so you can see the UI immediately, then swap in real data once your API key is set up.

---

## Deploying it live

The dashboard is a static site after `npm run build` — deploy the `dashboard/dist` folder to **Vercel**, **Netlify**, or **GitHub Pages** for free. Simplest path:

```bash
cd dashboard
npm run build
npx vercel deploy --prod   # or drag the dist/ folder into Netlify's dashboard
```

For live-refreshing data, set up a scheduled job (GitHub Actions cron, or a free Render cron job) to re-run the pipeline daily/weekly and re-deploy.

---

## Project structure

```
ai-job-market-dashboard/
├── pipeline/
│   ├── fetch_jobs.py         # pulls postings from Adzuna API
│   ├── clean_data.py         # dedup, standardize, salary conversion
│   ├── build_dataset.py      # skill extraction + final shape for frontend
│   ├── skills_taxonomy.py    # keyword-based skill dictionary
│   └── requirements.txt
├── dashboard/
│   ├── src/App.jsx           # main dashboard component (filters, charts, gap checker)
│   ├── public/data.json      # sample data (replaced by pipeline output)
│   └── package.json
├── data/                     # raw/clean intermediate files (gitignored)
├── .env.example
└── README.md
```

---

## What I'd extend next (good talking points for "how would you improve this")
- Swap keyword-based skill extraction for a lightweight NER model or an LLM-based extraction call, and compare precision/recall against the keyword baseline
- Add a small backend (FastAPI) + database (SQLite/Postgres) once the dataset grows enough that "refresh by re-running a script" stops being sustainable
- Add historical trend tracking by storing each pipeline run's output with a timestamp, instead of overwriting `data.json` each time
- Deduplicate more aggressively using fuzzy title matching (currently exact title+company match)
