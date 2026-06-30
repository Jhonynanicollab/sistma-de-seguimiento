# Pruebas de Rendimiento con Apache JMeter
## Sistema de Seguimiento PTI (FINESI)

Este directorio contiene la configuración y la documentación necesarias para realizar pruebas de carga y estrés sobre los servicios del **Sistema de Seguimiento para el Plan de Trabajo Institucional**.

---

## 1. Archivo del Plan de Pruebas (.jmx)
El archivo **[seguimiento_pti_performance.jmx](file:///C:/Users/crist/Documents/2026/practicas%20pre%20profesionales/sistema%20de%20monitoreo%20de%20plan%20de%20trabajo/practica_sistema/sistema-seguimiento-pti/backend/tests/seguimiento_pti_performance.jmx)** contiene el diseño del plan de pruebas que simula múltiples usuarios concurrentes interactuando con el backend de la aplicación.

### Flujo automatizado en el script:
1. **Autenticación (POST `/auth/login`):** Envía las credenciales del usuario semilla en formato `x-www-form-urlencoded`.
2. **Extracción del Token (JSON PostProcessor):** Captura el token JWT retornado en el JSON de respuesta (`$.access_token`) y lo guarda dinámicamente en la variable `${JWT_TOKEN}`.
3. **Petición del Dashboard (GET `/dashboard/kpis`):** Solicita las métricas globales del sistema adjuntando el token JWT extraído en la cabecera `Authorization: Bearer ${JWT_TOKEN}`.
4. **Listado de Direcciones (GET `/direcciones/`):** Solicita el catálogo de oficinas de la FINESI usando la cabecera de autenticación.

---

## 2. Requisitos Previos e Instalación de Apache JMeter

Para ejecutar las pruebas en tu máquina Windows, sigue estos pasos:

1. **Instalar Java SDK:** JMeter requiere que tengas Java instalado en tu computadora. Puedes verificar si ya lo tienes ejecutando `java -version` en la terminal. Si no, descarga e instala **[Java OpenJDK](https://adoptium.net/)**.
2. **Descargar JMeter:**
   - Ve a la página de descargas oficial de **[Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi)**.
   - Descarga el archivo comprimido `.zip` de los binarios (por ejemplo, `apache-jmeter-5.x.zip`).
   - Descomprime el archivo en la ubicación que prefieras (por ejemplo, `C:\apache-jmeter`).
3. **Iniciar JMeter:**
   - Abre la carpeta donde lo descomprimiste y navega a `bin/`.
   - Haz doble clic sobre el archivo **`jmeter.bat`** para abrir la interfaz gráfica de JMeter.

---

## 3. Instrucciones de Ejecución

### Paso 1: Levantar el Backend
Asegúrate de que la base de datos PostgreSQL local esté iniciada y corre el backend de FastAPI en el puerto 8000:
```bash
# En la carpeta backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Paso 2: Cargar el Plan en JMeter
1. En la interfaz gráfica de Apache JMeter, haz clic en **File > Open** (o presiona `Ctrl + O`).
2. Navega hasta el archivo: `C:\Users\crist\Documents\2026\practicas pre profesionales\sistema de monitoreo de plan de trabajo\practica_sistema\sistema-seguimiento-pti\backend\tests\seguimiento_pti_performance.jmx`.
3. Haz clic en **Open**. Verás el árbol de pruebas cargado a la izquierda.

### Paso 3: Configurar los Parámetros de Carga (Opcional)
En la parte izquierda, haz clic sobre el elemento **"Grupo de Hilos (Usuarios Concurrentes)"** para configurar:
* **Número de Hilos (Threads):** Cantidad de usuarios virtuales simultáneos (configurado por defecto en `50`).
* **Período de Subida (Ramp-up period):** Tiempo en segundos en el cual se iniciarán la totalidad de usuarios virtuales (configurado por defecto en `10` segundos).
* **Contador de bucles (Loop Count):** Cuántas veces realizará cada usuario la secuencia de peticiones (configurado por defecto en `5` repeticiones).

### Paso 4: Ejecutar y Ver Resultados
1. Haz clic en el botón **Play (Iniciar)** (icono verde en la barra superior).
2. Para observar cómo se ejecutan las peticiones y sus respuestas en tiempo real:
   - Haz clic en **"Ver Árbol de Resultados"**: Aquí puedes inspeccionar el estado de cada petición individual, cabeceras enviadas y la respuesta JSON (debe dar `200 OK` en color verde).
   - Haz clic en **"Reporte Resumen"**: Muestra la tabla de desempeño consolidado con métricas clave para tu informe.

---

## 4. Visualización de Resultados Gráficos

El plan de pruebas incluye dos formas de analizar gráficamente la capacidad del sistema, ideales para adjuntar capturas en tu informe de prácticas:

### Opción A: Gráfico en Tiempo Real de JMeter (Integrado)
* Dentro de JMeter, selecciona el elemento **"Gráfico de Resultados"** en el panel izquierdo.
* Al ejecutar la prueba, se dibujará una gráfica de dispersión y tendencias:
  * **Línea Azul (Average):** El promedio de tiempo de respuesta general.
  * **Línea Verde (Throughput):** La cantidad de peticiones que el backend procesa por minuto.
  * **Línea Roja (Deviation):** La desviación estándar (consistencia de respuesta).
  * **Puntos (Muestras):** El comportamiento individual de cada petición HTTP.

### Opción B: Generar un Reporte HTML Interactivo (Recomendado)
JMeter permite generar un dashboard web interactivo con gráficos modernos (tiempos de respuesta, hitrate, latencias, percentiles, hilos activos, etc.).

Para generarlo de forma limpia desde una terminal de comandos en Windows, ejecuta:

1. Limpia resultados anteriores (si los hay):
   ```cmd
   del resultados.jtl
   rmdir /s /q reporte-grafico
   ```
2. Ejecuta el test en modo consola y exporta el dashboard HTML:
   ```cmd
   E:\apache-jmeter-5.6.3\apache-jmeter-5.6.3\bin\jmeter.bat -n -t seguimiento_pti_performance.jmx -l resultados.jtl -e -o reporte-grafico
   ```
   *(Hemos personalizado el comando con la ruta de tu instalación de JMeter).*
3. Abre la carpeta `reporte-grafico/` generada y haz doble clic sobre el archivo **`index.html`** para abrirlo en tu navegador. Tendrás un panel gráfico sumamente profesional interactivo para exportar y documentar en tu tesis o informe final.
