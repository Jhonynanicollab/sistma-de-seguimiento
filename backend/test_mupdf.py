import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.ocr import extraer_datos_pdf
from app.services import actividad_extractor

pdf_file = r"uploads/planes/plan_2_ea20c898b8004e7885d002e5a270917a.pdf"

print(f"Testing extraction on {pdf_file}...")
try:
    texto, paginas_detalles = extraer_datos_pdf(pdf_file)
    print("PDF Text extracted successfully!")
    print(f"Total Pages: {len(paginas_detalles)}")
    
    # Try table and regex extraction
    actividades = actividad_extractor.extraer_actividades(pdf_file, texto)
    print(f"Extraction completed successfully! Found {len(actividades)} activities.")
    for idx, act in enumerate(actividades[:5]):
        print(f"Act {idx+1}: {act.nombre} | Resp: {act.responsable} | Start: {act.fecha_inicio} | End: {act.fecha_fin}")
        
except Exception as e:
    import traceback
    print("ERROR OCCURRED:")
    traceback.print_exc()
