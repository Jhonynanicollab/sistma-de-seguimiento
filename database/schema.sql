-- schema.sql - Esquema de base de datos
-- ============================================================
-- SISTEMA DE SEGUIMIENTO PARA PLAN DE TRABAJO INSTITUCIONAL
-- Universidad Nacional del Altiplano - FIEI
-- schema.sql - Estructura de base de datos PostgreSQL
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: usuarios
-- Usuarios del sistema con roles diferenciados
-- ============================================================
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    apellidos   VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol         VARCHAR(30) NOT NULL CHECK (rol IN ('admin', 'acreditacion', 'responsable')),
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema. Roles: admin (gestión total), acreditacion (Oficina de Acreditación), responsable (jefe de oficina/dirección)';
COMMENT ON COLUMN usuarios.rol IS 'admin: acceso total | acreditacion: revisión y reportes | responsable: carga y seguimiento de su propia oficina';

-- ============================================================
-- TABLA: direcciones
-- Oficinas, direcciones y comisiones de la Facultad
-- ============================================================
CREATE TABLE direcciones (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    codigo      VARCHAR(20) UNIQUE,                   -- Código interno (ej: DIR-EI, COM-CURR)
    tipo        VARCHAR(50) NOT NULL CHECK (tipo IN ('direccion', 'oficina', 'comision', 'decanato')),
    descripcion TEXT,
    responsable_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE direcciones IS 'Direcciones, oficinas y comisiones de la FIEI que presentan planes de trabajo';

-- ============================================================
-- TABLA: planes_trabajo
-- Plan de trabajo presentado por cada dirección/oficina
-- ============================================================
CREATE TABLE planes_trabajo (
    id              SERIAL PRIMARY KEY,
    direccion_id    INTEGER NOT NULL REFERENCES direcciones(id) ON DELETE RESTRICT,
    anio            INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
    semestre        INTEGER NOT NULL CHECK (semestre IN (1, 2)),
    titulo          VARCHAR(300),
    archivo_pdf     VARCHAR(500),                     -- Ruta relativa en uploads/planes/
    nombre_archivo  VARCHAR(255),                     -- Nombre original del archivo
    estado_carga    VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado_carga IN ('pendiente', 'procesando', 'procesado', 'error')),
    tipo_pdf        VARCHAR(20) CHECK (tipo_pdf IN ('digital', 'escaneado', 'mixto')),  -- RF04
    fecha_carga     TIMESTAMP,
    procesado_en    TIMESTAMP,
    observaciones   TEXT,
    cargado_por     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (direccion_id, anio, semestre)              -- Solo 1 plan por dirección/semestre
);

COMMENT ON TABLE planes_trabajo IS 'Planes de trabajo por dirección, año y semestre. Cada dirección tiene un único plan por período';
COMMENT ON COLUMN planes_trabajo.tipo_pdf IS 'Detectado automáticamente: digital (tiene texto), escaneado (solo imágenes), mixto';

-- ============================================================
-- TABLA: actividades
-- Actividades extraídas o registradas manualmente del plan
-- ============================================================
CREATE TABLE actividades (
    id              SERIAL PRIMARY KEY,
    plan_trabajo_id INTEGER NOT NULL REFERENCES planes_trabajo(id) ON DELETE CASCADE,
    nombre          VARCHAR(500) NOT NULL,
    descripcion     TEXT,
    fecha_inicio    DATE,
    fecha_fin       DATE,
    responsable     VARCHAR(200),                     -- Nombre del responsable de la actividad
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'cumplida', 'no_cumplida')),
    origen          VARCHAR(20) NOT NULL DEFAULT 'automatico'
                    CHECK (origen IN ('automatico', 'manual')),  -- RF06 vs RF08
    orden           INTEGER,                          -- Posición en el plan original
    fecha_actualizacion_estado TIMESTAMP,
    actualizado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE actividades IS 'Actividades del plan de trabajo. Pueden ser detectadas automáticamente (RF06) o agregadas manualmente (RF08)';
COMMENT ON COLUMN actividades.estado IS 'pendiente: sin evaluar | cumplida: ejecutada | no_cumplida: no ejecutada';

-- ============================================================
-- TABLA: evidencias
-- PDFs de evidencia asociados a cada actividad
-- ============================================================
CREATE TABLE evidencias (
    id              SERIAL PRIMARY KEY,
    actividad_id    INTEGER NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    archivo_pdf     VARCHAR(500) NOT NULL,            -- Ruta relativa en uploads/evidencias/
    nombre_archivo  VARCHAR(255) NOT NULL,
    descripcion     TEXT,
    fecha_carga     TIMESTAMP NOT NULL DEFAULT NOW(),
    cargado_por     INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE evidencias IS 'Archivos PDF de evidencia que respaldan el cumplimiento de una actividad (RF11)';

-- ============================================================
-- ÍNDICES — mejoran rendimiento en consultas frecuentes
-- ============================================================

-- Planes de trabajo
CREATE INDEX idx_planes_direccion    ON planes_trabajo(direccion_id);
CREATE INDEX idx_planes_anio_sem     ON planes_trabajo(anio, semestre);
CREATE INDEX idx_planes_estado_carga ON planes_trabajo(estado_carga);

-- Actividades
CREATE INDEX idx_actividades_plan    ON actividades(plan_trabajo_id);
CREATE INDEX idx_actividades_estado  ON actividades(estado);

-- Evidencias
CREATE INDEX idx_evidencias_actividad ON evidencias(actividad_id);

-- ============================================================
-- VISTA: v_indicadores_cumplimiento
-- Porcentaje de cumplimiento por plan de trabajo (RF14)
-- ============================================================
CREATE OR REPLACE VIEW v_indicadores_cumplimiento AS
SELECT
    pt.id                                           AS plan_id,
    pt.anio,
    pt.semestre,
    d.id                                            AS direccion_id,
    d.nombre                                        AS direccion_nombre,
    d.tipo                                          AS direccion_tipo,
    COUNT(a.id)                                     AS total_actividades,
    COUNT(a.id) FILTER (WHERE a.estado = 'cumplida')      AS cumplidas,
    COUNT(a.id) FILTER (WHERE a.estado = 'no_cumplida')   AS no_cumplidas,
    COUNT(a.id) FILTER (WHERE a.estado = 'pendiente')     AS pendientes,
    ROUND(
        CASE WHEN COUNT(a.id) = 0 THEN 0
             ELSE COUNT(a.id) FILTER (WHERE a.estado = 'cumplida') * 100.0 / COUNT(a.id)
        END, 2
    )                                               AS porcentaje_cumplimiento
FROM planes_trabajo pt
JOIN direcciones d ON d.id = pt.direccion_id
LEFT JOIN actividades a ON a.plan_trabajo_id = pt.id
GROUP BY pt.id, pt.anio, pt.semestre, d.id, d.nombre, d.tipo;

COMMENT ON VIEW v_indicadores_cumplimiento IS 'Indicadores de cumplimiento por plan de trabajo (RF14, RF15, RF16, RF17)';

-- ============================================================
-- DATOS SEMILLA (seeds) — datos iniciales para pruebas
-- ============================================================

-- Usuario administrador inicial (password: admin123 — cambiar en producción)
INSERT INTO usuarios (nombre, apellidos, email, password_hash, rol) VALUES
('Admin', 'Sistema', 'admin@fiei.unap.edu.pe',
 '$2b$12$placeholder_hash_cambiar_en_produccion', 'admin'),
('Oficina', 'Acreditación', 'acreditacion@fiei.unap.edu.pe',
 '$2b$12$placeholder_hash_cambiar_en_produccion', 'acreditacion');

-- Direcciones y oficinas de ejemplo (ajustar según estructura real de la FIEI)
INSERT INTO direcciones (nombre, codigo, tipo) VALUES
('Decanato',                                'DEC',      'decanato'),
('Dirección de Escuela Profesional',        'DIR-EP',   'direccion'),
('Oficina de Acreditación',                 'OFI-ACR',  'oficina'),
('Oficina de Investigación',                'OFI-INV',  'oficina'),
('Comisión Curricular',                     'COM-CURR', 'comision'),
('Comisión de Responsabilidad Social',      'COM-RS',   'comision');