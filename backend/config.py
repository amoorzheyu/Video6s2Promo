import os
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
API_KEY: str = os.getenv("API_KEY", "")
