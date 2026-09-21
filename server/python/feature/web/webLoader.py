import os

os.environ.setdefault("USER_AGENT", "EuphoriaGenX-WebVectorBot/1.0")

from langchain_community.document_loaders import WebBaseLoader


def webLoader(url):
    loader = WebBaseLoader(url)
    return loader.load()
