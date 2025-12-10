# backend/config.py
import os
from supabase import create_client, Client
from huggingface_hub import InferenceClient  # or requests-based helpers
from dotenv import load_dotenv
from pathlib import Path
# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parents[1]  # goes to Root/ExamBuddy
ROOT_DIR = BASE_DIR.parent                      # goes to Root/
ENV_PATH = ROOT_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

# Supabase
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
STORAGE_BUCKET = "user-resources"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

