# Sistema de Monitoreo de Planes de Trabajo y Actividades (Sistema PTI)
### 🏛️ Facultad de Ingeniería Estadística e Informática (FINESI) - UNA Puno

Este es el repositorio oficial del **Sistema de Seguimiento y Monitoreo del Plan de Trabajo Institucional (PTI)**, desarrollado para optimizar la gestión académica y administrativa de la **Facultad de Ingeniería Estadística e Informática (FINESI)** de la **Universidad Nacional del Altiplano (UNA Puno)**.

---

## 📖 1. Contexto Institucional del Sistema

El aseguramiento de la calidad educativa es un pilar fundamental en la educación universitaria actual. Para lograr y mantener acreditaciones de prestigio nacional e internacional (como **SINEACE** en Perú y **ICACIT** a nivel internacional), las facultades deben evidenciar un riguroso cumplimiento de sus objetivos operativos anuales.

En la **FINESI - UNA Puno**, la **Oficina de Acreditación y Calidad Educativa (OACE)** es la encargada de coordinar y supervisar los planes de trabajo de todas las subdivisiones de la facultad. Históricamente, este seguimiento se realizaba de manera manual utilizando carpetas compartidas, documentos físicos y hojas de cálculo dispersas. Esto generaba dificultades como:
* Falta de visibilidad en tiempo real del avance global de la facultad.
* Pérdida de tiempo en la consolidación de informes.
* Dificultades para auditar y validar los sustentos (evidencias) de cada actividad.

### Propósito del Sistema
El **Sistema PTI** soluciona estas problemáticas centralizando la información. Permite a las **direcciones de escuela, oficinas administrativas y comisiones permanentes o especiales** cargar sus planes de trabajo, extraer de forma inteligente sus actividades mediante procesamiento de documentos, y adjuntar evidencias digitales (PDFs) para sustentar la ejecución de cada tarea en un entorno digital integrado e interactivo.

---

## 🛠️ 2. Arquitectura del Sistema y Tecnologías

El sistema adopta una arquitectura desacoplada moderna (Frontend + API Backend) que facilita su mantenimiento, portabilidad y despliegue rápido.

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     FRONTEND (React + Vite)     │ ◄───────► │    BACKEND (FastAPI + Python)   │
│  - Renderizado SPA              │   HTTP    │  - Procesamiento OCR (PDF)      │
│  - Recharts (Visualización)     │   JSON    │  - SQLite (Base de datos)       │
│  - CSS Custom Variables         │           │  - SQLAlchemy ORM               │
└─────────────────────────────────┘           └─────────────────────────────────┘
```

### Tecnologías Utilizadas
* **Backend:**
  * **Python 3.10+**: Lenguaje de programación robusto y versátil.
  * **FastAPI**: Framework moderno de alto rendimiento para construir APIs con validación de tipos automática.
  * **SQLAlchemy & SQLite**: ORM para interactuar con una base de datos ligera y eficiente, ideal para despliegues rápidos y auditorías integradas.
  * **PyPDF2 / PDF Extraction libraries**: Para el escaneo estructurado y extracción automática de las actividades desde planes cargados en PDF.
* **Frontend:**
  * **React 18**: Librería de JavaScript para construir interfaces de usuario reactivas basadas en componentes.
  * **Vite**: Herramienta de compilación ultrarrápida para desarrollo frontend.
  * **Recharts**: Librería de visualización interactiva para renderizar gráficos circulares y de barras en tiempo real.
  * **Vanilla CSS (Custom Variables)**: Sistema de diseño personalizado y premium con soporte nativo de Light/Dark Mode (Modo Claro/Oscuro) sin dependencias externas pesadas.
  * **Tabler Icons**: Iconografía técnica y estilizada.

---

## 🗄️ 3. Estructura de la Base de Datos

El esquema relacional de la base de datos almacena las estructuras organizativas, planes de trabajo y evidencias de cumplimiento:

```
                  ┌───────────────┐
                  │   usuarios    │
                  └───────┬───────┘
                          │ (1:N)
                          ▼
┌───────────────┐ (1:N) ┌───────────────┐ (1:N) ┌───────────────┐ (1:N) ┌───────────────┐
│  direcciones  │──────►│planes_trabajo │──────►│  actividades  │──────►│  evidencias   │
└───────────────┘       └───────────────┘       └───────────────┘       └───────────────┘
```

### Tabla de Entidades Clave:
1. **`usuarios`**: Almacena las credenciales hash y el rol (`admin`, `editor`, `lector`) asignado a cada responsable técnico o directivo.
2. **`direcciones`**: Define las **19 unidades organizacionales** divididas por categorías:
   * **Decanato** (`DEC`)
   * **Dirección académica** (DEP, DI, DPG, DPSEC)
   * **Oficinas administrativas** (OACE, OTOE, OPPP, OGT, SA)
   * **Comisiones permanentes** (Curriculum, Investigación, Bienestar, Autoevaluación, Egresados)
   * **Comisiones especiales** (Admisión, Grados, Evaluación Docente, Responsabilidad Social)
3. **`planes_trabajo`**: Registra el título del plan, año, el archivo PDF del plan de trabajo original subido por el usuario, y la relación con la unidad organizacional.
4. **`actividades`**: Almacena de forma estructurada cada actividad extraída del plan, incluyendo su descripción, cronograma mensual, y su estado actual:
   * `pendiente` (Color Amber 🟡): Actividad programada sin iniciar.
   * `en_proceso` (Color Blue 🔵): Actividad ejecutándose actualmente.
   * `completada` o `cumplida` (Color Emerald 🟢): Actividad culminada con éxito y con evidencia registrada.
   * `no_cumplida` / `cancelada` (Color Red 🔴): Actividad cancelada o no ejecutada a tiempo.
5. **`evidencias`**: Contiene la ruta física del archivo PDF de sustento (informe, resolución, acta o foto firmada) que justifica el cumplimiento de una actividad en particular.

---

## ⚙️ 4. Guía de Instalación y Despliegue en Windows

Sigue estos pasos para desplegar el proyecto localmente en tu sistema Windows.

### Requisitos Previos:
* [Python 3.10 o superior](https://www.python.org/downloads/) (Asegúrate de marcar la opción "Add Python to PATH" durante la instalación).
* [Node.js (versión LTS recomendada)](https://nodejs.org/)
* Git (Opcional, para clonación).

---

### Paso 1: Configurar el Backend (FastAPI)

1. Abre una terminal de PowerShell o CMD en la raíz del proyecto.
2. Navega al directorio del backend:
   ```bash
   cd backend
   ```
3. Crea un entorno virtual de Python:
   ```bash
   python -m venv venv
   ```
4. Activa el entorno virtual:
   * En PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * En CMD:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
5. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
6. Inicializa la base de datos sqlite y ejecuta el servidor de desarrollo en el puerto `8000`:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *(El servidor backend estará disponible en `http://localhost:8000`)*.

---

### Paso 2: Configurar el Frontend (React + Vite)

1. Abre una **nueva** terminal y colócate en la carpeta raíz del proyecto.
2. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```
3. Instala los paquetes de Node:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   *(El frontend se compilará y estará disponible en `http://localhost:5173`)*.

---

## 🔑 5. Usuarios de Prueba Pre-Sembrados

El sistema ya viene con datos de prueba cargados automáticamente al iniciar. Puedes usar las siguientes credenciales para ingresar y verificar el comportamiento de los roles:

* **Rol Administrador (Acceso Completo):**
  * **Usuario:** `admin@finesi.unap.edu.pe`
  * **Contraseña:** `admin123`
* **Rol Editor (Oficina de Acreditación - OACE):**
  * **Usuario:** `acreditacion@finesi.unap.edu.pe`
  * **Contraseña:** `editor123`

---

## 💻 6. Características y Flujos de Uso Clave

1. **Página de Inicio Pública (`/`):** Presentación del sistema de calidad e indicadores generales de avance del plan de trabajo institucional.
2. **Dashboard Dinámico (`/dashboard`):** 
   * Muestra gráficos de pastel (Distribución de estados) y de barras (Rendimiento por unidad).
   * La barra izquierda contiene el listado de las **19 direcciones**, agrupadas de manera colapsable. Al hacer clic en una oficina, el dashboard de la derecha filtra en tiempo real y desglosa únicamente las estadísticas e indicadores de esa oficina mediante parámetros en la URL (`/dashboard?unit=CODE`).
3. **Módulo de Planes de Trabajo (`/planes`):** Carga un archivo PDF de plan de trabajo. El motor de extracción inteligente procesará el texto, encontrará la matriz de actividades y la creará automáticamente en la base de datos vinculada al plan.
4. **Módulo de Actividades (`/actividades`):** Administra las actividades. Permite a los editores subir archivos PDF de evidencia y actualizar los estados del semáforo.
5. **Modo Claro / Oscuro Inteligente:** El selector de la esquina superior derecha ajusta de forma fluida el esquema cromático para mayor comodidad visual en largas sesiones de revisión técnica.