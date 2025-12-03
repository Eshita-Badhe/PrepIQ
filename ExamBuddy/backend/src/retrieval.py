from langchain_community.vectorstores import FAISS
from embeddings import get_text_embedding_model, get_image_embedding_model

def load_stores():
    t = FAISS.load_local("db/faiss_text", get_text_embedding_model(), allow_dangerous_deserialization=True)
    v = FAISS.load_local("db/faiss_vision", get_image_embedding_model(), allow_dangerous_deserialization=True)
    return t, v

def retrieve(query, k=4):
    text_store, vision_store = load_stores()

    text_hits = text_store.similarity_search(query, k=k)
    vision_hits = vision_store.similarity_search(query, k=2)

    return text_hits + vision_hits
