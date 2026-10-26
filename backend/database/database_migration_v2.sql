-- =====================================================
-- MIGRACIÓN DE BASE DE DATOS V2.0
-- Sistema de Gestión de Documentos
-- Fecha: 2025-12-17
-- =====================================================

-- Esta migración agrega:
-- 1. Tabla Areas (Departamentos/Áreas organizacionales)
-- 2. Campo areaId en Users (Relación Usuario -> Área)
-- 3. Campo destinatarioId en Documents (Relación por ID en lugar de solo texto)
-- 4. Índices optimizados para consultas frecuentes

-- =====================================================
-- 1. CREAR TABLA AREAS
-- =====================================================

CREATE TABLE IF NOT EXISTS "Areas" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(100) NOT NULL UNIQUE,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertar áreas predeterminadas
INSERT INTO "Areas" ("nombre", "descripcion", "activo") VALUES
    ('Administración', 'Área administrativa general', true),
    ('Recursos Humanos', 'Gestión de personal', true),
    ('Tecnología', 'Departamento de TI', true),
    ('Finanzas', 'Gestión financiera', true),
    ('Operaciones', 'Operaciones diarias', true),
    ('Externo', 'Usuarios externos', true)
ON CONFLICT ("nombre") DO NOTHING;

-- =====================================================
-- 2. AGREGAR CAMPO areaId A USERS
-- =====================================================

-- Agregar columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Users' AND column_name = 'areaId'
    ) THEN
        ALTER TABLE "Users" ADD COLUMN "areaId" INTEGER;
        ALTER TABLE "Users" ADD CONSTRAINT "Users_areaId_fkey" 
            FOREIGN KEY ("areaId") REFERENCES "Areas"("id") 
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Asignar áreas por defecto según el rol
UPDATE "Users" SET "areaId" = (SELECT id FROM "Areas" WHERE nombre = 'Administración') WHERE rol = 'admin' AND "areaId" IS NULL;
UPDATE "Users" SET "areaId" = (SELECT id FROM "Areas" WHERE nombre = 'Externo') WHERE rol = 'externo' AND "areaId" IS NULL;
UPDATE "Users" SET "areaId" = (SELECT id FROM "Areas" WHERE nombre = 'Operaciones') WHERE rol = 'interno' AND "areaId" IS NULL;

-- =====================================================
-- 3. AGREGAR CAMPO destinatarioId A DOCUMENTS
-- =====================================================

-- Agregar columna si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Documents' AND column_name = 'destinatarioId'
    ) THEN
        ALTER TABLE "Documents" ADD COLUMN "destinatarioId" INTEGER;
        ALTER TABLE "Documents" ADD CONSTRAINT "Documents_destinatarioId_fkey" 
            FOREIGN KEY ("destinatarioId") REFERENCES "Users"("id") 
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END $$;

-- Intentar poblar destinatarioId basándose en el campo destinatario (texto)
-- Esto es un "best effort" - solo funcionará si el nombre coincide exactamente
UPDATE "Documents" d
SET "destinatarioId" = u.id
FROM "Users" u
WHERE d."destinatarioId" IS NULL 
  AND (d."destinatario" = u."nombre" OR d."destinatario" = u."username");

-- =====================================================
-- 4. CREAR ÍNDICES OPTIMIZADOS
-- =====================================================

-- Índices para Users
CREATE INDEX IF NOT EXISTS "idx_users_areaId" ON "Users"("areaId");
CREATE INDEX IF NOT EXISTS "idx_users_rol_activo" ON "Users"("rol", "activo");

-- Índices para Documents
CREATE INDEX IF NOT EXISTS "idx_documents_destinatarioId" ON "Documents"("destinatarioId");
CREATE INDEX IF NOT EXISTS "idx_documents_userId_estado" ON "Documents"("userId", "estado");
CREATE INDEX IF NOT EXISTS "idx_documents_fechaRegistro_desc" ON "Documents"("fechaRegistro" DESC);
CREATE INDEX IF NOT EXISTS "idx_documents_clasificacion_estado" ON "Documents"("clasificacion", "estado");

-- Índices para DocumentHistory
CREATE INDEX IF NOT EXISTS "idx_documenthistory_documentId_createdAt" ON "DocumentHistories"("documentId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_documenthistory_userId" ON "DocumentHistories"("userId");

-- Índices para Notifications
CREATE INDEX IF NOT EXISTS "idx_notifications_userId_leido" ON "Notifications"("userId", "leido");
CREATE INDEX IF NOT EXISTS "idx_notifications_createdAt_desc" ON "Notifications"("createdAt" DESC);

-- =====================================================
-- 5. COMENTARIOS EN TABLAS Y COLUMNAS
-- =====================================================

COMMENT ON TABLE "Areas" IS 'Áreas o departamentos organizacionales';
COMMENT ON COLUMN "Users"."areaId" IS 'Área/Departamento al que pertenece el usuario';
COMMENT ON COLUMN "Documents"."destinatarioId" IS 'ID del usuario destinatario (integridad referencial)';
COMMENT ON COLUMN "Documents"."destinatario" IS 'Nombre del destinatario (legacy, usar destinatarioId)';

-- =====================================================
-- 6. VERIFICACIÓN DE INTEGRIDAD
-- =====================================================

-- Verificar que no haya documentos huérfanos
SELECT COUNT(*) as documentos_sin_creador 
FROM "Documents" d 
LEFT JOIN "Users" u ON d."userId" = u.id 
WHERE u.id IS NULL;

-- Verificar usuarios sin área
SELECT COUNT(*) as usuarios_sin_area 
FROM "Users" 
WHERE "areaId" IS NULL;

-- =====================================================
-- MIGRACIÓN COMPLETADA
-- =====================================================

-- Para verificar el estado de la base de datos:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name, ordinal_position;
