import os

from langchain_chroma import Chroma
from .embed import get_embedding_model


DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "db", "web_chroma")


def save_to_chroma(chunks):
    """Save document chunks to ChromaDB vector store."""
    vector_db = Chroma.from_documents(
        documents=chunks,
        embedding=get_embedding_model(),
        persist_directory=DB_PATH
    )
    return vector_db


def load_chroma():
    """Load the existing ChromaDB vector store."""
    return Chroma(
        persist_directory=DB_PATH,
        embedding_function=get_embedding_model()
    )
