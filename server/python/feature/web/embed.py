import os

from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings as Embed


def get_embedding_model():
    """Return the Google Generative AI embedding model."""
    load_dotenv()
    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ValueError("Add GOOGLE_API_KEY in your .env file")

    return Embed(
        model="models/gemini-embedding-001",
        google_api_key=api_key
    )
