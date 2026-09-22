from feature.web.web_main import web_pipeline
from feature.vid.yt_main import youtube_pipeline
from feature.doc.doc_main import doc_pipeline


def main():
    print("Select a feature:")
    print("1. Web Query")
    print("2. YouTube Video Query")
    print("3. Document (PDF) Query")

    choice = input("Enter your choice (1/2/3): ").strip()

    if choice == "1":
        url = input("Enter website URL: ")
        question = input("Ask a question: ")
        answer = web_pipeline(url, question)

    elif choice == "2":
        url = input("Enter YouTube Video URL: ")
        question = input("Ask a question about the video: ")
        answer = youtube_pipeline(url, question)

    elif choice == "3":
        file_path = input("Enter document file path: ")
        question = input("Ask a question about the document: ")
        answer = doc_pipeline(file_path, question)

    else:
        print("Invalid choice.")
        return

    print("\n--- Answer ---")
    print(answer)


if __name__ == "__main__":
    main()
