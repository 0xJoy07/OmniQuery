
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_docs(docs):
    """Split transcript documents into smaller chunks."""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )

    return splitter.split_documents(docs)