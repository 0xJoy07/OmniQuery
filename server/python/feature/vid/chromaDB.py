import os
from langchain_chroma import Chroma
from embed import get_embedding_model

DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "db", "youtube_chroma")
)


def get_collection_name(video_id):
    return f"youtube_{video_id}"


def save_to_chroma(chunks, video_id):
    collection_name = get_collection_name(video_id)

    vector_db = Chroma(
        collection_name=collection_name,
        persist_directory=DB_PATH,
        embedding_function=get_embedding_model()
    )

    vector_db.add_documents(chunks)

    return vector_db


def load_chroma(video_id):
    collection_name = get_collection_name(video_id)

    return Chroma(
        collection_name=collection_name,
        persist_directory=DB_PATH,
        embedding_function=get_embedding_model()
    )