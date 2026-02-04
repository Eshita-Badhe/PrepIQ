# agentic_core.py

from typing import List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from rag_local import embed_local, search_faiss

from supabase import create_client, Client
from dotenv import load_dotenv

import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parents[1]  # goes to Root/ExamBuddy
ROOT_DIR = BASE_DIR.parent                      # goes to Root/
ENV_PATH = ROOT_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

# ---------- Supabase setup ----------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Supabase server client will not work properly.")

supabase_server: Client | None = None
supabase_anon: Client | None = None

try:
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        # bypasses RLS – full CRUD for trusted backend logic
        supabase_server = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    if SUPABASE_URL and SUPABASE_ANON_KEY:
        # respects RLS – use when you want policies to apply
        supabase_anon = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

except Exception as e:
    print("Error creating Supabase clients:", e)
    supabase_server = None
    supabase_anon = None

STORAGE_BUCKET = "user-resources"  # create this in Supabase

def supabase_available():
    if supabase_server is None:
        print("Supabase client not initialized. Check SUPABASE_URL / SUPABASE_KEY.")
        return False
    return True

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ======= SHARED LLMs =======

llm_main = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.2,
    max_tokens=4096,
    timeout=60,
)

llm_refiner = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
    max_tokens=2048,
    timeout=60,
)

intent_llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
    max_tokens=128,
)

# ======= TOOLS (wrapping existing logic) =======

def tool_get_profile(user_id: str) -> Dict[str, Any]:
    """Return basic profile info for a user_id."""
    if not supabase_available():
        return {"error": "supabase_not_configured"}

    try:
        resp = (
            supabase_server.table("profiles")
            .select("full_name, role, streak, last_seen, details")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        rows = getattr(resp, "data", None) or []
        if not rows:
            return {"error": "profile_not_found"}

        row = rows[0]
        return {
            "full_name": row.get("full_name"),
            "role": row.get("role"),
            "streak": row.get("streak"),
            "last_seen": row.get("last_seen"),
            "details": row.get("details"),
        }
    except Exception as e:
        print("tool_get_profile error:", e)
        return {"error": str(e)}


def tool_get_memories(user_id: str, limit: int = 10) -> List[str]:
    """Return recent memory summaries for a user."""
    if not supabase_available():
        return []

    try:
        resp = (
            supabase_server.table("memories")
            .select("summary, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        rows = getattr(resp, "data", None) or []
        return [r.get("summary", "") for r in rows if r.get("summary")]
    except Exception as e:
        print("tool_get_memories error:", e)
        return []


def tool_rag_answer(username: str, user_message: str, history_payload: List[Dict[str, str]]) -> str:
    """Reuses your /chat RAG pipeline to answer a question from notes."""
    # Build history
    history_msgs = []
    for h in history_payload:
        role = h.get("role")
        content = h.get("content", "")
        if role == "user":
            history_msgs.append(HumanMessage(content=content))
        elif role == "assistant":
            history_msgs.append(AIMessage(content=content))

    # RAG retrieval
    try:
        q_emb = embed_local([user_message])[0]
        results = search_faiss(username, None, q_emb, top_k=5)
    except Exception as e:
        print("tool_rag_answer RAG error:", e)
        results = []

    context = ""
    if results:
        blocks = []
        for r in results:
            blocks.append(f"[{r['folder_title']} / {r['section_title']}] {r['content']}")
        context = "\n\n".join(blocks)

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    if context:
        messages.append(SystemMessage(content=f"Context:\n{context}"))
    messages.extend(history_msgs)
    messages.append(HumanMessage(content=user_message))

    try:
        resp = llm_main.invoke(messages)
        answer = resp.content.strip()
    except Exception as e:
        print("tool_rag_answer LLM error:", e)
        answer = "I had trouble generating an answer. Please try again."

    return answer


def tool_generate_plan_from_profile(profile: Dict[str, Any], memories: List[str], user_message: str) -> str:
    """Use Llama 3.3 to create a plan from profile + memories + request."""
    sys = (
        "You are PrepIQ, an exam-focused study planner. "
        "You get user profile + long-term memories + a request. "
        "Create a practical, time-bounded plan tailored for Indian engineering exams."
    )

    memory_block = "\n".join(f"- {m}" for m in memories) if memories else "None available."

    prompt = f"""
User request: {user_message}

User profile:
{profile}

Long-term memories:
{memory_block}

Task:
1. Analyze the student's situation (strengths, weaknesses, goals).
2. Create a concrete study plan (at least 7 days, max 21), with:
   - Day-wise or week-wise structure
   - Subjects/topics per slot
   - Rough time per slot
   - Specific actions (e.g., "solve 15 MCQs from OS - CPU scheduling").
3. Keep it realistic for a busy engineering student.

Return a clear, markdown-friendly explanation (bullet lists are fine).
"""

    msgs = [SystemMessage(content=sys), HumanMessage(content=prompt)]
    try:
        resp = llm_refiner.invoke(msgs)
        return resp.content.strip()
    except Exception as e:
        print("tool_generate_plan_from_profile error:", e)
        return "Unable to generate a plan right now."


def self_reflect_answer(draft: str) -> str:
    """Second pass to refine the draft (style, clarity, structure)."""
    prompt = f"""
Draft answer:

{draft}

You are a careful editor for PrepIQ.
Improve this answer by:
- Removing repetition
- Making steps clearer
- Keeping it exam-focused and practical
- Keeping similar length (do NOT significantly expand)

Return ONLY the improved answer.
"""
    try:
        resp = llm_refiner.invoke([HumanMessage(content=prompt)])
        return resp.content.strip()
    except Exception as e:
        print("self_reflect_answer error:", e)
        return draft
        

# ======= AGENT ROUTER =======
INTENT_SYSTEM = """
You are an intent classifier for PrepIQ.
You must return ONLY one of these labels (no extra text):
- PROGRESS  (questions about user's progress, what you know about them)
- PLAN      (requests to create or adjust a study plan/schedule/timetable)
- CONTENT   (doubts, explanations, concept questions, generic chat)
"""

def classify_intent_llm(message: str) -> str:
    msgs = [
        SystemMessage(content=INTENT_SYSTEM),
        HumanMessage(content=f"User message: {message}\nLabel:"),
    ]
    resp = intent_llm.invoke(msgs)
    label = resp.content.strip().upper()

    if "PROGRESS" in label:
        return "progress"
    if "PLAN" in label:
        return "plan"
    if "CONTENT" in label:
        return "content"
    # Fallback if model does something weird
    return "content"

TOOLS = {
    "get_profile": {
        "description": "Get the student's basic profile, streak, and role.",
        "callable": tool_get_profile,
    },
    "get_memories": {
        "description": "Get recent long-term memory summaries for the student.",
        "callable": tool_get_memories,
    },
    "rag_answer": {
        "description": "Answer conceptual questions using the student's uploaded notes.",
        "callable": tool_rag_answer,
    },
    "plan_from_profile": {
        "description": "Generate a study plan using profile + memories + request.",
        "callable": tool_generate_plan_from_profile,
    },
    # add more later
}

tool_router_llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
    max_tokens=256,
)

def choose_tools_with_llm(intent: str, message: str) -> list[str]:
    """Return a list of tool names from TOOLS that should be used, may be empty."""
    catalog = "\n".join(
        f"- {name}: {meta['description']}" for name, meta in TOOLS.items()
    )

    sys = """
You are a tool selector for PrepIQ.
You see the user's intent, message, and available tools.
Return a JSON list of tool names in the order they should be called.
If no tool is needed or relevant, return [].
Return ONLY the JSON list (no explanation).
"""

    prompt = f"""
Intent: {intent}
User message: {message}

Available tools:
{catalog}

Now output a JSON list, e.g.:
["get_profile", "get_memories"]
or
[]
"""

    resp = tool_router_llm.invoke([
        SystemMessage(content=sys),
        HumanMessage(content=prompt),
    ])
    import json
    try:
        tools_list = json.loads(resp.content.strip())
        if isinstance(tools_list, list):
            return [t for t in tools_list if t in TOOLS]
    except Exception as e:
        print("choose_tools_with_llm parse error:", e)
    return []

def run_agentic_flow(user_id: str, username: str, message: str, history: list[dict]) -> dict:
    intent = classify_intent_llm(message)
    print(f"[AGENTIC] Intent: {intent}")

    # Ask LLM which tools to use (can be zero)
    tool_names = choose_tools_with_llm(intent, message)
    print("[AGENTIC] Tools selected:", tool_names)

    # Execute tools in order
    context: dict[str, Any] = {}
    for name in tool_names:
        fn = TOOLS[name]["callable"]

        if name == "get_profile":
            context["profile"] = fn(user_id)
        elif name == "get_memories":
            context["memories"] = fn(user_id, limit=10)
        elif name == "rag_answer":
            context["rag_answer"] = fn(username, message, history)
        elif name == "plan_from_profile":
            profile = context.get("profile") or tool_get_profile(user_id)
            memories = context.get("memories") or tool_get_memories(user_id, limit=10)
            context["plan"] = fn(profile, memories, message)

    # If no tools selected, fall back based on intent
    if not tool_names:
        if intent == "content":
            draft = tool_rag_answer(username, message, history)
        else:
            # create a plan/progress summary without extra tools
            profile = tool_get_profile(user_id)
            memories = tool_get_memories(user_id, limit=5)
            draft = tool_generate_plan_from_profile(profile, memories, message)
    else:
        # Use whichever main output exists
        draft = (
            context.get("plan")
            or context.get("rag_answer")
            or "I could not generate a response."
        )

    final = self_reflect_answer(draft)

    return {
        "reply": final,
        "agent": {
            "intent": intent,
            "tools_used": tool_names,
        },
        "meta": context,
    }
