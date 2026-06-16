import sys
import os

# Add the parent directory to Python path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to database to insert seed data...")
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Check if there are already directions
    result = db.execute(text("SELECT COUNT(*) FROM direcciones")).scalar()
    if result == 0:
        print("Seeding directions...")
        directions = [
            ("Decanato", "Decanato de la Facultad de Ingeniería Estadística e Informática"),
            ("Dirección de Escuela Profesional", "Dirección de la Escuela Profesional de Ingeniería Estadística e Informática"),
            ("Oficina de Acreditación", "Oficina de Acreditación y Calidad Académica de la FINESI"),
            ("Oficina de Investigación", "Oficina de Investigación de la FINESI"),
            ("Comisión Curricular", "Comisión Curricular y de Plan de Estudios de la FINESI"),
            ("Comisión de Responsabilidad Social", "Comisión de Proyección Social y Responsabilidad Social de la FINESI")
        ]
        
        for name, desc in directions:
            db.execute(
                text("INSERT INTO direcciones (nombre, descripcion) VALUES (:nombre, :descripcion)"),
                {"nombre": name, "descripcion": desc}
            )
        db.commit()
        print("Directions seeded successfully!")
    else:
        print(f"Database already has {result} directions. Skipping seeding directions.")
        
except Exception as e:
    db.rollback()
    print("Error seeding database:", e)
finally:
    db.close()
