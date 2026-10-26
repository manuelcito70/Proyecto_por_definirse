-- ========================================
-- Script para crear la base de datos
-- Sistema de Gestión de Documentos
-- ========================================

-- Crear la base de datos
CREATE DATABASE sistema_documentos
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Bolivia.1252'
    LC_CTYPE = 'Spanish_Bolivia.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Agregar comentario descriptivo
COMMENT ON DATABASE sistema_documentos
    IS 'Base de datos para el sistema de gestión de documentos universitarios';

-- ========================================
-- NOTA: Ejecuta este script en pgAdmin
-- ========================================
-- 1. Abre pgAdmin 4
-- 2. Click derecho en "postgres" → Query Tool
-- 3. Copia y pega este código
-- 4. Presiona F5 o click en ▶️ Execute
-- ========================================
