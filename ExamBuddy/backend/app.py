import os
import random
import time
import re

from flask import Flask, json, request, jsonify, session
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_login import LoginManager, UserMixin, login_user, current_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
import dns.resolver

import uuid
from datetime import datetime 

from supabase import create_client, Client
from dotenv import load_dotenv

from rag_local import embed_local, search_faiss, ingest_single_file
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, grey, black

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from werkzeug.datastructures import FileStorage
from tempfile import NamedTemporaryFile
from markupsafe import escape

from datetime import datetime, date, timedelta

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# ---------- Flask setup ----------
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "fallback_dev_key")
CORS(app, supports_credentials=True)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
mail = Mail(app)

login_manager = LoginManager()
login_manager.init_app(app)

# ---------- Supabase setup ----------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")  # service role or anon, but service role recommended on server

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not set. Supabase client will not work properly.")

supabase: Client | None = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print("Error creating Supabase client:", e)
    supabase = None

STORAGE_BUCKET = "user-resources"  # create this in Supabase

# ---------- Helpers ----------
def supabase_available():
    if supabase is None:
        print("Supabase client not initialized. Check SUPABASE_URL / SUPABASE_KEY.")
        return False
    return True

def safe_single_row(table_name: str, select_cols: str, **filters):
    """
    Helper to wrap maybe_single().execute() safely.
    Returns (data_dict_or_None, error_or_None).
    """
    if not supabase_available():
        return None, "Supabase not configured"

    try:
        query = supabase.table(table_name).select(select_cols)
        for col, val in filters.items():
            query = query.eq(col, val)
        response = query.maybe_single().execute()
    except Exception as e:
        print(f"Supabase query error on table {table_name}:", e)
        return None, str(e)

    # V2 client: response.data and response.error
    data = getattr(response, "data", None)
    error = getattr(response, "error", None)
    if error:
        print(f"Supabase returned error for table {table_name}:", error)
    return data, error

# ---------- User model for Flask-Login ----------
class User(UserMixin):
    def __init__(self, id, username, direct_login):
        self.id = id
        self.username = username
        self.direct_login = direct_login

@login_manager.user_loader
def load_user(user_id):
    data, error = safe_single_row("users", "id, username, direct_login", id=user_id)
    if error:
        return None
    if data:
        return User(data["id"], data["username"], data.get("direct_login", False))
    return None

def normalize_username(raw: str) -> str:
    return raw.strip().replace(" ", "_")

# ---------- Email validation ----------
def is_email_valid(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(pattern, email):
        return False, "Invalid email format"

    domain = email.split('@')[1]
    try:
        records = dns.resolver.resolve(domain, 'MX')
        if not records:
            return False, "Email domain does not exist"
    except Exception:
        return False, "Email domain not reachable"

    # Supabase uniqueness check
    data, error = safe_single_row("users", "id", email=email)
    if error:
        return False, "Internal email check error"
    if data:
        return False, "Email already registered"

    return True, "Email is valid and available"

# ---------- OTP ----------
@app.route('/api/send-otp', methods=['POST'])
def api_send_otp():
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = data.get('email')
        if not email:
            return jsonify({"success": False, "msg": "Email is required"}), 400

        valid, message = is_email_valid(email)
        if not valid:
            return jsonify({"success": False, "msg": message})

        otp = str(random.randint(100000, 999999))
        session['otp'] = otp
        session['otp_time'] = time.time()

        msg = Message("Your Exam Buddy OTP", sender=app.config['MAIL_USERNAME'], recipients=[email])
        msg.body = f"Your OTP is: {otp}. It expires in 5 minutes."
        mail.send(msg)
        return jsonify({"success": True, "msg": "OTP sent."})
    except Exception as e:
        print("SEND OTP ERROR:", e)
        return jsonify({"success": False, "msg": "Internal error: " + str(e)}), 500

@app.route('/api/verify-otp', methods=['POST'])
def api_verify_otp():
    data = request.get_json(force=True, silent=True) or {}
    user_otp = data.get('otp')
    stored_otp = session.get('otp')
    stored_time = session.get('otp_time')
    if not stored_otp or not stored_time or time.time() - stored_time > 300:
        return jsonify({"success": False, "msg": "OTP expired"})
    if user_otp == stored_otp:
        session.pop('otp', None)
        return jsonify({"success": True, "msg": "OTP verified"})
    return jsonify({"success": False, "msg": "OTP does not match"})

# ---------- Register (no duplicate username or email) ----------
@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        data = request.get_json(force=True, silent=True) or {}
        username = data.get('username', '').strip()
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        email = data.get('email', '').strip()
        age = data.get('age')
        account_type = data.get('accountType')
        direct_login = data.get('directLogin', False)
        terms_agreed = data.get('termsAgreed', False)

        if not all([username, password, email, terms_agreed]):
            return jsonify({"error": "Missing required fields"}), 400
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        # Username unique
        user_data, user_err = safe_single_row("users", "id", username=username)
        if user_err:
            return jsonify({"error": "Internal error checking username"}), 500
        if user_data:
            return jsonify({"error": "Username already taken"}), 400

        # Email unique
        valid, msg = is_email_valid(email)
        if not valid:
            return jsonify({"error": msg}), 400

        hashed_password = generate_password_hash(password)

        if not supabase_available():
            return jsonify({"error": "Supabase not configured"}), 500

        insert = supabase.table("users").insert({
            "username": username,
            "password_hash": hashed_password,
            "email": email,
            "age": age,
            "account_type": account_type,
            "direct_login": direct_login,
            "terms_agreed": terms_agreed
        }).execute()

        if getattr(insert, "error", None):
            return jsonify({"error": str(insert.error)}), 500

        return jsonify({"success": True, "message": "User registered successfully!"}), 201

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ---------- Login ----------
@app.route('/api/check-login', methods=['POST'])
def check_login():
    data = request.get_json(force=True, silent=True) or {}
    username = data.get('username', '').strip()
    password = data.get('password')

    user_data, user_err = safe_single_row(
        "users",
        "id, username, direct_login, password_hash",
        username=username
    )
    if user_err:
        return jsonify(success=False, hint="internal"), 500

    if not user_data:
        return jsonify(success=False, hint='your pass')

    stored_hash = user_data["password_hash"]
    if not check_password_hash(stored_hash, password):
        return jsonify(success=False, hint='your pass')

    user_obj = User(user_data["id"], user_data["username"], user_data.get("direct_login", False))
    login_user(user_obj)
    return jsonify(success=True)

@app.route("/api/me", methods=["GET"])
def api_me():
    if not current_user.is_authenticated:
        return jsonify({"authenticated": False}), 200

    # current_user.id is Supabase users.id (uuid)
    return jsonify({
        "authenticated": True,
        "id": current_user.id,
        "username": current_user.username,
        "direct_login": getattr(current_user, "direct_login", False)
    }), 200

@app.route('/api/direct-login-status')
def direct_login_status():
    if current_user.is_authenticated:
        data, err = safe_single_row("users", "direct_login", id=current_user.id)
        if err:
            return jsonify({"status": "normal"})
        if data and data.get("direct_login"):
            return jsonify({"status": "direct"})
        return jsonify({"status": "normal"})
    return jsonify({"status": "login"})

@app.route("/api/logout", methods=["POST"])
def api_logout():
    try:
        # End Flask-Login session
        if current_user.is_authenticated:
            logout_user()

        # Clear any OTP / custom data from Flask session
        session_keys = ["otp", "otp_time"]
        for k in session_keys:
            session.pop(k, None)

        # Optionally nuke everything:
        # session.clear()

        return jsonify({"success": True, "msg": "Logged out"}), 200
    except Exception as e:
        print("LOGOUT ERROR:", e)
        return jsonify({"success": False, "msg": "Internal logout error"}), 500

# ---------- Profile APP -------------
@app.route("/api/profile", methods=["GET"])
def api_profile():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    try:
        # users table: get base info
        user_resp = (
            supabase.table("users")
            .select("id, username, email")
            .eq("id", str(current_user.id))
            .limit(1)
            .execute()
        )
        users_rows = getattr(user_resp, "data", None) or []
        if not users_rows:
            return jsonify(success=False, msg="User not found in users table"), 404

        user_row = users_rows[0]
        user_id = user_row["id"]
        username = user_row.get("username")
        email = user_row.get("email")

        # profiles table: matches screenshot columns
        prof_resp = (
            supabase.table("profiles")
            .select("full_name, role, streak, last_seen, details")
            .eq("id", str(user_id))
            .limit(1)
            .execute()
        )
        prof_rows = getattr(prof_resp, "data", None) or []
        if not prof_rows:
            return jsonify(success=False, msg="Profile not found"), 404

        row = prof_rows[0]

        name = row.get("full_name") or username or "USER"
        role = row.get("role") or "Student"
        streak = row.get("streak") or 0
        last_seen = row.get("last_seen") or "Today"
        details = row.get("details") or ""

        # simple completeness: require name and role and details
        is_complete = bool(name.strip()) and bool(role.strip()) and bool(details.strip())

        profile = {
            "id": user_id,
            "name": name,
            "role": role,
            "streak": streak,
            "lastSeen": last_seen,
            "details": details,
            "email": email,
            "isComplete": is_complete,
        }

        return jsonify(success=True, profile=profile)

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify(success=False, msg=str(e)), 500
    
@app.route("/api/profile", methods=["POST"])
def api_profile_update():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    data = request.json or {}
    try:
        user_id = str(current_user.id)

        # update profiles table based on form
        update_fields = {
            "full_name": data.get("name"),
            "role": data.get("role"),
            "details": data.get("details"),
        }
        update_fields = {k: v for k, v in update_fields.items() if v is not None}

        if update_fields:
            supabase.table("profiles").update(update_fields).eq("id", user_id).execute()

        # optional: sync username in users table from name
        if data.get("name"):
            supabase.table("users").update(
                {"username": data["name"]}
            ).eq("id", user_id).execute()

        return jsonify(success=True)

    except Exception as e:
        print("PROFILE UPDATE ERROR:", e)
        return jsonify(success=False, msg=str(e)), 500

@app.route("/api/delete-account", methods=["POST"])
def api_delete_account():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    user_id = str(current_user.id)

    try:
        # delete chat messages if not ON DELETE CASCADE from chat_threads
        try:
            supabase.table("chat_messages").delete().eq("user_id", user_id).execute()
        except Exception as e:
            print("DELETE chat_messages ERROR (maybe no user_id col):", e)

        # delete chat threads
        try:
            supabase.table("chat_threads").delete().eq("user_id", user_id).execute()
        except Exception as e:
            print("DELETE chat_threads ERROR:", e)

        # delete memories
        try:
            supabase.table("memories").delete().eq("user_id", user_id).execute()
        except Exception as e:
            print("DELETE memories ERROR:", e)

        # delete profile + user row
        supabase.table("profiles").delete().eq("id", user_id).execute()
        supabase.table("users").delete().eq("id", user_id).execute()

        # delete storage folders for this username
        if supabase_available():
            storage = supabase.storage.from_(STORAGE_BUCKET)
            username_norm = normalize_username(current_user.username)

            def delete_prefix(root_type: str):
                prefix = f"{root_type}/{username_norm}/"
                try:
                    resp = storage.list(prefix)
                    if isinstance(resp, list):
                        objects = resp
                    elif isinstance(resp, dict):
                        objects = resp.get("data", []) or []
                    else:
                        objects = []

                    keys = []
                    for obj in objects:
                        name = obj.get("name", "") or ""
                        if not name:
                            continue
                        # name is relative to prefix, so full key:
                        full_key = prefix + name
                        keys.append(full_key)

                    # delete in batches (Supabase storage.remove accepts list)
                    if keys:
                        print("REMOVING KEYS under", prefix, "=>", keys)
                        storage.remove(keys)
                except Exception as e:
                    print(f"DELETE STORAGE under {prefix} ERROR:", e)

            for root in [
                "uploaded",
                "generated_notes",
                "generated_sample_papers",
            ]:
                delete_prefix(root)

        # flask logout
        logout_user()
        return jsonify(success=True)

    except Exception as e:
        print("DELETE ACCOUNT ERROR:", e)
        return jsonify(success=False, msg=str(e)), 500

@app.route("/api/activity/ping", methods=["POST"])
def api_activity_ping():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    user_id = str(current_user.id)

    try:
        prof_resp = (
            supabase.table("profiles")
            .select("streak, last_seen")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        rows = getattr(prof_resp, "data", None) or []
        if not rows:
            return jsonify(success=False, msg="Profile not found"), 404

        row = rows[0]
        streak = row.get("streak") or 0
        last_seen = row.get("last_seen")

        today = date.today()
        yesterday = today - timedelta(days=1)

        if last_seen:
            # if last_seen is date or iso string, normalise:
            last_date = (
                last_seen if isinstance(last_seen, date) else date.fromisoformat(last_seen)
            )
            if last_date == today:
                pass
            elif last_date == yesterday:
                streak += 1
            else:
                streak = 1
        else:
            streak = 1

        supabase.table("profiles").update(
            {"streak": streak, "last_seen": today.isoformat()}
        ).eq("id", user_id).execute()

        return jsonify(success=True, streak=streak)

    except Exception as e:
        print("ACTIVITY ERROR:", e)
        return jsonify(success=False, msg=str(e)), 500

@app.route("/api/memories", methods=["GET"])
def api_memories():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    user_id = str(current_user.id)

    try:
        resp = (
            supabase.table("memories")
            .select("summary, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        rows = getattr(resp, "data", None) or []
        # Just return summaries as a list of strings for now
        memories = [r.get("summary", "") for r in rows if r.get("summary")]
        return jsonify(success=True, memories=memories)
    except Exception as e:
        print("MEMORIES FETCH ERROR:", e)
        return jsonify(success=False, msg=str(e)), 500

def summarize_thread_for_memory(messages, username: str) -> str:
    """
    messages: list of {role: 'user'|'assistant', content: str}
    Returns a short memory summary about the user and this thread.
    """
    try:
        convo_text = ""
        for m in messages[-40:]:  # last N messages only
            role = m.get("role", "user")
            content = m.get("content", "")
            convo_text += f"{role.upper()}: {content}\n"

        prompt = (
            "You are building long-term memory for an exam-prep assistant.\n"
            "From the following conversation, extract concise facts about the student's goals, "
            "subjects, difficulties, preferences, and any commitments.\n"
            "Write 3-10 bullet-point style sentences. Avoid greetings or chit-chat.\n\n"
            f"Username: {username}\n\n"
            f"Conversation:\n{convo_text}\n"
        )

        msgs = [
            SystemMessage(
                content="You summarize chats into stable user memories for ExamBuddy."
            ),
            HumanMessage(content=prompt),
        ]
        resp = llm.invoke(msgs)
        text = resp.content if hasattr(resp, "content") else str(resp)
        return text.strip()
    except Exception as e:
        print("MEMORY SUMMARY ERROR:", e)
        return ""

# ---------- Upload Docs to Supabase Storage ----------
def normalize_title(t: str) -> str:
    return t.strip().replace(" ", "_")

@app.route("/api/upload-docs", methods=["POST"])
def api_upload_docs():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    if not supabase_available():
        return jsonify(success=False, msg="Supabase not configured"), 500

    root_type = request.form.get("root_type", "").strip() or "uploaded"
    if root_type not in {"uploaded", "generated_notes", "generated_sample_papers"}:
        return jsonify(success=False, msg="Invalid root_type"), 400

    username_form = request.form.get("username", "").strip()
    title = request.form.get("title", "").strip()
    files = request.files.getlist("files")

    if not username_form or not title or not files:
        return jsonify(success=False, msg="Missing username, title, or files"), 400

    username = normalize_username(current_user.username)
    title_norm = normalize_title(title)

    # uploaded/<user>/<title>/..., generated_notes/<user>/<title>/..., etc.
    base_prefix = f"{root_type}/{username}/{title_norm}/"

    saved_paths = []

    try:
        storage = supabase.storage.from_(STORAGE_BUCKET)

        for f in files:
            if not f.filename:
                continue

            filename = os.path.basename(f.filename)
            key = base_prefix + filename

            # delete old version (ignore failure)
            try:
                storage.remove(key)   # if this errors, print and continue
            except Exception as e:
                print("DELETE BEFORE REPLACE ERROR for", key, ":", e)
                
            file_bytes = f.read()
            print("UPLOADING", key, "size:", len(file_bytes))

            resp = storage.upload(
                key,
                file_bytes,
                {"content-type": f.mimetype or "application/octet-stream"},
            )
            print("UPLOAD RESP for", key, "=>", resp)

            if isinstance(resp, dict) and resp.get("error"):
                return jsonify(success=False, msg=str(resp["error"])), 500

            saved_paths.append(key)

            # ingest into embeddings
            try:
                ingest_single_file(
                    username=username,
                    title=title_norm,
                    path_in_bucket=key,
                )
            except Exception as e:
                print("INGEST ERROR for", key, ":", e)

        if not saved_paths:
            return jsonify(success=False, msg="No valid files uploaded"), 400

        return jsonify(success=True, paths=saved_paths)
    except Exception as e:
        print("UPLOAD DOCS ERROR:", e)
        return jsonify(success=False, msg=str(e)), 500
    
@app.route("/api/list-root-folders", methods=["GET"])
def api_list_root_folders():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    root_type = request.args.get("root_type", "").strip()
    if root_type not in {"uploaded", "generated_notes", "generated_sample_papers"}:
        return jsonify(success=False, msg="Invalid root_type"), 400

    if not supabase_available():
        return jsonify(success=False, msg="Supabase not configured"), 500

    username = normalize_username(current_user.username)
    prefix = f"{root_type}/{username}/"     # e.g. "uploaded/Eshita_Badhe/"

    # IMPORTANT: pass prefix to list; returned "name" will be RELATIVE
    resp = supabase.storage.from_(STORAGE_BUCKET).list(prefix)

    if isinstance(resp, list):
        objects = resp
    elif isinstance(resp, dict):
        objects = resp.get("data", []) or []
    else:
        objects = []

    print("ROOT TYPE:", root_type)
    print("PREFIX USED:", prefix)
    print("RAW RESP:", resp)
    for o in objects:
        print("OBJ NAME:", o.get("name"))

    folders = set()
    for obj in objects:
        # For prefix listing, 'name' is like "Cyber_Security/CHAPTER 5.pdf"
        name = obj.get("name", "") or ""
        rest = name  # already relative to prefix
        if not rest:
            continue

        folder_name = rest.split("/", 1)[0]   # "Cyber_Security"
        if folder_name:
            folders.add(folder_name)

    return jsonify(success=True, folders=sorted(folders))

@app.route("/api/list-root-folder-files", methods=["GET"])
def api_list_root_folder_files():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    root_type = request.args.get("root_type", "").strip()
    folder = request.args.get("folder", "").strip()   # e.g. "Cyber_Security"

    if root_type not in {"uploaded", "generated_notes", "generated_sample_papers"}:
        return jsonify(success=False, msg="Invalid root_type"), 400
    if not folder:
        return jsonify(success=False, msg="Missing folder"), 400

    if not supabase_available():
        return jsonify(success=False, msg="Supabase not configured"), 500

    username = normalize_username(current_user.username)
    prefix = f"{root_type}/{username}/{folder}/"      # e.g. uploaded/Eshita_Badhe/Cyber_Security/

    resp = supabase.storage.from_(STORAGE_BUCKET).list(prefix)

    if isinstance(resp, list):
        objects = resp
    elif isinstance(resp, dict):
        objects = resp.get("data", []) or []
    else:
        objects = []

    files = []
    for obj in objects:
        # For prefix listing, 'name' is RELATIVE to prefix, e.g. "CHAPTER 5.pdf"
        name = obj.get("name", "") or ""
        if not name or "/" in name:
            # ignore nested subfolders for now
            continue

        files.append({
            "name": name,
            "full_path": prefix + name,
            "size": (obj.get("metadata") or {}).get("size"),
            "last_modified": obj.get("updated_at") or obj.get("created_at"),
        })

    return jsonify(success=True, files=files)

@app.route("/api/file-url", methods=["GET"])
def api_file_url():
    if not current_user.is_authenticated:
        return jsonify(success=False, msg="Not authenticated"), 401

    key = request.args.get("path", "").strip()
    if not key:
        return jsonify(success=False, msg="Missing path"), 400

    if not supabase_available():
        return jsonify(success=False, msg="Supabase not configured"), 500

    public_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(key)
    if not public_url:
        return jsonify(success=False, msg=f"No public URL for key: {key}"), 404

    return jsonify(success=True, url=public_url)

    stored_hash = user_data["password_hash"]
    if not check_password_hash(stored_hash, password):
        return jsonify(success=False, hint='your pass')

# ---------- Chat Bot ----------
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name="llama-3.1-8b-instant",
    temperature=0.2,
    max_tokens=4096,
    timeout=60,
)

SYSTEM_PROMPT = (
    "You are ExamBuddy, a helpful exam tutor.\n"
    "You can use the student's uploaded notes (Context) when available.\n"
    "If the answer is not clearly in the context, you may answer from your own knowledge, "
    "but prefer to ground answers in the context when possible."
)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    print("Chat request data:", data)
    user_message = data.get("message", "").strip()
    print("User message:", user_message)
    username = data.get("username")
    username = normalize_username(username)
    print("Chat request from user:", username)
    history_payload = data.get("history", [])  # [{role, content}]
    thread_id = data.get("thread_id")  # optional, if you start sending it later
    mode = data.get("mode", "default")  # chat or other modes in future
    topic = data.get("topic")
    extra = data.get("extra", "")

    # ========== MIND MAP MODE ==========
    if mode == "mindmap":
        if not topic.strip():
            return jsonify({"error": "Topic is required."}), 400

        try:
            print(f"[MINDMAP] Starting generation for topic: {topic}")
            
            # Step 1: Call LLM for JSON tree
            mindmap_tree = call_llm_for_mindmap(topic, extra)
            print(f"[MINDMAP] Tree generated successfully")
            
            # Step 2: Generate PDF bytes
            pdf_bytes = generate_mindmap_pdf_bytes(topic, mindmap_tree)
            print(f"[MINDMAP] PDF generated ({len(pdf_bytes)} bytes)")
            
            # Step 3: Upload to Supabase
            pdf_url = upload_mindmap_to_supabase(username, topic, pdf_bytes)
            print(f"[MINDMAP] Uploaded successfully: {pdf_url}")
            
            return jsonify({
                "success": True,
                "mindmap": mindmap_tree,
                "pdf_url": pdf_url,
            }), 200

        except Exception as e:
            print(f"[MINDMAP FATAL ERROR] {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "error": str(e),
                "details": "Check server logs for full error."
            }), 500

    if not user_message:
        return jsonify({"reply": "Please enter a question."}), 400
    if not username:
        return jsonify({"reply": "Username is missing."}), 400

    memory_summaries = []
    try:
        if current_user.is_authenticated:
            mem_resp = (
                supabase.table("memories")
                .select("summary, created_at")
                .eq("user_id", str(current_user.id))
                .order("created_at", desc=True)
                .limit(5)
                .execute()
            )
            mem_rows = getattr(mem_resp, "data", None) or []
            memory_summaries = [m["summary"] for m in mem_rows if m.get("summary")]
    except Exception as e:
        print("MEMORY READ FOR CHAT ERROR:", e)

    memory_block = "\n\n".join(memory_summaries)

    system_text = SYSTEM_PROMPT
    if memory_block:
        system_text += (
            "\n\nHere are some long-term memories about this student. "
            "Use them to personalize answers when relevant:\n"
            f"{memory_block}\n"
        )

    messages = [
        SystemMessage(content=system_text),
        # plus your previous context + user message
    ]

    # Build history for LLM from history_payload
    history_msgs = []
    for h in history_payload:
        role = h.get("role")
        content = h.get("content", "")
        if role == "user":
            history_msgs.append(HumanMessage(content=content))
        elif role == "assistant":
            history_msgs.append(AIMessage(content=content))

    # Your existing embed + retrieve logic (unchanged)
    try:
        q_emb = embed_local([user_message])[0]
    except Exception as e:
        print("embed_local error:", e)
        return jsonify({"reply": "Error embedding your question."}), 500

    try:
        results = search_faiss(username, None, q_emb, top_k=5)
    except Exception as e:
        print("search_faiss error:", e)
        results = []

    context = ""
    if results:
        blocks = []
        for r in results:
            blocks.append(
                f"[{r['folder_title']} / {r['section_title']}] {r['content']}"
            )
        context = "\n\n".join(blocks)

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    if context:
        messages.append(SystemMessage(content=f"Context:\n{context}"))
    messages.extend(history_msgs)
    messages.append(HumanMessage(content=user_message))

        # After saving current message and AI response to chat_messages

    try:
        if current_user.is_authenticated and thread_id:
            # Fetch recent messages for this thread for summarization
            msg_resp = (
                supabase.table("chat_messages")
                .select("role, content, created_at")
                .eq("thread_id", thread_id)
                .order("created_at", asc=True)
                .limit(80)
                .execute()
            )
            msg_rows = getattr(msg_resp, "data", None) or []

            messages_for_summary = [
                {"role": r.get("role", "user"), "content": r.get("content", "")}
                for r in msg_rows
            ]

            if messages_for_summary:
                summary = summarize_thread_for_memory(messages_for_summary, username)
                if summary:
                    supabase.table("memories").insert(
                        {
                            "user_id": str(current_user.id),
                            "thread_id": thread_id,
                            "summary": summary,
                        }
                    ).execute()
    except Exception as e:
        print("MEMORY INSERT ERROR:", e)

    # Call Groq LLM
    try:
        resp = llm.invoke(messages)
        answer = resp.content.strip()
    except Exception as e:
        print("Groq LLM error:", e)
        answer = "I had trouble generating an answer. Please try again."
 
    return jsonify({"reply": answer})

def get_user_id_by_username(username: str) -> str | None:
    if not username:
        return None

    resp = (
        supabase
        .table("users") 
        .select("id")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        return None
    
    print("rows from users:", rows)
    return rows[0]["id"]

# ---------- threads API (Supabase persistence) ----------

@app.route("/api/chat-threads", methods=["GET"])
def list_threads():
    username = request.args.get("username")
    if not username:
        return jsonify({"threads": []}), 200

    user_id = get_user_id_by_username(username)
    if not user_id:
        return jsonify({"threads": []}), 200

    resp = (
        supabase
        .table("chat_threads")
        .select("id, title, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    threads = resp.data or []

    return jsonify({"threads": [{"id": t["id"], "title": t["title"]} for t in threads]})


@app.route("/api/chat-threads/<thread_id>", methods=["GET"])
def get_thread(thread_id):
    # RLS disabled; user_id already enforced via FK and username→id logic
    resp = (
        supabase
        .table("chat_messages")
        .select("role, content, created_at")
        .eq("thread_id", thread_id)
        .order("created_at", desc=False)   # ascending
        .execute()
    )
    backend_msgs = resp.data or []

    messages = []
    for m in backend_msgs:
        from_ = "user" if m.get("role") == "user" else "bot"
        messages.append({
            "from": from_,
            "text": m.get("content", ""),
        })

    return jsonify({"messages": messages})


@app.route("/api/chat-threads", methods=["POST"])
def save_thread():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    thread_id = data.get("thread_id")
    title = data.get("title") or "New chat"
    frontend_messages = data.get("messages") or []

    if not username:
        return jsonify({"error": "username required"}), 400

    user_id = get_user_id_by_username(username)
    if not user_id:
        return jsonify({"error": "unknown user"}), 400

    # 1) Create thread if new
    if not thread_id:
        thread_id = str(uuid.uuid4())
        supabase.table("chat_threads").insert({
            "id": thread_id,
            "user_id": user_id,
            "title": title,
        }).execute()
    else:
        supabase.table("chat_threads").update({
            "title": title,
        }).eq("id", thread_id).eq("user_id", user_id).execute()

    # 2) Replace messages for this thread
    supabase.table("chat_messages").delete().eq("thread_id", thread_id).execute()

    now = datetime.utcnow().isoformat()

    backend_rows = []
    for m in frontend_messages:
        role = "user" if m.get("from") == "user" else "assistant"
        backend_rows.append({
            "thread_id": thread_id,
            "role": role,
            "content": m.get("text", ""),
            "created_at": now,
        })

    if backend_rows:
        supabase.table("chat_messages").insert(backend_rows).execute()

    return jsonify({"thread": {"id": thread_id, "title": title}})

# ---------- NOTES --------------
@app.route("/api/generate-notes", methods=["POST"])
def api_generate_notes():
    data = request.get_json() or {}
    topic = (data.get("topic") or "").strip()
    note_format = (data.get("note_format") or "detailed").strip()
    custom_prompt = data.get("custom_prompt") or ""
    username = normalize_username(data.get("username") or "")

    if not topic or not username:
        return jsonify(success=False, error="Missing topic or username"), 400

    # ---------- 1) Build LLM prompt ----------
    base_instruction = build_format_instruction(note_format)
    user_prompt = (
        f"You are generating high-quality study material strictly from the "
        f"user's uploaded notes. Topic: '{topic}'.\n\n"
        f"Output format: {base_instruction}.\n\n"
        f"Additional instructions from user (if any): {custom_prompt}\n\n"
        f"Use clear headings, bullet points, and well-structured sections. "
        f"Do not hallucinate content that is not present or implied in the uploaded notes."
    )

    # ---------- 2) RAG retrieval ----------
    try:
        q_emb = embed_local([user_prompt])[0]
        results = search_faiss(username, None, q_emb, top_k=8)
    except Exception as e:
        print("RAG error:", e)
        results = []

    context_blocks = []
    for r in results or []:
        context_blocks.append(
            f"[{r['folder_title']} / {r['section_title']}] {r['content']}"
        )
    context = "\n\n".join(context_blocks)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        SystemMessage(content=f"Context (user uploaded notes only):\n{context}"),
        HumanMessage(content=user_prompt),
    ]

    # ---------- 3) Call LLM ----------
    try:
        resp = llm.invoke(messages)
        raw_notes = resp.content.strip()
    except Exception as e:
        print("LLM error:", e)
        return jsonify(success=False, error="LLM failed"), 500

    if not raw_notes:
        return jsonify(success=False, error="Empty notes"), 500

    # ---------- 4) Convert TEXT -> PDF bytes via ReportLab ----------
    pdf_bytes = notes_to_pdf_bytes(topic, note_format, raw_notes)

    # ---------- 5) Upload PDF using existing upload flow ----------
    tmp = NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.write(pdf_bytes)
    tmp.flush()

    pdf_file = FileStorage(
        stream=open(tmp.name, "rb"),
        filename=f"{topic.replace(' ', '_')}_{note_format}.pdf",
        content_type="application/pdf",
    )

    try:
        paths = upload_generated_file_to_supabase(
            root_type="generated_notes",
            username=username,  # already normalized earlier
            title=f"{topic}_{note_format}_notes",
            file_obj=pdf_file,
        )
    except Exception as e:
        print("[GENERATE-NOTES] upload to supabase failed:", e)
        import traceback; traceback.print_exc()
        return jsonify(success=False, error="Upload failed", details=str(e)), 500


    return jsonify(
    success=True,
    notes=raw_notes,
    pdf_paths=paths,
    )

def build_format_instruction(fmt: str) -> str:
    mapping = {
        "detailed": "Detailed, hierarchical point-wise notes with headings, subheadings, and bullet points.",
        "summarization": "Concise summary capturing key ideas, arguments, formulas, and results.",
        "cheatsheet": "Highly compressed cheat sheet with formulas, definitions, and must-remember facts.",
        "mindmap": "Mind map style: central topic, main branches as headings, sub-branches as nested bullet points.",
        "checklist": "Checklist of most important topics and subtopics with checkboxes syntax.",
        "qa": "Question-and-answer pairs that cover the topic comprehensively.",
        "differentiation": "Side-by-side style explanations of differences between related concepts.",
        "keywords": "List of important keywords with 1–2 line definitions each.",
        "diagrams": "Textual descriptions of diagrams, labeled parts, and how to draw them step by step.",
        "pyqs": "Solved previous year questions with step-by-step solutions.",
        "practice_papers": "Practice question paper: sections, marks, and a variety of question types.",
    }
    return mapping.get(fmt, mapping["detailed"])

def render_notes_html(topic, fmt, body_text):
    # body_text is Markdown-like or plain text; you can keep it simple
    safe_topic = escape(topic)
    safe_body = body_text.replace("\n", "<br/>")  # quick version; can be improved
    return f"""
    <html>
      <head>
        <meta charset="utf-8" />
        <title>{safe_topic} - {fmt}</title>
        <style>
          body {{ font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
                 font-size: 12pt; line-height: 1.5; padding: 24px; }}
          h1, h2, h3 {{ color: #333; }}
          ul {{ margin-left: 18px; }}
          .meta {{ font-size: 10pt; color: #666; margin-bottom: 12px; }}
        </style>
      </head>
      <body>
        <h1>{safe_topic} ({fmt})</h1>
        <div class="meta">Generated from your uploaded notes in ExamBuddy.</div>
        <div>{safe_body}</div>
      </body>
    </html>
    """

def notes_to_pdf_bytes(topic: str, note_format: str, notes: str) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    # margins
    left = 50
    top = height - 50
    line_height = 14

    # title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(left, top, f"{topic} ({note_format})")
    y = top - 2 * line_height

    # body
    c.setFont("Helvetica", 11)
    for raw_line in notes.splitlines():
        line = raw_line.rstrip()

        if not line:
            y -= line_height
        else:
            if y < 60:
                c.showPage()
                c.setFont("Helvetica", 11)
                y = height - 50
            c.drawString(left, y, line)
            y -= line_height

    c.showPage()
    c.save()
    return buf.getvalue()

def upload_generated_file_to_supabase(root_type: str, username: str, title: str, file_obj):
    if not supabase_available():
        raise RuntimeError("Supabase not configured")
    
    root_type="generated_notes"

    username_norm = normalize_username(username)
    title_norm = normalize_title(title)
    base_prefix = f"{root_type}/{username_norm}/{title_norm}/"

    storage = supabase.storage.from_(STORAGE_BUCKET)
    saved_paths = []

    # file_obj is a single FileStorage here
    if not file_obj or not file_obj.filename:
        raise RuntimeError("No valid file provided")

    filename = os.path.basename(file_obj.filename)
    key = base_prefix + filename

    try:
        storage.remove(key)
    except Exception as e:
        print("DELETE BEFORE REPLACE ERROR for", key, ":", e)

    file_bytes = file_obj.read()
    print("UPLOADING", key, "size:", len(file_bytes))

    resp = storage.upload(
        key,
        file_bytes,
        {"content-type": file_obj.mimetype or "application/octet-stream"},
    )
    print("UPLOAD RESP for", key, "=>", resp)

    if isinstance(resp, dict) and resp.get("error"):
        raise RuntimeError(str(resp["error"]))

    saved_paths.append(key)

    try:
        ingest_single_file(
            username=username_norm,
            title=title_norm,
            path_in_bucket=key,
        )
    except Exception as e:
        print("INGEST ERROR for", key, ":", e)

    return saved_paths

# ---------- Mind Map ----------
def extract_json_from_response(text: str) -> dict:
    """
    Extract JSON from LLM response, handling code fences and noise.
    Returns dict or raises Exception with detailed error.
    """
    text = text.strip()

    # Remove code fences (``` or ```json)
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    text = text.strip()

    # Try to find JSON object in the text (handles trailing text)
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        json_str = match.group(0)
    else:
        json_str = text

    try:
        data = json.loads(json_str)
        return data
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Attempted to parse: {json_str[:200]}...")
        raise ValueError(f"Failed to parse JSON from LLM response: {e}")

def build_mindmap_prompt(topic: str, extra: str) -> str:
    """
    Build a crystal-clear prompt for JSON mind map generation.
    """
    prompt = f"""Create a hierarchical mind map for exam preparation on: {topic}

            Return ONLY a valid JSON object (no other text) with this exact structure:
            {{
            "label": "Main Topic Name",
            "children": [
                {{
                "label": "Subtopic 1",
                "children": [
                    {{"label": "Key point 1.1", "children": []}},
                    {{"label": "Key point 1.2", "children": []}}
                ]
                }},
                {{
                "label": "Subtopic 2",
                "children": [
                    {{"label": "Key point 2.1", "children": []}}
                ]
                }}
            ]
            }}

            Guidelines:
            - Each label should be 5-10 words max
            - Go 2-3 levels deep
            - Use clear, exam-focused terminology
            - Return ONLY the JSON, nothing else"""

    if extra:
        prompt += f"Additional instructions: {extra}"

    return prompt


def call_llm_for_mindmap(topic: str, extra: str) -> dict:
    """
    Call LLM and robustly parse JSON response.
    """
    prompt = build_mindmap_prompt(topic, extra)
    
    try:
        resp = llm.invoke(prompt)
        raw_response = resp.content.strip()
        
        print(f"[MINDMAP] Raw LLM response:{raw_response}")
        
        # Extract and parse JSON
        mindmap_tree = extract_json_from_response(raw_response)
        
        print(f"[MINDMAP] Parsed tree successfully: {json.dumps(mindmap_tree, indent=2)}")
        return mindmap_tree
        
    except Exception as e:
        print(f"[MINDMAP ERROR] LLM call failed: {e}")
        # Fallback minimal tree
        fallback = {
            "label": topic,
            "children": [
                {"label": "Main concepts", "children": []},
                {"label": "Key definitions", "children": []},
                {"label": "Important formulas", "children": []}
            ]
        }
        print(f"[MINDMAP] Using fallback tree: {json.dumps(fallback, indent=2)}")
        return fallback

def draw_node(c: canvas.Canvas, node: dict, x: float, y: float,
              indent: float, line_height: float = 18, max_width: float = 500) -> float:
    """
    Recursively draw mind map nodes on PDF canvas.
    """
    label = str(node.get("label", "Untitled"))
    
    # Wrap long labels
    if len(label) > 60:
        label = label[:60] + "..."
    
    # Determine font/indent based on depth
    depth_level = int(indent / 12)
    if depth_level == 0:
        c.setFont("Helvetica-Bold", 12)
        prefix = "●"
    elif depth_level == 1:
        c.setFont("Helvetica-Bold", 11)
        prefix = "◆"
    else:
        c.setFont("Helvetica", 10)
        prefix = "○"
    
    # Draw the node
    c.drawString(x + indent, y, f"{prefix} {label}")
    y -= line_height

    # Process children
    children = node.get("children") or []
    for child in children:
        # Page break if needed
        if y < 60:
            c.showPage()
            y = A4 - 50
            c.setFont("Helvetica", 10)
        
        y = draw_node(c, child, x, y, indent + 20, line_height, max_width)
    
    return y

def generate_mindmap_pdf_bytes(topic: str, mindmap: dict) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    # Title
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(HexColor("#2563eb"))  # Use HexColor directly
    c.drawString(50, height - 40, f"Mind Map: {topic}")
    
    # Subtitle
    c.setFont("Helvetica", 10)
    c.setFillColor(grey)  # Use grey directly
    c.drawString(50, height - 60, "Exam preparation guide")
    
    # Draw the tree
    c.setFillColor(black)  # Use black directly
    c.setFont("Helvetica", 11)
    y = height - 90
    y = draw_node(c, mindmap, x=50, y=y, indent=0, line_height=18)

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()

def upload_mindmap_to_supabase(username: str, topic: str, pdf_bytes: bytes) -> str:
    """
    Upload mind map PDF to Supabase Storage.
    Mirrors your existing upload_docs logic.
    Returns public URL.
    """

    # Path: Username_MindMaps/Topic/mindmap.pdf
    file_path = f"{username}_MindMaps/{topic}/mindmap.pdf"
    try:
        # Upload with upsert=true to overwrite on regenerate
        res = supabase.storage.from_(STORAGE_BUCKET).upload(
            path=file_path,
            file=pdf_bytes,
            file_options={
                "content-type": "application/pdf",
                "cache-control": "3600",
                "upsert": "true",
            },
        )
        
        print(f"[MINDMAP] Uploaded to Supabase: {file_path}")
        
        # Build public URL (same pattern as your notes)
        public_url = (
            f"{SUPABASE_URL}/storage/v1/object/public/"
            f"{STORAGE_BUCKET}/{file_path}"
        )
        
        return public_url

    except Exception as e:
        print(f"[MINDMAP UPLOAD ERROR] {e}")
        raise

# ---------- Settings App------------------
# settings_routes.py
from flask import Blueprint
from flask_login import login_required
from werkzeug.utils import secure_filename

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

UPLOAD_DIR = "static/backgrounds"

@settings_bp.route("", methods=["GET"])
@login_required
def get_settings():
    # Example: settings stored on user model
    return jsonify({
        "theme": current_user.theme or "light",
        "background_url": current_user.background_url or ""
    })

@settings_bp.route("/theme", methods=["POST"])
@login_required
def update_theme():
    data = request.get_json() or {}
    theme = data.get("theme", "light")
    if theme not in ["light", "dark"]:
        return jsonify({"error": "invalid theme"}), 400
    current_user.theme = theme
    # db.session.commit()
    return jsonify({"theme": theme})

@settings_bp.route("/background", methods=["POST"])
@login_required
def update_background():
    if "background" not in request.files:
        return jsonify({"error": "no file"}), 400
    f = request.files["background"]
    filename = secure_filename(f.filename)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, filename)
    f.save(path)
    url = f"/{path}"
    current_user.background_url = url
    # db.session.commit()
    return jsonify({"background_url": url})

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/signout", methods=["POST"])
@login_required
def signout():
    logout_user()
    return jsonify({"success": True})

#--------- FeedBack App -----------
# feedback_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")

@feedback_bp.route("", methods=["POST"])
@login_required
def create_feedback():
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "empty"}), 400

    # Example: persist feedback
    # fb = Feedback(user_id=current_user.id, text=text, created_at=datetime.utcnow())
    # db.session.add(fb); db.session.commit()

    return jsonify({"success": True, "timestamp": datetime.utcnow().isoformat()})

#---------Games App-----------
# games_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import random

games_bp = Blueprint("games", __name__, url_prefix="/api/games")

@games_bp.route("/profile", methods=["GET"])
@login_required
def games_profile():
    # Example: compute from DB and feedback
    return jsonify({
        "user_id": current_user.id,
        "level": 3,
        "xp": 1200,
        "preferred_methods": ["quiz", "flashcards", "active_recall"],
        "progress": {"completed_challenges": 42}
    })

@games_bp.route("/leaderboard", methods=["GET"])
@login_required
def leaderboard():
    # Example static data; in real app query aggregated stats
    entries = [
        {"user_id": 1, "username": "Alice", "points": 2500},
        {"user_id": 2, "username": "Bob", "points": 2200},
    ]
    return jsonify({"entries": entries})

@games_bp.route("/challenge", methods=["POST"])
@login_required
def challenge():
    data = request.get_json() or {}
    mode = data.get("mode", "quiz")
    # Use user prefs + feedback-driven rules to generate challenge
    base_prompt = {
        "quiz": "Answer this MCQ about today's topic.",
        "flashcards": "Recall the definition of spaced repetition.",
        "riddles": "Solve this logic riddle related to algorithms.",
        "talks": "Explain this concept in your own words.",
        "active_recall": "Write everything you remember about linked lists.",
    }.get(mode, "Practice a concept in your own words.")
    return jsonify({
        "mode": mode,
        "prompt": base_prompt,
        "difficulty": random.choice(["easy", "medium", "hard"])
    })

#------------Voice Bot--------------
# voicebot_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime

voicebot_bp = Blueprint("voicebot", __name__, url_prefix="/api/voicebot")

@voicebot_bp.route("/message", methods=["POST"])
@login_required
def voicebot_message():
    data = request.get_json() or {}
    content = data.get("content", "")
    history = data.get("history", [])

    # Here you would call your LLM / RAG pipeline
    reply = f"I heard: {content}. Let's keep going with your study plan."

    # Persist context
    # conv = Conversation(user_id=current_user.id, messages=history + [{"role": "assistant", "content": reply}])
    # db.session.add(conv); db.session.commit()

    return jsonify({
        "reply": reply,
        "timestamp": datetime.utcnow().isoformat()
    })

#-------------Planner App------------------
# planner_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import date, timedelta

planner_bp = Blueprint("planner", __name__, url_prefix="/api/planner")

@planner_bp.route("/preferences", methods=["GET"])
@login_required
def get_preferences():
    # Example placeholders
    preferences = {
        "hoursPerDay": 2,
        "focusAreas": ["DSA", "OS"]
    }
    plan = _generate_dummy_plan(preferences)
    return jsonify({"preferences": preferences, "plan": plan})

@planner_bp.route("/generate", methods=["POST"])
@login_required
def generate_plan():
    data = request.get_json() or {}
    preferences = data.get("preferences", {})
    plan = _generate_dummy_plan(preferences)
    return jsonify({"plan": plan})

@planner_bp.route("/save", methods=["POST"])
@login_required
def save_plan():
    data = request.get_json() or {}
    plan = data.get("plan")
    # Persist plan and sync with calendar
    # db.session.add(...); db.session.commit()
    return jsonify({"success": True})

def _generate_dummy_plan(preferences):
    start = date.today()
    focus = preferences.get("focusAreas", ["General"])
    hours = preferences.get("hoursPerDay", 2)
    days = []
    for i in range(7):
        d = start + timedelta(days=i)
        topic = focus[i % len(focus)]
        days.append({
            "date": d.isoformat(),
            "tasks": [f"Study {topic} for {hours} hours"]
        })
    return {"days": days}

#----------------News App -----------------
# news_routes.py
from flask import Blueprint, request, jsonify

news_bp = Blueprint("news", __name__, url_prefix="/api/news")

@news_bp.route("", methods=["GET"])
def get_news():
    domain = request.args.get("domain", "ai")
    # Call external news API / your scraper here
    # For now, dummy articles:
    articles = [
        {"id": 1, "title": f"Latest {domain} update 1", "url": "https://example.com/1"},
        {"id": 2, "title": f"Latest {domain} update 2", "url": "https://example.com/2"},
    ]
    return jsonify({"articles": articles})

#-------------- Browser App----------------
# browser_routes.py
from flask import Blueprint, request, jsonify
import requests
from bs4 import BeautifulSoup

browser_bp = Blueprint("browser", __name__, url_prefix="/api/browser")

@browser_bp.route("/search", methods=["GET"])
def search():
    q = request.args.get("q", "")
    # Plug in real search API; dummy data here
    results = [
        {"title": f"Result for {q}", "url": "https://example.com"},
    ]
    return jsonify({"results": results})

@browser_bp.route("/scrape", methods=["POST"])
def scrape():
    data = request.get_json() or {}
    url = data.get("url")
    if not url:
        return jsonify({"error": "url required"}), 400
    resp = requests.get(url, timeout=5)
    soup = BeautifulSoup(resp.text, "html.parser")
    text = soup.get_text(separator="\n")[:4000]
    return jsonify({"text": text})

#--------------------Note Pad -----------------
# notepad_routes.py
from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from io import BytesIO
import json

notepad_bp = Blueprint("notepad", __name__, url_prefix="/api/notepad")

@notepad_bp.route("", methods=["GET"])
@login_required
def get_note():
    # Example: load from user profile / notes table
    note = {
        "content": "",
        "style": {"color": "#000000", "fontFamily": "Arial", "fontSize": 16},
    }
    return jsonify(note)

@notepad_bp.route("", methods=["POST"])
@login_required
def save_note():
    data = request.get_json() or {}
    content = data.get("content", "")
    style = data.get("style", {})
    # Save to DB
    # note = Note(user_id=current_user.id, content=content, style=json.dumps(style))
    # db.session.add(note); db.session.commit()
    return jsonify({"success": True})

@notepad_bp.route("/download", methods=["GET"])
@login_required
def download_note():
    # Load content from DB; placeholder:
    content = "Your note content here"
    buf = BytesIO()
    buf.write(content.encode("utf-8"))
    buf.seek(0)
    return send_file(
        buf,
        as_attachment=True,
        download_name="note.txt",
        mimetype="text/plain"
    )

if __name__ == "__main__":
    app.run(debug=True)
