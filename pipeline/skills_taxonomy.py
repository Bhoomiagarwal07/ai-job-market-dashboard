"""
Skill taxonomy used to extract skills from raw job description text.
Each entry: canonical_name -> list of regex-safe keyword variants to search for.

Extend this list any time you notice a real posting mentioning a skill
that isn't being picked up — that's the normal workflow for keyword-based
skill extraction (no ML/NER needed to get started).
"""

SKILLS_TAXONOMY = {
    "Python": ["python"],
    "SQL": ["sql", "mysql", "postgresql", "postgres"],
    "Git": ["git", "github", "gitlab"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
    "PyTorch/TensorFlow": ["pytorch", "tensorflow", "torch"],
    "Feature Engineering": ["feature engineering"],
    "MLOps": ["mlops", "ml ops", "model deployment", "model monitoring"],
    "LangChain": ["langchain"],
    "RAG Pipelines": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Vector Databases": ["vector database", "pinecone", "chromadb", "chroma db", "weaviate", "milvus", "faiss", "pgvector"],
    "Prompt Engineering": ["prompt engineering", "prompt design"],
    "Hugging Face": ["hugging face", "huggingface", "transformers library"],
    "Agentic AI / LangGraph": ["langgraph", "agentic ai", "ai agents", "multi-agent", "crewai", "autogen"],
    "LLM Fine-tuning": ["fine-tuning", "fine tuning", "lora", "qlora", "peft"],
    "Cloud (AWS/GCP/Azure)": ["aws", "gcp", "azure", "sagemaker", "vertex ai"],
    "Docker": ["docker", "containeriz", "kubernetes", "k8s"],
    "RAGAS / LangSmith Eval": ["ragas", "langsmith", "llm evaluation", "eval pipeline"],
    "Pandas": ["pandas"],
    "Statistics": ["statistics", "statistical analysis", "hypothesis testing"],
    "Tableau/Power BI": ["tableau", "power bi", "powerbi"],
    "A/B Testing": ["a/b testing", "ab testing", "experimentation"],
}


def extract_skills(text: str) -> list[str]:
    """Return canonical skill names found in a job description/title string."""
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for canonical, variants in SKILLS_TAXONOMY.items():
        if any(v in text_lower for v in variants):
            found.append(canonical)
    return found
