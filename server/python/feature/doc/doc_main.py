from .doc_loader import load_document
from .chunking import chunk_docs
from .chromaDB import save_to_chroma, load_chroma
from .response_generator import generate_response


def doc_pipeline(file_path, question, history=[]):

    # Only process the file if it was uploaded
    if file_path:
        docs = load_document(file_path)
        chunks = chunk_docs(docs)

        print("Total chunks:", len(chunks))

        save_to_chroma(chunks)

        print("Document data saved in db/doc_chroma")

    vector_db = load_chroma()
    results = vector_db.similarity_search(question, k=3)

    answer = generate_response(question, results, history)

    return answer


def main():
    file_path = input("Enter document file path: ")
    question = input("Ask a question about the document: ")

    try:
        answer = doc_pipeline(file_path, question)

        print("\n--- Answer ---")
        print(answer)

    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    main()
