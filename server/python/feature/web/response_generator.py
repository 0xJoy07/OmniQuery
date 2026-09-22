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

    prompt = f"""
    Based on the following context from a website, answer the question.
    
    Use only the context provided below.
    
    If the answer cannot be found in the context, clearly say that the information is not available.

    Context: {context}

    Question: {question}

    Answer:

    After answering, generate 2-3 follow-up questions the user might want to explore next, based strictly on the context provided above.

    Rules for follow-up questions:
    - Each question must be answerable from the given context
    - Do not introduce topics outside the context
    - Keep questions concise and curiosity-driven

    Follow-up Questions:
    1.
    2.
    3.
    """

    response = llm.invoke(prompt)
    return response.content
