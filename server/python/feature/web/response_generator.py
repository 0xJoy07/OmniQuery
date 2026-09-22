import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq


def generate_response(question, context_docs):
    load_dotenv()
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("Add GROQ_API_KEY in your .env file")

    llm = ChatGroq(
        model="openai/gpt-oss-20b",
        groq_api_key=api_key
    )

    context = "\n\n".join(doc.page_content for doc in context_docs)

    prompt = f"""Based on the following context from a website, answer the question.

Context:
{context}

Question: {question}

Answer:"""

    response = llm.invoke(prompt)
    return response.content
