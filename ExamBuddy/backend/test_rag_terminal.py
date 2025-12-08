import os
import sys
from typing import List, Dict

from rag_local import embed_local, search_faiss

from langchain_groq import ChatGroq

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from dotenv import load_dotenv
load_dotenv()
# ====== Config ======
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set")

GROQ_MODEL_ID = "llama-3.1-8b-instant"

SYSTEM_PROMPT = (
    "You are  PrepIQ, a helpful exam tutor.\n"
    "You must answer using ONLY the provided context chunks from the student's own notes.\n"
    "If the answer is not clearly in the context, say you don't know and do not invent facts.\n"
    "Be concise and focus on the exam-relevant points."
)

# ====== LangChain LLM ======
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=GROQ_MODEL_ID,
    temperature=0.2,
    max_tokens=512,
)

# ====== Core RAG + LLM ======
def build_context_from_results(results: List[Dict]) -> str:
    blocks = []
    for r in results:
        blocks.append(
            f"[{r['folder_title']} / {r['section_title']}] {r['content']}"
        )
    return "\n\n".join(blocks)

def answer_with_rag_and_history(
    username: str,
    topic: str,
    question: str,
    history: List[Dict[str, str]],
) -> str:
    # 1) embed question
    q_emb = embed_local([question])[0]

    # 2) retrieve chunks
    results = search_faiss(username, topic, q_emb, top_k=5)

    if not results:
        # No context -> let LLM answer freely (still as  PrepIQ)
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
        ]
        for turn in history:
            messages.append(HumanMessage(content=turn["user"]))
            messages.append(AIMessage(content=turn["bot"]))
        messages.append(HumanMessage(content=question))

        resp = llm.invoke(messages)
        return resp.content.strip()


    # 3) build context string
    context = build_context_from_results(results)

    # 4) build LangChain messages with history + context
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        SystemMessage(content=f"Context:\n{context}"),
    ]
    for turn in history:
        messages.append(HumanMessage(content=turn["user"]))
        messages.append(AIMessage(content=turn["bot"]))
    messages.append(HumanMessage(content=question))

    resp = llm.invoke(messages)
    return resp.content.strip()


# ====== Terminal chat driver ======
def main():
    if len(sys.argv) < 3:
        print("Usage: python test_rag_groq_langchain.py <username> <topic>")
        print('Example: python test_rag_groq_langchain.py Esha_CC "CM51207_CLOUD COMPUTING"')
        return

    username = sys.argv[1]
    topic = " ".join(sys.argv[2:])

    print("=== RAG + Groq (LangChain) terminal chat ===")
    print(f"User   : {username}")
    print(f"Topic  : {topic}")
    print("Type a question (or 'exit' to quit).\n")

    history: List[Dict[str, str]] = []

    while True:
        try:
            q = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            break

        if not q:
            continue
        if q.lower() in {"exit", "quit"}:
            print("Bye.")
            break

        # 1) embed + retrieve to show chunks
        try:
            q_emb = embed_local([q])[0]
            results = search_faiss(username, topic, q_emb, top_k=5)
        except Exception as e:
            print("[Error during retrieval]", e)
            continue

        if not results:
            print("\n[No relevant chunks retrieved from FAISS for this question.]")
        else:
            print(f"\n[Top {len(results)} retrieved chunks:]")
            for i, r in enumerate(results, start=1):
                print(f"\n--- Chunk {i} (score={r['score']:.4f}) ---")
                print(f"[{r['folder_title']} / {r['section_title']}]")
                preview = r["content"]
                if len(preview) > 400:
                    preview = preview[:400] + " ..."
                print(preview)

        # 2) call LLM with same retrieval + history
        try:
            answer = answer_with_rag_and_history(username, topic, q, history)
        except Exception as e:
            print("[Error during LLM call]", e)
            continue

        print("\nBot:", answer)
        print("\n" + "-" * 60 + "\n")

        history.append({"user": q, "bot": answer})

if __name__ == "__main__":
    main()
