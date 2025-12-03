from langchain_community.document_loaders import UnstructuredFileLoader
from langchain_community.document_loaders.image import UnstructuredImageLoader
from pathlib import Path

def load_multimodal_docs(path: str):
    docs = []
    for file in Path(path).iterdir():
        if file.suffix.lower() in [".pdf", ".txt", ".docx"]:
            docs.extend(UnstructuredFileLoader(str(file)).load())
        elif file.suffix.lower() in [".png", ".jpg", ".jpeg"]:
            docs.extend(UnstructuredImageLoader(str(file)).load())
        else:
            print("Skipping unsupported:", file)
    return docs
