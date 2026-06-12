from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL                = os.getenv("DATABASE_URL")
SECRET_KEY                  = os.getenv("SECRET_KEY", "dev_secret_key")
ALGORITHM                   = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Carpetas de almacenamiento de archivos
BASE_DIR        = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_PLANES   = os.path.join(BASE_DIR, "uploads", "planes")
UPLOAD_EVIDENCIAS = os.path.join(BASE_DIR, "uploads", "evidencias")

# Crear carpetas si no existen
os.makedirs(UPLOAD_PLANES,    exist_ok=True)
os.makedirs(UPLOAD_EVIDENCIAS, exist_ok=True)
