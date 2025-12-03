from langchain_google_genai import GoogleGenerativeAIEmbeddings
from settings import *

def get_text_embedding_model():
    return GoogleGenerativeAIEmbeddings(model=TEXT_EMBED_MODEL)

def get_image_embedding_model():
    # Vision embedding model handles images or image-doc chunks
    return GoogleGenerativeAIEmbeddings(model=VISION_EMBED_MODEL)
