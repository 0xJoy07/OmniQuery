from .webLoader import webLoader
from .chuncking import chunk_docs
from .chromaDB import save_to_chroma, load_chroma
from .response_generator import generate_response


def web_pipeline(url, question):
    """
    Full web RAG pipeline:
    1. Load webpage content
    2. Chunk documents
    3. Save to ChromaDB
    4. Retrieve relevant context
    5. Generate response using Groq LLM
    """
    # Load and process the webpage
    docs = webLoader(url)
    chunks = chunk_docs(docs)
    save_to_chroma(chunks)

    print("Web data saved in db/web_chroma")

    # Retrieve relevant context and generate response
    vector_db = load_chroma()
    results = vector_db.similarity_search(question, k=3)

    answer = generate_response(question, results)
    return answer
