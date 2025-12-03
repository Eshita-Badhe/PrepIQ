import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

TEXT_EMBED_MODEL = "models/text-embedding-004"
VISION_EMBED_MODEL = "models/embedding-gecko-001"  # multimodal
LLM_MODEL = "gemini-1.5-flash"  # free, fast, multimodal
