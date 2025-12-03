from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage, HumanMessage
from retrieval import retrieve
from settings import *

def build_rag():
    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        temperature=0.1,
        convert_system_message_to_human=True
    )

    def run(query):
        docs = retrieve(query)
        context = "\n\n".join([d.page_content for d in docs])

        messages = [
            SystemMessage(content="You are a helpful assistant performing multimodal RAG."),
            HumanMessage(content=f"Context:\n{context}\n\nQuestion: {query}")
        ]

        res = llm(messages)
        return res

    return run
