from multimodal_loader import load_multimodal_docs
from chunking import chunk_documents
from embeddings import get_text_embedding_model, get_image_embedding_model
from langchain_community.vectorstores import FAISS
import os

def ingest():
    docs = load_multimodal_docs("data/docs")
    chunks = chunk_documents(docs)

    text_model = get_text_embedding_model()
    vision_model = get_image_embedding_model()

    # classify chunk embedding type
    for doc in chunks:
        if "image" in doc.metadata.get("source", "").lower():
            doc.metadata["kind"] = "vision"
        else:
            doc.metadata["kind"] = "text"

    text_docs = [d for d in chunks if d.metadata["kind"] == "text"]
    vision_docs = [d for d in chunks if d.metadata["kind"] == "vision"]

    text_store = FAISS.from_documents(text_docs, text_model)
    vision_store = FAISS.from_documents(vision_docs, vision_model)

    os.makedirs("db", exist_ok=True)
    text_store.save_local("db/faiss_text")
    vision_store.save_local("db/faiss_vision")

    print("Ingestion complete.")
