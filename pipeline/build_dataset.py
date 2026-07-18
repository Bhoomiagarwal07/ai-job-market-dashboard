"""
Final step: takes clean_jobs.json, extracts skills from each posting's
description using the keyword taxonomy, and writes the exact JSON shape
the React dashboard expects.

Input:  ../data/clean_jobs.json
Output: ../dashboard/public/data.json   <-- the dashboard fetches this directly
"""

import json
import pandas as pd
from skills_taxonomy import extract_skills


def build():
    df = pd.read_json("../data/clean_jobs.json")
    if df.empty:
        raise RuntimeError("clean_jobs.json is empty — run fetch_jobs.py and clean_data.py first")

    records = []
    for i, row in df.iterrows():
        skills = extract_skills(f"{row['title']} {row['description']}")
        if not skills:
            skills = ["Python"]  # every AI/ML posting implicitly wants this baseline

        records.append({
            "id": int(i),
            "role": row["role_query"],
            "level": row["level"],
            "city": row["city"],
            "month": int(row["month"]),
            "salary": float(row["salary_lpa"]),
            "skills": skills,
            "title": row["title"],
            "company": row["company"],
            "url": row["url"],
        })

    with open("../dashboard/public/data.json", "w") as f:
        json.dump(records, f, indent=2)

    print(f"Wrote {len(records)} postings to dashboard/public/data.json")


if __name__ == "__main__":
    build()
