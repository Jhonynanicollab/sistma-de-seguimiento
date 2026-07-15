import sys
import os

# Add the parent directory to Python path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Import metadata and models
from app.db.database import engine, Base
from app.models import Direccion, PlanTrabajo, Actividad, Evidencia, Usuario
from app.utils.helpers import hash_password

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

print(f"Connecting to database to recreate tables and insert seed data...")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # 1. Drop and recreate all tables to apply the new schema (adding usuarios.direccion_id)
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

    # 2. Seed official FINESI Directions/Offices
    # Format: (nombre, descripcion)
    directions_list = [
        ("DECANO", "Encargado: Dr. Charles Ignacio Mendoza Mollocondo"),
        ("DIRECTOR DE ESCUELA", "Encargado: Dr. Godolfredo Quispe Mamani"),
        ("DIRECTOR DE DEPARTAMENTO ACADEMICO", "Encargado: Dr. Juan Reynaldo Paredes Quispe"),
        ("SECRETARIA TECNICA", "Encargado: M. Sc. Leonid Aleman Gonzales"),
        ("DIRECTOR DE LA UNIDAD DE POSGRADO", "Encargado: Dr. Vladimiro Ibañes Quispe"),
        ("DIRECTOR DE LA UNIDAD DE INVESTIGACION", "Encargado: Dr. Bernabé Canqui Flores"),
        ("COORDINADOR DE TUTORIA", "Encargado: Dr. Renzo Apaza Cutipa"),
        ("COORDINADOR DE CONVENIOS", "Encargado: Dr. Milton Antonio Lopez Cueva"),
        ("PRESIDENTE DE COMITÉ DE CALIDAD Y ACREDITACION", "Encargado: Dr. Angel Javier Quispe Carita"),
        ("COORDINADOR DE LABORATORIO Y GABINETE", "Encargado: Dr. Edgar Eloy Carpio Vargas"),
        ("COORDINADOR DE SEGUIMIENTO DE EGRESADO", "Encargado: Dr. Jose Pontilo Tito Lipa"),
        ("COORDINADOR DE RESPONSABILIDAD SOCIAL", "Encargado: M. Sc. Elqui Yeye Pari Condori"),
        ("RESPONSABLE DE INFRAESTRUCTURA", "Encargado: Dr. Leonel Coyla Idme"),
        ("RESPONSABLE DE PAGINA WEB DEL PROGRAMA", "Encargado: Dr. Juan Carlos Juarez Vargas"),
        ("RESPONSABLE DE POLITICAS AMBIENTALES", "Encargado: M. Sc. Alcides Ramos Calcina"),
        ("COORDINADOR DE BIBLIOTECA ESPECIAL", "Encargado: M. Sc. Leonid Aleman Gonzales"),
        ("COORDINADOR DE PRACTICAS PRE PROFESIONALES", "Encargado: Dr. Juan Reynaldo Paredes Quispe")
    ]

    print("Inserting official FINESI directions...")
    direction_ids = {}
    for name, desc in directions_list:
        res = db.execute(
            text("INSERT INTO direcciones (nombre, descripcion) VALUES (:nombre, :descripcion) RETURNING id"),
            {"nombre": name, "descripcion": desc}
        ).fetchone()
        direction_ids[name] = res[0]
    db.commit()
    print("Directions seeded successfully!")

    # 3. Seed Users
    # Password default: finesi123
    password_hash = hash_password("finesi123")
    
    # Format: (nombre, email, rol, direccion_key_or_None)
    users = [
        # System Admin
        ("Admin Sistema", "admin@finesi.unap.edu.pe", "admin", None),
        # Office Encargados linked to their corresponding direction
        ("Dr. Charles Ignacio Mendoza Mollocondo", "decano@finesi.unap.edu.pe", "admin", "DECANO"),
        ("Dr. Godolfredo Quispe Mamani", "escuela@finesi.unap.edu.pe", "editor", "DIRECTOR DE ESCUELA"),
        ("Dr. Juan Reynaldo Paredes Quispe", "departamento@finesi.unap.edu.pe", "editor", "DIRECTOR DE DEPARTAMENTO ACADEMICO"),
        ("M. Sc. Leonid Aleman Gonzales", "secretaria@finesi.unap.edu.pe", "editor", "SECRETARIA TECNICA"),
        ("Dr. Vladimiro Ibañes Quispe", "posgrado@finesi.unap.edu.pe", "editor", "DIRECTOR DE LA UNIDAD DE POSGRADO"),
        ("Dr. Bernabé Canqui Flores", "investigacion@finesi.unap.edu.pe", "editor", "DIRECTOR DE LA UNIDAD DE INVESTIGACION"),
        ("Dr. Renzo Apaza Cutipa", "tutoria@finesi.unap.edu.pe", "editor", "COORDINADOR DE TUTORIA"),
        ("Dr. Milton Antonio Lopez Cueva", "convenios@finesi.unap.edu.pe", "editor", "COORDINADOR DE CONVENIOS"),
        ("Dr. Angel Javier Quispe Carita", "acreditacion@finesi.unap.edu.pe", "admin", "PRESIDENTE DE COMITÉ DE CALIDAD Y ACREDITACION"),
        ("Dr. Edgar Eloy Carpio Vargas", "laboratorio@finesi.unap.edu.pe", "editor", "COORDINADOR DE LABORATORIO Y GABINETE"),
        ("Dr. Jose Pontilo Tito Lipa", "egresados@finesi.unap.edu.pe", "editor", "COORDINADOR DE SEGUIMIENTO DE EGRESADO"),
        ("M. Sc. Elqui Yeye Pari Condori", "rsu@finesi.unap.edu.pe", "editor", "COORDINADOR DE RESPONSABILIDAD SOCIAL"),
        ("Dr. Leonel Coyla Idme", "infraestructura@finesi.unap.edu.pe", "editor", "RESPONSABLE DE INFRAESTRUCTURA"),
        ("Dr. Juan Carlos Juarez Vargas", "web@finesi.unap.edu.pe", "editor", "RESPONSABLE DE PAGINA WEB DEL PROGRAMA"),
        ("M. Sc. Alcides Ramos Calcina", "ambiental@finesi.unap.edu.pe", "editor", "RESPONSABLE DE POLITICAS AMBIENTALES"),
        ("M. Sc. Leonid Aleman Gonzales (Biblioteca)", "biblioteca@finesi.unap.edu.pe", "editor", "COORDINADOR DE BIBLIOTECA ESPECIAL"),
        ("Dr. Juan Reynaldo Paredes Quispe (Prácticas)", "practicas@finesi.unap.edu.pe", "editor", "COORDINADOR DE PRACTICAS PRE PROFESIONALES")
    ]

    print("Inserting official FINESI users linked to directions...")
    for name, email, role, dir_key in users:
        dir_id = direction_ids[dir_key] if dir_key else None
        db.execute(
            text("""
                INSERT INTO usuarios (nombre, email, hashed_password, rol, activo, direccion_id) 
                VALUES (:nombre, :email, :password_hash, :rol, :activo, :dir_id)
            """),
            {"nombre": name, "email": email, "password_hash": password_hash, "rol": role, "activo": True, "dir_id": dir_id}
        )
    db.commit()
    print("Users seeded successfully!")
    print("\nAll accounts have default password: 'finesi123'")

except Exception as e:
    db.rollback()
    print("Error seeding database:", e)
finally:
    db.close()
