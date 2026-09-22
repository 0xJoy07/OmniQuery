import os

from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredWordDocumentLoader,
    UnstructuredPowerPointLoader,
    UnstructuredExcelLoader,
    TextLoader,
    CSVLoader,
    JSONLoader,
    UnstructuredMarkdownLoader,
    UnstructuredHTMLLoader,
)


SUPPORTED_EXTENSIONS = {
    ".pdf": "PDF",
    ".doc": "Word Document",
    ".docx": "Word Document",
    ".ppt": "PowerPoint",
    ".pptx": "PowerPoint",
    ".xls": "Excel",
    ".xlsx": "Excel",
    ".csv": "CSV",
    ".txt": "Text",
    ".log": "Text",
    ".json": "JSON",
    ".md": "Markdown",
    ".html": "HTML",
    ".htm": "HTML",
}


def get_loader(file_path, ext):

    if ext == ".pdf":
        return PyPDFLoader(file_path)

    elif ext in (".doc", ".docx"):
        return UnstructuredWordDocumentLoader(file_path)

    elif ext in (".ppt", ".pptx"):
        return UnstructuredPowerPointLoader(file_path)

    elif ext in (".xls", ".xlsx"):
        return UnstructuredExcelLoader(file_path)

    elif ext == ".csv":
        return CSVLoader(file_path)

    elif ext in (".txt", ".log"):
        return TextLoader(file_path, encoding="utf-8")

    elif ext == ".json":
        return JSONLoader(file_path, jq_schema=".", text_content=False)

    elif ext == ".md":
        return UnstructuredMarkdownLoader(file_path)

    elif ext in (".html", ".htm"):
        return UnstructuredHTMLLoader(file_path)

    else:
        return None


def load_document(file_path):

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS.keys()))
        raise ValueError(
            f"Unsupported file type '{ext}'. Supported types: {supported}"
        )

    loader = get_loader(file_path, ext)

    if loader is None:
        raise ValueError(f"No loader available for '{ext}'")

    try:
        docs = loader.load()
    except Exception as e:
        raise RuntimeError(
            f"Failed to load {SUPPORTED_EXTENSIONS[ext]} file: {e}"
        )

    if not docs:
        raise ValueError(f"No content found in the file: {file_path}")

    print(f"Loaded {len(docs)} page(s) from {SUPPORTED_EXTENSIONS[ext]} file.")

    return docs
