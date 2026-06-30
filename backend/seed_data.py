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
            ("Decanato", "Decanato de la Facultad de Ingeniería Estadística e Informática (DEC)"),
            ("Dirección de Escuela Profesional", "Dirección de la Escuela Profesional de Ingeniería Estadística e Informática (DEP)"),
            ("Dirección de Investigación", "Dirección de Investigación de la Facultad (DI)"),
            ("Dirección de Posgrado", "Dirección de Posgrado de la Facultad (DPG)"),
            ("Dirección de Proyección Social y Extensión Cultural", "Dirección de Proyección Social y Extensión Cultural (DPSEC)"),
            ("Oficina de Acreditación y Calidad Educativa", "Oficina de Acreditación y Calidad Educativa de la Facultad (OACE)"),
            ("Oficina de Tutoría y Orientación al Estudiante", "Oficina de Tutoría y Orientación al Estudiante (OTOE)"),
            ("Oficina de Prácticas Pre-Profesionales", "Oficina de Prácticas Pre-Profesionales (OPPP)"),
            ("Oficina de Grados y Títulos", "Oficina de Grados y Títulos administrativa (OGT)"),
            ("Secretaría Académica", "Secretaría Académica de la Facultad (SA)"),
            ("Comisión de Currículo y Plan de Estudios", "Comisión de Currículo y Plan de Estudios permanente (COM-CURR)"),
            ("Comisión de Investigación y Proyectos", "Comisión de Investigación y Proyectos permanente (COM-INV)"),
            ("Comisión de Bienestar Universitario", "Comisión de Bienestar Universitario permanente (COM-BU)"),
            ("Comisión de Autoevaluación y Acreditación", "Comisión de Autoevaluación y Acreditación permanente (COM-ACRED)"),
            ("Comisión de Bolsa de Trabajo y Egresados", "Comisión de Bolsa de Trabajo y Egresados permanente (COM-EGR)"),
            ("Comisión de Admisión", "Comisión de Admisión especial (COM-ADM)"),
            ("Comisión de Grados y Títulos", "Comisión de Grados y Títulos especial (COM-GT)"),
            ("Comisión de Evaluación Docente", "Comisión de Evaluación Docente especial (COM-EVAL)"),
            ("Comisión de Responsabilidad Social Universitaria", "Comisión de Responsabilidad Social Universitaria especial (COM-RSU)")
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
