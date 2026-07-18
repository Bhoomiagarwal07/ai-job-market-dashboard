"""
Fetches real AI/ML job postings for India using the Adzuna Jobs API.

Why Adzuna and not scraping LinkedIn/Naukri directly?
- LinkedIn and Naukri both actively block scrapers and their ToS prohibits it.
- Adzuna has a free, legal public API (500 calls/month on the free tier) that
  indexes postings aggregated from many boards, which is enough for a
  portfolio-scale dataset.
- If you later want more volume, official APIs from Naukri (via their partner
  program) or paid aggregators (e.g. JSearch on RapidAPI) are legal alternatives.

Setup:
  1. Sign up free at https://developer.adzuna.com/
  2. Get your app_id and app_key
  3. Copy .env.example to .env and fill them in
  4. Run: python fetch_jobs.py
"""

import os
import time
import json
import requests
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("ADZUNA_APP_ID")
APP_KEY = os.getenv("ADZUNA_APP_KEY")
COUNTRY = "in"  # India
BASE_URL = f"https://api.adzuna.com/v1/api/jobs/{COUNTRY}/search"

# Search queries mapped to the role bucket we want to tag them with.
# Adzuna doesn't give a clean "role" field, so we search separately per role
# and tag results with the query that found them (cleaned/reconciled later).
QUERIES = {
    "AI Engineer": "AI engineer",
    "GenAI Engineer": "generative AI engineer",
    "ML Engineer": "machine learning engineer",
    "Data Scientist": "data scientist",
}

RESULTS_PER_QUERY = 50  # keep modest to stay within free-tier call limits
PAGE_SIZE = 20


def fetch_role(role_label: str, query: str) -> list[dict]:
    if not APP_ID or not APP_KEY:
        raise RuntimeError("Missing ADZUNA_APP_ID / ADZUNA_APP_KEY — check your .env file")

    results = []
    page = 1
    while len(results) < RESULTS_PER_QUERY:
        params = {
            "app_id": APP_ID,
            "app_key": APP_KEY,
            "what": query,
            "results_per_page": PAGE_SIZE,
            "content-type": "application/json",
        }
        resp = requests.get(f"{BASE_URL}/{page}", params=params, timeout=15)
        if resp.status_code != 200:
            print(f"  [warn] {role_label} page {page}: HTTP {resp.status_code}, stopping")
            break

        batch = resp.json().get("results", [])
        if not batch:
            break

        for job in batch:
            results.append({
                "role_query": role_label,
                "title": job.get("title", ""),
                "company": (job.get("company") or {}).get("display_name", "Unknown"),
                "location": (job.get("location") or {}).get("display_name", "Unknown"),
                "description": job.get("description", ""),
                "salary_min": job.get("salary_min"),
                "salary_max": job.get("salary_max"),
                "created": job.get("created", ""),
                "url": job.get("redirect_url", ""),
            })

        page += 1
        time.sleep(0.5)  # be polite to the API

    return results[:RESULTS_PER_QUERY]


def main():
    all_jobs = []
    for role_label, query in QUERIES.items():
        print(f"Fetching: {role_label} ...")
        jobs = fetch_role(role_label, query)
        print(f"  -> {len(jobs)} postings")
        all_jobs.extend(jobs)

    os.makedirs("../data", exist_ok=True)
    with open("../data/raw_jobs.json", "w") as f:
        json.dump(all_jobs, f, indent=2)

    print(f"\nSaved {len(all_jobs)} raw postings to data/raw_jobs.json")


if __name__ == "__main__":
    main()
