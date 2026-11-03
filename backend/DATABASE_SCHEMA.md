# 🏛️ SIGAD - Arquitectura y Esquema de Base de Datos V4
**Sistema de Gestión de Archivos y Documentación**  
*Dirección de Carrera - Facultad Integral del Norte (FINI) · UAGRM*

---

## 1. Diagrama de Base de Datos (DBML)

```dbml
// =====================================================
// SIGAD V4 - DIAGRAMA COMPLETO DE BASE DE DATOS
// =====================================================

Table carreras {
  id_carrera uuid [pk]
  nombre varchar(150) [unique, not null]
  activo boolean [default: true, not null]
  created_at timestamp
  updated_at timestamp
}

Table roles {
  id_rol uuid [pk]
  nombre varchar(50) [unique, not null]
  cargo varchar(100)
  descripcion text
  created_at timestamp
  updated_at timestamp
}

Table users {
  id_usuario uuid [pk]
  email varchar(255) [unique, not null]
  password_hash varchar(255) [not null]
  nombre varchar(200) [not null]
  id_rol uuid [not null]
  id_carrera uuid [not null]
  activo boolean [default: true, not null]
  ultimo_acceso timestamp
  created_at timestamp
  updated_at timestamp
}

Table gestiones {
  id_gestion uuid [pk]
  anio integer [unique, not null]
  created_at timestamp
  updated_at timestamp
}

Table materias {
  id_materia uuid [pk]
  id_carrera uuid [not null]
  codigo varchar(20) [not null]
  nombre varchar(200) [not null]
  semestre integer [not null]
  activo boolean [default: true, not null]
  created_at timestamp
  updated_at timestamp
}

Table docentes {
  id_docente uuid [pk]
  nombre varchar(200) [not null]
  ci varchar(30)
  id_carrera uuid [not null]
  id_gestion_ingreso uuid [not null]
  activo boolean [default: true, not null]
  created_at timestamp
  updated_at timestamp
}

Table docente_materias {
  id_docente_materia uuid [pk]
  id_docente uuid [not null]
  id_materia uuid [not null]
  created_at timestamp
  updated_at timestamp
}

Table fases_proceso {
  id_fase uuid [pk]
  orden integer [unique, not null]
  nombre varchar(100) [not null]
  created_at timestamp
  updated_at timestamp
}

Table convocatorias {
  id_convocatoria uuid [pk]
  nro_convocatoria varchar(50) [not null]
  id_carrera uuid [not null]
  id_gestion uuid [not null]
  semestre smallint [not null] // 1 o 2
  observaciones text
  created_at timestamp
  updated_at timestamp
}

Table convocatoria_fases {
  id_convocatoria_fase uuid [pk]
  id_convocatoria uuid [not null]
  id_fase uuid [not null]
  id_documento uuid
  fecha_fase date [not null]
  completada boolean [default: false, not null]
  observaciones text
  created_at timestamp
  updated_at timestamp
}

Table auxiliares {
  id_auxiliar uuid [pk]
  nombre varchar(200) [not null]
  nro_registro varchar(30)
  id_materia uuid [not null]
  id_convocatoria uuid [not null]
  nota_examen decimal(5,2)
  estado varchar(20) [default: 'aprobado', not null]
  es_ratificacion boolean [default: false, not null]
  created_at timestamp
  updated_at timestamp
}

Table document_types {
  id_tipo_documento uuid [pk]
  nombre varchar(100) [unique, not null]
  descripcion text
  created_at timestamp
  updated_at timestamp
}

Table documents {
  id_documento uuid [pk]
  id_carrera uuid [not null]
  id_tipo_documento uuid [not null]
  id_gestion uuid [not null]
  nro_documento varchar(50) [not null]
  correlativo integer
  fecha_documento date [not null]
  destinatario varchar(255)
  remitente varchar(255)
  asunto varchar(500) [not null]
  descripcion text
  estado varchar(30) [default: 'completado', not null]
  tipo_respuesta varchar(30)
  requiere_respuesta boolean [default: false, not null]
  id_docente uuid
  id_auxiliar uuid
  semestre smallint
  created_by uuid
  created_at timestamp
  updated_at timestamp
}

Table actas_detalles {
  id_acta_detalle uuid [pk]
  id_documento uuid [unique, not null]
  codigo_cpd varchar(50)
  nro_registro varchar(30)
  nombre_estudiante varchar(200) [not null]
  ci varchar(30)
  modalidad varchar(50) [not null]
  nota decimal(5,2) [not null]
  created_at timestamp
  updated_at timestamp
}

Table document_attachments {
  id_adjunto uuid [pk]
  id_documento uuid [not null]
  archivo_path text [not null]
  nombre_original varchar(255) [not null]
  mime_type varchar(100)
  size_bytes bigint
  created_at timestamp
  updated_at timestamp
}

// -----------------------------------------------------
// RELACIONES (FK)
// -----------------------------------------------------
Ref: users.id_rol > roles.id_rol
Ref: users.id_carrera > carreras.id_carrera
Ref: materias.id_carrera > carreras.id_carrera
Ref: docentes.id_carrera > carreras.id_carrera
Ref: docentes.id_gestion_ingreso > gestiones.id_gestion
Ref: docente_materias.id_docente > docentes.id_docente
Ref: docente_materias.id_materia > materias.id_materia
Ref: convocatorias.id_carrera > carreras.id_carrera
Ref: convocatorias.id_gestion > gestiones.id_gestion
Ref: convocatoria_fases.id_convocatoria > convocatorias.id_convocatoria
Ref: convocatoria_fases.id_fase > fases_proceso.id_fase
Ref: convocatoria_fases.id_documento > documents.id_documento
Ref: auxiliares.id_materia > materias.id_materia
Ref: auxiliares.id_convocatoria > convocatorias.id_convocatoria
Ref: documents.id_carrera > carreras.id_carrera
Ref: documents.id_tipo_documento > document_types.id_tipo_documento
Ref: documents.id_gestion > gestiones.id_gestion
Ref: documents.id_docente > docentes.id_docente
Ref: documents.id_auxiliar > auxiliares.id_auxiliar
Ref: documents.created_by > users.id_usuario
Ref: actas_detalles.id_documento - documents.id_documento
Ref: document_attachments.id_documento > documents.id_documento
```

---

## 2. Diccionario de Datos y Tablas

### 1. `carreras`
Define las unidades académicas que utilizan el sistema (soporte multi-carrera).
* **`id_carrera`** (`UUID`, PK): Identificador universal único.
* **`nombre`** (`VARCHAR(150)`, UNIQUE): Nombre oficial (ej. `'Ingeniería de Sistemas'`).
* **`activo`** (`BOOLEAN`): Estado de la carrera.

### 2. `roles`
Catálogo de perfiles para control de acceso basado en roles (RBAC).
* **`id_rol`** (`UUID`, PK).
* **`nombre`** (`VARCHAR(50)`, UNIQUE): Código del rol (`'superadmin'`, `'director'`, `'admin'`, `'secretaria'`, `'docente'`, `'auxiliar'`).
* **`cargo`** (`VARCHAR(100)`): Nombre descriptivo para membretes y vistas.
* **`descripcion`** (`TEXT`): Alcance de permisos.

### 3. `users`
Cuentas de usuario institucionales.
* **`id_usuario`** (`UUID`, PK).
* **`email`** (`VARCHAR(255)`, UNIQUE): Correo institucional (clave de login).
* **`password_hash`** (`VARCHAR(255)`): Contraseña cifrada con algoritmo bcrypt (`salt: 10`).
* **`nombre`** (`VARCHAR(200)`): Nombre y apellidos completos.
* **`id_rol`** (`UUID`, FK → `roles.id_rol`).
* **`id_carrera`** (`UUID`, FK → `carreras.id_carrera`).
* **`activo`** (`BOOLEAN`): Bloqueo administrativo de acceso.
* **`ultimo_acceso`** (`TIMESTAMP`): Registro de última sesión iniciada.

### 4. `gestiones`
Años académicos para consolidar y filtrar documentos y procesos.
* **`id_gestion`** (`UUID`, PK).
* **`anio`** (`INTEGER`, UNIQUE): Año calendario (ej. `2026`).

### 5. `materias`
Malla curricular de la carrera.
* **`id_materia`** (`UUID`, PK).
* **`id_carrera`** (`UUID`, FK → `carreras.id_carrera`).
* **`codigo`** (`VARCHAR(20)`): Sigla de materia (ej. `'SIS-102'`, `'MAT-101'`).
* **`nombre`** (`VARCHAR(200)`): Nombre de la materia (ej. `'Programación I'`).
* **`semestre`** (`INTEGER`): Nivel semestral de la materia en el plan (1 al 10).
* **`activo`** (`BOOLEAN`): Disponibilidad para asignación.

### 6. `docentes`
Padrón de docentes vinculados a la dirección de carrera.
* **`id_docente`** (`UUID`, PK).
* **`nombre`** (`VARCHAR(200)`): Nombre completo y grado (ej. `'Ing. Alicia Serrano Rodríguez'`).
* **`ci`** (`VARCHAR(30)`): Cédula de identidad.
* **`id_carrera`** (`UUID`, FK → `carreras.id_carrera`).
* **`id_gestion_ingreso`** (`UUID`, FK → `gestiones.id_gestion`): Año de ingreso.
* **`activo`** (`BOOLEAN`).

### 7. `docente_materias` (Intermedia N:M)
Asignación de una o múltiples materias a un docente.
* **`id_docente_materia`** (`UUID`, PK).
* **`id_docente`** (`UUID`, FK → `docentes.id_docente`).
* **`id_materia`** (`UUID`, FK → `materias.id_materia`).

### 8. `fases_proceso`
Etapas reglamentarias para la designación de auxiliares.
* **`id_fase`** (`UUID`, PK).
* **`orden`** (`INTEGER`, UNIQUE): Secuencia (1 = Propuesta de materia, 2 = Consejo facultativo, 3 = Convocatoria, 4 = Evaluación y selección).
* **`nombre`** (`VARCHAR(100)`).

### 9. `convocatorias`
Convocatorias semestrales a concurso de méritos y exámenes.
* **`id_convocatoria`** (`UUID`, PK).
* **`nro_convocatoria`** (`VARCHAR(50)`): Código de referencia (ej. `'CONV-01/2026'`).
* **`id_carrera`** (`UUID`, FK → `carreras.id_carrera`).
* **`id_gestion`** (`UUID`, FK → `gestiones.id_gestion`).
* **`semestre`** (`SMALLINT`): Semestre académico (1 o 2).
* **`observaciones`** (`TEXT`).

### 10. `convocatoria_fases`
Seguimiento e hitos documentados de cada convocatoria.
* **`id_convocatoria_fase`** (`UUID`, PK).
* **`id_convocatoria`** (`UUID`, FK → `convocatorias.id_convocatoria`).
* **`id_fase`** (`UUID`, FK → `fases_proceso.id_fase`).
* **`id_documento`** (`UUID`, FK → `documents.id_documento`, Nullable): Oficio o resolución probatoria.
* **`fecha_fase`** (`DATE`): Fecha del hito.
* **`completada`** (`BOOLEAN`).

### 11. `auxiliares`
Auxiliares de docencia evaluados y designados.
* **`id_auxiliar`** (`UUID`, PK).
* **`nombre`** (`VARCHAR(200)`): Nombre completo del auxiliar.
* **`nro_registro`** (`VARCHAR(30)`): Registro universitario del estudiante.
* **`id_materia`** (`UUID`, FK → `materias.id_materia`).
* **`id_convocatoria`** (`UUID`, FK → `convocatorias.id_convocatoria`).
* **`nota_examen`** (`DECIMAL(5,2)`): Calificación obtenida.
* **`estado`** (`VARCHAR(20)`): `'aprobado'`, `'pendiente'`, `'reprobado'`.
* **`es_ratificacion`** (`BOOLEAN`): Indicador de continuidad semestral sin nuevo examen.

### 12. `document_types`
Catálogo unificado de tipos documentales:
* `'Oficio expedido'`
* `'Oficio recibido'`
* `'Acta de graduación'`
* `'Curriculum Vitae'`
* `'Programa Analítico'`
* `'Informe Final'`
* `'Lista de Asistencia'`
* `'Informe de Cátedra'`
* `'Otro'`

### 13. `documents`
Tabla madre unificada de toda la documentación institucional.
* **`id_documento`** (`UUID`, PK).
* **`id_carrera`** (`UUID`, FK → `carreras.id_carrera`).
* **`id_tipo_documento`** (`UUID`, FK → `document_types.id_tipo_documento`).
* **`id_gestion`** (`UUID`, FK → `gestiones.id_gestion`).
* **`nro_documento`** (`VARCHAR(50)`): Número o código oficial del documento.
* **`correlativo`** (`INTEGER`): Secuencia numérica consecutiva por gestión.
* **`fecha_documento`** (`DATE`): Fecha oficial.
* **`destinatario`** (`VARCHAR(255)`): Destino (para expedidos).
* **`remitente`** (`VARCHAR(255)`): Origen (para recibidos).
* **`asunto`** (`VARCHAR(500)`): Resumen del documento.
* **`descripcion`** (`TEXT`): Detalle del contenido.
* **`estado`** (`VARCHAR(30)`): `'pendiente'`, `'en_curso'`, `'completado'`.
* **`tipo_respuesta`** (`VARCHAR(30)`): `'requiere_respuesta'`, `'para_conocimiento'`.
* **`requiere_respuesta`** (`BOOLEAN`).
* **`id_docente`** (`UUID`, FK → `docentes.id_docente`, Nullable): Expediente del docente.
* **`id_auxiliar`** (`UUID`, FK → `auxiliares.id_auxiliar`, Nullable): Expediente del auxiliar.
* **`semestre`** (`SMALLINT`, Nullable): Semestre del archivo (1 o 2).
* **`created_by`** (`UUID`, FK → `users.id_usuario`, Nullable).

### 14. `actas_detalles` (Extensión 1:1 con `documents`)
Metadatos académicos específicos de actas de graduación.
* **`id_acta_detalle`** (`UUID`, PK).
* **`id_documento`** (`UUID`, UNIQUE, FK → `documents.id_documento`).
* **`codigo_cpd`** (`VARCHAR(50)`): Código de Centro de Procesamiento de Datos.
* **`nro_registro`** (`VARCHAR(30)`): Registro universitario del postulante.
* **`nombre_estudiante`** (`VARCHAR(200)`): Nombre completo del graduado.
* **`ci`** (`VARCHAR(30)`): Cédula de identidad.
* **`modalidad`** (`VARCHAR(50)`): Modalidad de titulación.
* **`nota`** (`DECIMAL(5,2)`): Calificación numérica final (0 - 100).

### 15. `document_attachments`
Archivos físicos respaldados asociados a los documentos.
* **`id_adjunto`** (`UUID`, PK).
* **`id_documento`** (`UUID`, FK → `documents.id_documento`).
* **`archivo_path`** (`TEXT`): Ruta relativa o absoluta en el disco.
* **`nombre_original`** (`VARCHAR(255)`): Nombre original del archivo subido.
* **`mime_type`** (`VARCHAR(100)`): Tipo MIME (ej. `'application/pdf'`).
* **`size_bytes`** (`BIGINT`): Tamaño del archivo.

---

## 3. Enumeraciones y Valores Permitidos

| Campo | Tabla | Valores Válidos |
|---|---|---|
| `estado` | `documents` | `'pendiente'`, `'en_curso'`, `'completado'` |
| `tipo_respuesta` | `documents` | `'requiere_respuesta'`, `'para_conocimiento'`, `NULL` |
| `modalidad` | `actas_detalles` | `'tesis'`, `'proyecto_grado'`, `'examen_grado'`, `'trabajo_dirigido'`, `'excelencia'`, `'titulacion_continua'` |
| `estado` | `auxiliares` | `'aprobado'`, `'pendiente'`, `'reprobado'` |
| `semestre` | `convocatorias`, `documents` | `1`, `2` |
| `nombre` | `roles` | `'superadmin'`, `'director'`, `'admin'`, `'secretaria'`, `'docente'`, `'auxiliar'` |

---

## 4. Notas de Arquitectura y Decisiones de Diseño

### 1. Multi-Tenancy mediante `id_carrera`
El sistema almacena `id_carrera` en `documents`, `docentes`, `convocatorias`, `materias` y `users`.
* **Beneficio:** Permite que una sola instancia de SIGAD atienda a varias carreras de la FINI (Sistemas, Redes, etc.) o bien que funcione como instalación independiente por carrera sin requerir cambios estructurales de esquema.
* La carrera por defecto en esta versión es `'Ingeniería de Sistemas'`.

### 2. Por qué `actas_detalles` es 1:1 con `documents`
El auxiliar Luis López especificó que un acta de grado es un documento oficial con archivo escaneado, pero requiere campos de búsqueda específicos (`nro_registro`, `codigo_cpd`, `modalidad`, `nota`, `nombre_estudiante`).
* Crear columnas específicas de actas directamente en `documents` contaminaría los oficios salientes y recibidos con campos nulos irrelevantes.
* La tabla `actas_detalles` vinculada 1:1 mediante `id_documento` resuelve la especialización limpia: todo documento vive en `documents` con su adjunto en `document_attachments`, y si es un acta, sus metadatos académicos se registran en `actas_detalles`.

### 3. Agrupación de Convocatorias y Fases
Una convocatoria agrupa a los auxiliares por `id_carrera`, `id_gestion` y `semestre`. A su vez, el proceso reglamentario institucional se divide en 4 fases (`Propuesta de materia` → `Consejo facultativo` → `Convocatoria` → `Evaluación y selección`). La tabla `convocatoria_fases` permite registrar cada hito con su fecha de cumplimiento y el documento de respaldo emitido.

### 4. Relación Muchos a Muchos Docente–Materia (`docente_materias`)
Anteriormente se guardaba una sola materia en texto libre (`materia_principal`). Con la tabla normalizada `docente_materias` un docente puede impartir múltiples materias curriculares, manteniendo retrocompatibilidad mediante la capa de controladores (`formatDocente`) para las vistas previas del frontend.

### 5. Control de Concurrencia en Numeración
Para los oficios expedidos, la generación de correlativos se ejecuta mediante transacciones `SELECT MAX(correlativo) ... FOR UPDATE` aisladas por año y carrera, garantizando numeración secuencial estricta sin saltos ni duplicaciones bajo peticiones concurrentes.
