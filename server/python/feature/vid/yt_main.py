
from .yt_loader import load_youtube_transcript, extract_youtube_video_id
from .chunking import chunk_docs
from .chromaDB import save_to_chroma, load_chroma
from .response_generator import generate_response


def youtube_pipeline(url, question):
    video_id = extract_youtube_video_id(url)

    if not video_id:
        raise ValueError("Invalid YouTube URL")

    docs = load_youtube_transcript(url)
    chunks = chunk_docs(docs)

    print("Total chunks:", len(chunks))

    save_to_chroma(chunks, video_id)

    print(f"Data saved in collection: youtube_{video_id}")

    vector_db = load_chroma(video_id)

    results = vector_db.similarity_search(question, k=3)

    answer = generate_response(question, results)

    return answer


def main():
    url = input("Enter YouTube Video URL: ")
    question = input("Ask a question about the video: ")

    try:
        answer = youtube_pipeline(url, question)

        print("\n--- Answer ---")
        print(answer)

    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    main()