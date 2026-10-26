-- ============================================================
--  SISTEMA DE GESTIÓN DE DOCUMENTOS - FACULTAD INTEGRAL DE ICHILO
--  SCHEMA v3 - PostgreSQL
--  Incluye: UUIDs, catálogos, soft delete, índices, constraints
--  PKs personalizadas por tabla
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- LIMPIAR TABLAS EXISTENTES (si aplica)
-- ============================================================
DROP TABLE IF EXISTS verification_tokens   CASCADE;
DROP TABLE IF EXISTS notifications         CASCADE;
DROP TABLE IF EXISTS document_histories    CASCADE;
DROP TABLE IF EXISTS document_attachments  CASCADE;
DROP TABLE IF EXISTS document_recipients   CASCADE;
DROP TABLE IF EXISTS documents             CASCADE;
DROP TABLE IF EXISTS users                 CASCADE;
DROP TABLE IF EXISTS movement_types        CASCADE;
DROP TABLE IF EXISTS document_priorities   CASCADE;
DROP TABLE IF EXISTS document_statuses     CASCADE;
DROP TABLE IF EXISTS document_types        CASCADE;
DROP TABLE IF EXISTS departments           CASCADE;
DROP TABLE IF EXISTS roles                 CASCADE;
-- Tablas antiguas
DROP TABLE IF EXISTS "DocumentHistories"   CASCADE;
DROP TABLE IF EXISTS "Documents"           CASCADE;
DROP TABLE IF EXISTS "Users"               CASCADE;
DROP TABLE IF EXISTS "VerificationTokens"  CASCADE;
DROP TABLE IF EXISTS "Areas"               CASCADE;
DROP VIEW  IF EXISTS active_users;
DROP VIEW  IF EXISTS active_documents;

-- ============================================================
-- TABLAS DE CATÁLOGO
-- ============================================================

CREATE TABLE roles (
  id_rol      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id_departamento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(100) NOT NULL UNIQUE,
  descripcion     TEXT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE document_types (
  id_tipo_documento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            VARCHAR(100) NOT NULL UNIQUE,
  descripcion       TEXT
);

CREATE TABLE document_statuses (
  id_estado_documento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre              VARCHAR(100) NOT NULL UNIQUE,
  color               VARCHAR(20)
);

CREATE TABLE document_priorities (
  id_prioridad UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       VARCHAR(100) NOT NULL UNIQUE,
  orden        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE movement_types (
  id_tipo_movimiento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre             VARCHAR(100) NOT NULL UNIQUE,
  descripcion        TEXT
);

-- ============================================================
-- DATOS INICIALES DE CATÁLOGOS
-- ============================================================

INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',    'Administrador del sistema con acceso completo'),
  ('interno',  'Usuario interno de la facultad'),
  ('externo',  'Usuario externo con permisos limitados');

INSERT INTO departments (nombre, descripcion) VALUES
  ('Decanato',                    'Decanato de la Facultad Integral de Ichilo'),
  ('Secretaría General',          'Área de secretaría general'),
  ('Dirección Académica',         'Dirección de asuntos académicos'),
  ('Administración y Finanzas',   'Área administrativa y financiera'),
  ('Sistemas e Informática',      'Área de sistemas e informática');

INSERT INTO document_types (nombre, descripcion) VALUES
  ('Memorándum',    'Comunicación interna oficial'),
  ('Oficio',        'Comunicación formal hacia otras instituciones'),
  ('Informe',       'Informe de actividades o resultados'),
  ('Solicitud',     'Solicitud de cualquier tipo'),
  ('Resolución',    'Resolución administrativa o académica'),
  ('Circular',      'Comunicación masiva a varios destinatarios'),
  ('Certificado',   'Documento de certificación'),
  ('Contrato',      'Contrato o convenio'),
  ('Otro',          'Otro tipo de documento');

INSERT INTO document_statuses (nombre, color) VALUES
  ('pendiente',   '#F59E0B'),
  ('proceso',     '#3B82F6'),
  ('finalizado',  '#10B981'),
  ('rechazado',   '#EF4444'),
  ('archivado',   '#6B7280');

INSERT INTO document_priorities (nombre, orden) VALUES
  ('baja',    1),
  ('media',   2),
  ('alta',    3),
  ('urgente', 4);

INSERT INTO movement_types (nombre, descripcion) VALUES
  ('enviado',   'Documento enviado desde esta oficina'),
  ('recibido',  'Documento recibido en esta oficina');

-- ============================================================
-- USUARIOS
-- ============================================================

CREATE TABLE users (
  id_usuario      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        VARCHAR(100) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  id_rol          UUID REFERENCES roles(id_rol) ON DELETE SET NULL,
  id_departamento UUID REFERENCES departments(id_departamento) ON DELETE SET NULL,
  nombre          VARCHAR(200),
  cargo           VARCHAR(100),
  telefono        VARCHAR(30),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso   TIMESTAMP,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMP DEFAULT NULL
);

-- Validación de email
ALTER TABLE users ADD CONSTRAINT chk_users_email
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Usuario administrador inicial
INSERT INTO users (username, email, password_hash, id_rol, nombre, cargo, is_verified)
VALUES (
  'admin',
  'admin@fini.uagrm.edu.bo',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  (SELECT id_rol FROM roles WHERE nombre = 'admin'),
  'Administrador del Sistema',
  'Administrador',
  TRUE
);

-- ============================================================
-- DOCUMENTOS
-- ============================================================

CREATE TABLE documents (
  id_documento        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo              VARCHAR(100) NOT NULL UNIQUE,
  id_tipo_movimiento  UUID REFERENCES movement_types(id_tipo_movimiento) ON DELETE SET NULL,
  id_tipo_documento   UUID REFERENCES document_types(id_tipo_documento) ON DELETE SET NULL,
  id_estado_documento UUID REFERENCES document_statuses(id_estado_documento) ON DELETE SET NULL,
  id_prioridad        UUID REFERENCES document_priorities(id_prioridad) ON DELETE SET NULL,
  clasificacion       VARCHAR(20) NOT NULL DEFAULT 'interno' CHECK (clasificacion IN ('interno', 'externo')),
  fecha_registro      DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_envio         DATE,
  fecha_vencimiento   DATE,
  remitente           VARCHAR(200) NOT NULL,
  destinatario        VARCHAR(200),
  cargo               VARCHAR(100),
  quien_recibe        VARCHAR(200),
  detalle             TEXT NOT NULL,
  observaciones       TEXT,
  created_by          UUID REFERENCES users(id_usuario) ON DELETE SET NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMP DEFAULT NULL
);

-- Validación de fechas
ALTER TABLE documents ADD CONSTRAINT chk_documents_fechas
  CHECK (fecha_envio IS NULL OR fecha_envio >= fecha_registro);

-- ============================================================
-- DESTINATARIOS DE DOCUMENTOS (múltiples por documento)
-- ============================================================

CREATE TABLE document_recipients (
  id_destinatario           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_documento              UUID NOT NULL REFERENCES documents(id_documento) ON DELETE CASCADE,
  id_usuario                UUID NOT NULL REFERENCES users(id_usuario) ON DELETE CASCADE,
  es_principal              BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_recepcion           TIMESTAMP,
  leido                     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (id_documento, id_usuario)
);

-- ============================================================
-- ARCHIVOS ADJUNTOS
-- ============================================================

CREATE TABLE document_attachments (
  id_adjunto       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_documento     UUID NOT NULL REFERENCES documents(id_documento) ON DELETE CASCADE,
  nombre_archivo   VARCHAR(255) NOT NULL,
  archivo_path     VARCHAR(500) NOT NULL,
  archivo_original VARCHAR(255),
  archivo_tamano   BIGINT CHECK (archivo_tamano > 0),
  archivo_tipo     VARCHAR(100),
  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HISTORIAL DE DOCUMENTOS (auditoría)
-- ============================================================

CREATE TABLE document_histories (
  id_historial       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_documento       UUID NOT NULL REFERENCES documents(id_documento) ON DELETE CASCADE,
  id_usuario         UUID REFERENCES users(id_usuario) ON DELETE SET NULL,
  accion             VARCHAR(100) NOT NULL,
  campos_modificados JSONB,
  valores_anteriores JSONB,
  valores_nuevos     JSONB,
  descripcion        TEXT,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

CREATE TABLE notifications (
  id_notificacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario      UUID NOT NULL REFERENCES users(id_usuario) ON DELETE CASCADE,
  id_documento    UUID REFERENCES documents(id_documento) ON DELETE SET NULL,
  tipo            VARCHAR(100) NOT NULL,
  titulo          VARCHAR(255) NOT NULL,
  mensaje         TEXT,
  leido           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TOKENS DE VERIFICACIÓN
-- ============================================================

CREATE TABLE verification_tokens (
  id_token   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID NOT NULL REFERENCES users(id_usuario) ON DELETE CASCADE,
  token      VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES OPTIMIZADOS
-- ============================================================

-- Users
CREATE INDEX idx_users_email          ON users(email)           WHERE deleted_at IS NULL;
CREATE INDEX idx_users_id_rol         ON users(id_rol)          WHERE deleted_at IS NULL;
CREATE INDEX idx_users_id_departamento ON users(id_departamento) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_activo         ON users(activo)          WHERE deleted_at IS NULL;

-- Documents
CREATE INDEX idx_documents_codigo        ON documents(codigo)             WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_estado        ON documents(id_estado_documento) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_prioridad     ON documents(id_prioridad)        WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_created_by    ON documents(created_by)          WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_vencimiento   ON documents(fecha_vencimiento)   WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_created_at    ON documents(created_at)          WHERE deleted_at IS NULL;

-- Historial
CREATE INDEX idx_doc_histories_documento ON document_histories(id_documento);
CREATE INDEX idx_doc_histories_usuario   ON document_histories(id_usuario);
CREATE INDEX idx_doc_histories_accion    ON document_histories(accion);

-- Notificaciones
CREATE INDEX idx_notifications_usuario   ON notifications(id_usuario)   WHERE leido = FALSE;
CREATE INDEX idx_notifications_documento ON notifications(id_documento);

-- Destinatarios
CREATE INDEX idx_recipients_documento ON document_recipients(id_documento);
CREATE INDEX idx_recipients_usuario   ON document_recipients(id_usuario) WHERE leido = FALSE;

-- Adjuntos
CREATE INDEX idx_attachments_documento ON document_attachments(id_documento);

-- Tokens
CREATE INDEX idx_tokens_usuario  ON verification_tokens(id_usuario);
CREATE INDEX idx_tokens_expires  ON verification_tokens(expires_at);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VISTAS (excluyen soft delete)
-- ============================================================

CREATE VIEW active_users AS
  SELECT u.*, r.nombre AS nombre_rol, d.nombre AS nombre_departamento
  FROM users u
  LEFT JOIN roles r ON u.id_rol = r.id_rol
  LEFT JOIN departments d ON u.id_departamento = d.id_departamento
  WHERE u.deleted_at IS NULL;

CREATE VIEW active_documents AS
  SELECT doc.*,
         es.nombre AS nombre_estado,
         es.color  AS color_estado,
         pr.nombre AS nombre_prioridad,
         td.nombre AS tipo_documento_nombre,
         tm.nombre AS tipo_movimiento_nombre,
         u.username AS creado_por_username,
         u.nombre   AS creado_por_nombre
  FROM documents doc
  LEFT JOIN document_statuses   es ON doc.id_estado_documento = es.id_estado_documento
  LEFT JOIN document_priorities pr ON doc.id_prioridad = pr.id_prioridad
  LEFT JOIN document_types      td ON doc.id_tipo_documento = td.id_tipo_documento
  LEFT JOIN movement_types      tm ON doc.id_tipo_movimiento = tm.id_tipo_movimiento
  LEFT JOIN users               u  ON doc.created_by = u.id_usuario
  WHERE doc.deleted_at IS NULL;

-- ============================================================
-- FIN DEL SCRIPT
-- INSTRUCCIONES:
-- 1. Abrir pgAdmin 4
-- 2. Conectarse a la base de datos "sistema_documentos"
-- 3. Abrir Query Tool
-- 4. Pegar y ejecutar este script completo
-- ============================================================
