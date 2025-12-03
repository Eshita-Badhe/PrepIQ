from rag_chain import build_rag

if __name__ == "__main__":
    rag = build_rag()

    print("Gemini RAG ready. Type questions or 'exit'.")
    while True:
        q = input("\nAsk: ")
        if q.lower() == "exit":
            break
        answer = rag(q)
        print("\n--- ANSWER ---\n")
        print(answer.content)
