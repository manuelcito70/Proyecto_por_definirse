-- =====================================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- Elimina tablas y campos NO USADOS
-- Fecha: 2025-12-17
-- =====================================================

-- IMPORTANTE: Ejecutar ANTES de reiniciar el servidor
-- Este script elimina las tablas y campos que NO se usan en el frontend

-- =====================================================
-- 1. ELIMINAR TABLAS NO USADAS
-- =====================================================

-- Eliminar tabla Notifications (no se usa en el frontend)
DROP TABLE IF EXISTS "Notifications" CASCADE;

-- Eliminar tabla Categories (no se usa en el frontend)
DROP TABLE IF EXISTS "Categories" CASCADE;

-- =====================================================
-- 2. ELIMINAR CAMPOS NO USADOS DE DOCUMENTS
-- =====================================================

-- Eliminar campo prioridad (no se usa en el frontend)
ALTER TABLE "Documents" DROP COLUMN IF EXISTS "prioridad";

-- Eliminar campo fechaVencimiento (no se usa en el frontend)
ALTER TABLE "Documents" DROP COLUMN IF EXISTS "fechaVencimiento";

-- =====================================================
-- 3. ELIMINAR ÍNDICES OBSOLETOS
-- =====================================================

DROP INDEX IF EXISTS "idx_documents_prioridad";
DROP INDEX IF EXISTS "idx_documents_fechaVencimiento";
DROP INDEX IF EXISTS "idx_notifications_userId_leido";
DROP INDEX IF EXISTS "idx_notifications_createdAt_desc";

-- =====================================================
-- 4. VERIFICACIÓN
-- =====================================================

-- Ver todas las tablas restantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver columnas de Documents
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Documents'
ORDER BY ordinal_position;

-- =====================================================
-- LIMPIEZA COMPLETADA
-- =====================================================

-- Tablas finales que deben existir:
-- 1. Users
-- 2. Areas
-- 3. Documents
-- 4. DocumentHistories
-- 5. VerificationTokens
