import sys
import os

# Add the parent directory to Python path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Import our helper function
from app.utils.helpers import hash_password

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to database to insert seed users...")
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Check if admin user already exists
    admin_email = "admin@finesi.unap.edu.pe"
    acred_email = "acreditacion@finesi.unap.edu.pe"
    
    # Generate hashes
    admin_hash = hash_password("admin123")
    acred_hash = hash_password("admin123")
    
    # Delete existing test users if they exist to avoid conflict
    db.execute(text("DELETE FROM usuarios WHERE email IN (:admin, :acred)"), {"admin": admin_email, "acred": acred_email})
    
    # Insert new users
    db.execute(
        text("INSERT INTO usuarios (nombre, email, hashed_password, rol, activo) VALUES (:nombre, :email, :password_hash, :rol, :activo)"),
        {"nombre": "Admin Sistema", "email": admin_email, "password_hash": admin_hash, "rol": "admin", "activo": True}
    )
    
    db.execute(
        text("INSERT INTO usuarios (nombre, email, hashed_password, rol, activo) VALUES (:nombre, :email, :password_hash, :rol, :activo)"),
        {"nombre": "Oficina Acreditacion", "email": acred_email, "password_hash": acred_hash, "rol": "editor", "activo": True}
    )
    
    db.commit()
    print("Seed users created successfully!")
    print(f"Admin User: {admin_email} / Password: admin123")
    print(f"Acreditación User: {acred_email} / Password: admin123")
    
except Exception as e:
    db.rollback()
    print("Error seeding database:", e)
finally:
    db.close()
