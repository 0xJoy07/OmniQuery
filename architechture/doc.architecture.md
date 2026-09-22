```mermaid
flowchart TD
    A["User Input\n(File Path + Question)"] --> B

    subgraph INGESTION["Ingestion Pipeline"]
        B["doc_loader.py — load_document(file_path)"]
        B -->|"Extension Detection\n(.pdf .docx .pptx .xlsx .csv .txt .json .md .html)"| B2["get_loader(file_path, ext)"]
        B2 -->|Raw Documents| C["chunking.py — chunk_docs(docs)"]
        C -->|Chunked Documents| D["chromaDB.py — save_to_chroma(chunks)"]
    end

    subgraph EMBEDDING["Embedding Layer"]
        E["embed.py — get_embedding_model()"]
    end

    D -->|Vectors stored| F[("ChromaDB\ndb/doc_chroma")]
    A --> G

    subgraph RETRIEVAL["Retrieval + Response"]
        G["chromaDB.py — load_chroma()"]
        G -->|"similarity_search(question, k=3)"| H["Top 3 Relevant Chunks"]
        H --> I["response_generator.py — generate_response(question, docs)"]
    end

    E -.->|Embeddings for storing & searching| D
    E -.->|Embeddings for storing & searching| G
    I -->|LLM Call| J["Groq API — openai/gpt-oss-20b"]
    J --> K["Final Answer"]

    subgraph ORCHESTRATOR["Orchestration"]
        L["doc_main.py — doc_pipeline(file_path, question)"]
    end

    L -.->|coordinates| INGESTION
    L -.->|coordinates| RETRIEVAL

    subgraph ENTRY["Entry Point"]
        M["main.py — main()"]
    end

    M -.->|calls| L

    classDef default fill:#ffffff,stroke:#888,stroke-width:1px,color:#111
    %% classDef io fill:#eeeeee,stroke:#333,stroke-width:1.5px,color:#111,font-weight:bold
    classDef store fill:#ffffff,stroke:#555,stroke-width:1px,color:#111

    class A,K io
    class F store
```
