# backend/config.py
import os
from supabase import create_client, Client
from huggingface_hub import InferenceClient  # or requests-based helpers
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

# Supabase
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
STORAGE_BUCKET = "user-resources"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hugging Face
HF_API_TOKEN = os.environ["HF_API_TOKEN"]
EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
CHAT_MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2"
