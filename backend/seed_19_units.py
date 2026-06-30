import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

backend_path = r"C:\Users\crist\Documents\2026\practicas pre profesionales\sistema de monitoreo de plan de trabajo\practica_sistema\sistema-seguimiento-pti\backend"
sys.path.append(backend_path)
os.chdir(backend_path)

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    sys.exit(1)

engine = create_engine(db_url)
connection = engine.connect()

print("Seeding the 19 FINESI organizational units...")

# Define the new units list
# Format: (nombre, descripcion)
new_units = [
    # Decanato
    ("Decanato", "Decanato de la Facultad de Ingeniería Estadística e Informática (DEC)"),
    # Direcciones académicas
    ("Dirección de Escuela Profesional", "Dirección de la Escuela Profesional de Ingeniería Estadística e Informática (DEP)"),
    ("Dirección de Investigación", "Dirección de Investigación de la Facultad (DI)"),
    ("Dirección de Posgrado", "Dirección de Posgrado de la Facultad (DPG)"),
    ("Dirección de Proyección Social y Extensión Cultural", "Dirección de Proyección Social y Extensión Cultural (DPSEC)"),
    # Oficinas administrativas
    ("Oficina de Acreditación y Calidad Educativa", "Oficina de Acreditación y Calidad Educativa de la Facultad (OACE)"),
    ("Oficina de Tutoría y Orientación al Estudiante", "Oficina de Tutoría y Orientación al Estudiante (OTOE)"),
    ("Oficina de Prácticas Pre-Profesionales", "Oficina de Prácticas Pre-Profesionales (OPPP)"),
    ("Oficina de Grados y Títulos", "Oficina de Grados y Títulos administrativa (OGT)"),
    ("Secretaría Académica", "Secretaría Académica de la Facultad (SA)"),
    # Comisiones permanentes
    ("Comisión de Currículo y Plan de Estudios", "Comisión de Currículo y Plan de Estudios permanente (COM-CURR)"),
    ("Comisión de Investigación y Proyectos", "Comisión de Investigación y Proyectos permanente (COM-INV)"),
    ("Comisión de Bienestar Universitario", "Comisión de Bienestar Universitario permanente (COM-BU)"),
    ("Comisión de Autoevaluación y Acreditación", "Comisión de Autoevaluación y Acreditación permanente (COM-ACRED)"),
    ("Comisión de Bolsa de Trabajo y Egresados", "Comisión de Bolsa de Trabajo y Egresados permanente (COM-EGR)"),
    # Comisiones especiales / temporales
    ("Comisión de Admisión", "Comisión de Admisión especial (COM-ADM)"),
    ("Comisión de Grados y Títulos", "Comisión de Grados y Títulos especial (COM-GT)"),
    ("Comisión de Evaluación Docente", "Comisión de Evaluación Docente especial (COM-EVAL)"),
    ("Comisión de Responsabilidad Social Universitaria", "Comisión de Responsabilidad Social Universitaria especial (COM-RSU)")
]

trans = connection.begin()
try:
    # 1. Insert new units and retrieve their IDs
    inserted_ids = {}
    for name, desc in new_units:
        # Check if already exists
        exist = connection.execute(
            text("SELECT id FROM direcciones WHERE nombre = :name"),
            {"name": name}
        ).fetchone()
        
        if exist:
            inserted_ids[name] = exist[0]
            print(f"Unit '{name}' already exists with ID {exist[0]}.")
        else:
            res = connection.execute(
                text("INSERT INTO direcciones (nombre, descripcion) VALUES (:name, :desc) RETURNING id"),
                {"name": name, "desc": desc}
            ).fetchone()
            inserted_ids[name] = res[0]
            print(f"Inserted unit '{name}' with ID {res[0]}.")

    # 2. Update existing work plans to point to the new units
    # Plan 1 was for old ID 2 (Acreditacion). Let's map it to 'Oficina de Acreditación y Calidad Educativa'
    oace_id = inserted_ids["Oficina de Acreditación y Calidad Educativa"]
    connection.execute(
        text("UPDATE planes_trabajo SET direccion_id = :oace_id WHERE direccion_id NOT IN (SELECT id FROM direcciones WHERE nombre IN (:decanato, :oace)) AND id = 1"),
        {"oace_id": oace_id, "decanato": "Decanato", "oace": "Oficina de Acreditación y Calidad Educativa"}
    )
    # Plan 2 was for old ID 4 (Decanatura). Let's map it to 'Decanato'
    dec_id = inserted_ids["Decanato"]
    connection.execute(
        text("UPDATE planes_trabajo SET direccion_id = :dec_id WHERE direccion_id NOT IN (SELECT id FROM direcciones WHERE nombre IN (:decanato, :oace)) AND id = 2"),
        {"dec_id": dec_id, "decanato": "Decanato", "oace": "Oficina de Acreditación y Calidad Educativa"}
    )

    # 3. Clean up the old duplicate/temporary directions that are not in the new list
    new_names = [name for name, _ in new_units]
    delete_res = connection.execute(
        text("DELETE FROM direcciones WHERE nombre NOT IN :names"),
        {"names": tuple(new_names)}
    )
    print(f"Deleted {delete_res.rowcount} old/duplicate directions.")
    
    trans.commit()
    print("Database successfully updated with the 19 units!")
except Exception as e:
    trans.rollback()
    print("Error during seeding:", e)
finally:
    connection.close()
