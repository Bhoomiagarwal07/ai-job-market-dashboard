"""
Cleans raw job postings: dedupes, standardizes locations, drops unusable rows,
converts salary to LPA (Lakhs Per Annum).

Input:  ../data/raw_jobs.json  (from fetch_jobs.py)
Output: ../data/clean_jobs.json
"""

import json
import re
import pandas as pd

CITY_ALIASES = {
    "bengaluru": "Bangalore", "bangalore": "Bangalore",
    "hyderabad": "Hyderabad", "secunderabad": "Hyderabad",
    "mumbai": "Mumbai", "navi mumbai": "Mumbai",
    "delhi": "Delhi NCR", "new delhi": "Delhi NCR", "gurgaon": "Delhi NCR",
    "gurugram": "Delhi NCR", "noida": "Delhi NCR",
    "pune": "Pune", "chennai": "Chennai", "remote": "Remote",
}


def standardize_city(location: str) -> str:
    if not location:
        return "Unknown"
    loc_lower = location.lower()
    for key, standardized in CITY_ALIASES.items():
        if key in loc_lower:
            return standardized
    return location.split(",")[0].strip()  # fallback: first chunk of the string


def to_lpa(value):
    """Adzuna returns annual INR salary figures; convert to Lakhs Per Annum."""
    if value is None:
        return None
    return round(value / 100_000, 1)


def classify_level(title: str, description: str) -> str:
    text = f"{title} {description}".lower()
    if any(w in text for w in ["senior", "sr.", "lead", "principal", "staff", "architect"]):
        return "Senior"
    if any(w in text for w in ["fresher", "junior", "jr.", "entry level", "graduate", "intern"]):
        return "Fresher"
    return "Mid"


def clean(raw_jobs: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(raw_jobs)
    if df.empty:
        return df

    # Dedupe on title + company (common with aggregator APIs)
    df = df.drop_duplicates(subset=["title", "company"])

    # Drop postings with no salary info at all — can't use them for salary analysis
    df = df.dropna(subset=["salary_min", "salary_max"], how="all")

    df["city"] = df["location"].apply(standardize_city)
    df["salary_lpa"] = df.apply(
        lambda r: to_lpa(r["salary_max"] or r["salary_min"]), axis=1
    )
    df["level"] = df.apply(lambda r: classify_level(r["title"], r["description"]), axis=1)
    df["month"] = pd.to_datetime(df["created"], errors="coerce").dt.month.fillna(1).astype(int)

    df = df.dropna(subset=["salary_lpa"])
    df = df[(df["salary_lpa"] > 1) & (df["salary_lpa"] < 100)]  # sanity filter outliers

    return df.reset_index(drop=True)


def main():
    with open("../data/raw_jobs.json") as f:
        raw_jobs = json.load(f)

    df = clean(raw_jobs)
    df.to_json("../data/clean_jobs.json", orient="records", indent=2)
    print(f"Cleaned dataset: {len(df)} postings kept (from {len(raw_jobs)} raw)")


if __name__ == "__main__":
    main()
