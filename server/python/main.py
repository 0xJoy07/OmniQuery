from feature.web.web_main import web_pipeline


def main():
    url = input("Enter website URL: ")
    question = input("Ask a question: ")

    answer = web_pipeline(url, question)

    print("\n--- Answer ---")
    print(answer)


if __name__ == "__main__":
    main()
