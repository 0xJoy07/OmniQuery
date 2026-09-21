from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_docs(docs):
    """Split documents into smaller chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    return splitter.split_documents(docs)
