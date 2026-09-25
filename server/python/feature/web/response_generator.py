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
    Based on the following context from a website, answer the question in detail from the content from the content.
    
    Use only the context provided below.
    
    If the answer cannot be found in the context, you MUST respond EXACTLY with this phrase:
    "The content you provided does not contain your query. Perhaps you can ask from the follow ups"
    Do not add any other conversational text to the answer. Just add the follow ups from the doc.

    Context: {context}

    Question: {question}

    Answer:

    After answering, generate 2-3 follow-up questions the user might want to explore next, based strictly on the context provided above.

    Rules for follow-up questions:
    - Each question must be answerable from the given context
    - Do not introduce topics outside the context
    - Keep questions concise and curiosity-driven

    You MUST prefix the follow-up questions section exactly with this marker:
    ###FOLLOW_UP_QUESTIONS###
    1.
    2.
    3.
    """

    response = llm.invoke(prompt)
    return response.content
