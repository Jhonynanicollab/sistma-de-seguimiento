"""
Extracción de texto desde PDFs.
- Primero intenta extracción directa con PyMuPDF (PDFs con texto).
- Si una página no tiene texto suficiente, usa OCR con pytesseract (PDFs escaneados).
"""
import fitz          # PyMuPDF
import pytesseract
from PIL import Image
import io

# Ruta al ejecutable de Tesseract en Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Umbral mínimo de caracteres para considerar que una página tiene texto real
UMBRAL_TEXTO = 30


def extraer_texto_pagina_directa(page: fitz.Page) -> str:
    """Extrae texto directamente de una página PDF con texto embebido."""
    return page.get_text("text").strip()


def extraer_texto_pagina_ocr(page: fitz.Page) -> str:
    """Convierte la página a imagen y aplica OCR."""
    mat = fitz.Matrix(2, 2)          # escala x2 para mejor calidad OCR
    pix = page.get_pixmap(matrix=mat)
    img_bytes = pix.tobytes("png")
    img = Image.open(io.BytesIO(img_bytes))
    return pytesseract.image_to_string(img, lang="spa").strip()


def extraer_texto_pdf(ruta_pdf: str) -> str:
    """
    Extrae todo el texto de un PDF.
    Por cada página decide si usar extracción directa u OCR.
    Retorna el texto completo concatenado.
    """
    doc = fitz.open(ruta_pdf)
    paginas = []

    for num, page in enumerate(doc, start=1):
        texto = extraer_texto_pagina_directa(page)

        if len(texto) < UMBRAL_TEXTO:
            # Página escaneada — aplicar OCR
            texto = extraer_texto_pagina_ocr(page)

        paginas.append(f"--- Página {num} ---\n{texto}")

    doc.close()
    return "\n\n".join(paginas)
