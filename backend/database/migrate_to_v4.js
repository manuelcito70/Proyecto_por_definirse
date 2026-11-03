/**
 * Script de Migración Idempotente a la Base de Datos V4 (SIGAD - FINI UAGRM)
 * Ejecutar: node backend/database/migrate_to_v4.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../src/config/database');
const {
  Carrera,
  Rol,
  Usuario,
  Gestion,
  Materia,
  DocenteV4,
  DocenteMateria,
  FaseProceso,
  Convocatoria,
  ConvocatoriaFase,
  AuxiliarV4,
  DocumentType,
  Document,
  ActaDetalle,
  DocumentAttachment
} = require('../src/models');

const NOMBRE_CARRERA_DEFAULT = 'Ingeniería de Sistemas';

async function migrate() {
  console.log('=====================================================');
  console.log('🚀 INICIANDO MIGRACIÓN A MODELO V4 - SIGAD FINI');
  console.log('=====================================================\n');

  const t = await sequelize.transaction();

  try {
    // -----------------------------------------------------------------
    // 1. RESOLVER COLISIÓN CON TABLAS RESIDUALES ANTIGUAS
    // -----------------------------------------------------------------
    console.log('🔍 Paso 1: Verificando y respaldando tablas residuales antiguas...');
    const legacyOldTables = [
      'documents',
      'document_types',
      'document_attachments',
      'roles',
      'users',
      'departments',
      'document_histories',
      'document_priorities',
      'document_recipients',
      'document_statuses',
      'movement_types',
      'notifications',
      'verification_tokens'
    ];

    const [legacyRows] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_legacy_old_roles';`,
      { transaction: t }
    );

    if (!legacyRows || legacyRows.length === 0) {
      for (const tbl of legacyOldTables) {
        const [exists] = await sequelize.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tbl}';`,
          { transaction: t }
        );
        if (exists.length > 0) {
          const targetBackupName = `_legacy_old_${tbl}`;
          await sequelize.query(`DROP TABLE IF EXISTS "${targetBackupName}" CASCADE;`, { transaction: t });
          await sequelize.query(`ALTER TABLE "${tbl}" RENAME TO "${targetBackupName}";`, { transaction: t });
          console.log(`   📦 Tabla residual antigua '${tbl}' respaldada como '${targetBackupName}'`);
        }
      }
    } else {
      console.log('   ℹ️ Tablas residuales ya fueron respaldadas previamente.');
    }

    // -----------------------------------------------------------------
    // 2. CREACIÓN / SINCRONIZACIÓN DE TABLAS V4
    // -----------------------------------------------------------------
    console.log('\n🏗️ Paso 2: Creando estructura de tablas V4...');
    const v4Models = [
      Carrera,
      Rol,
      Usuario,
      Gestion,
      Materia,
      DocenteV4,
      DocenteMateria,
      FaseProceso,
      Convocatoria,
      ConvocatoriaFase,
      AuxiliarV4,
      DocumentType,
      Document,
      ActaDetalle,
      DocumentAttachment
    ];

    for (const model of v4Models) {
      await model.sync({ transaction: t });
    }
    console.log('   ✅ 15 tablas V4 verificadas y sincronizadas.');

    // -----------------------------------------------------------------
    // 3. SEMILLAS BASE (ROLES, FASES, TIPOS DE DOCUMENTO)
    // -----------------------------------------------------------------
    console.log('\n🌱 Paso 3: Insertando semillas fijas (Roles, Fases, Tipos)...');
    
    // Roles
    const [rolSuperadmin] = await Rol.findOrCreate({
      where: { nombre: 'superadmin' },
      defaults: {
        id_rol: uuidv4(),
        nombre: 'superadmin',
        cargo: 'Director de carrera',
        descripcion: 'Director de carrera con acceso total administrativo'
      },
      transaction: t
    });

    const [rolAdmin] = await Rol.findOrCreate({
      where: { nombre: 'admin' },
      defaults: {
        id_rol: uuidv4(),
        nombre: 'admin',
        cargo: 'Secretaria',
        descripcion: 'Secretaría de Dirección de Carrera'
      },
      transaction: t
    });

    const otherRoles = [
      { nombre: 'director', cargo: 'Directora', descripcion: 'Dirección de Carrera' },
      { nombre: 'secretaria', cargo: 'Secretaria', descripcion: 'Secretaría de Dirección' },
      { nombre: 'docente', cargo: 'Docente', descripcion: 'Docente de la Carrera' },
      { nombre: 'auxiliar', cargo: 'Auxiliar', descripcion: 'Auxiliar de Cátedra' }
    ];
    for (const r of otherRoles) {
      await Rol.findOrCreate({
        where: { nombre: r.nombre },
        defaults: { id_rol: uuidv4(), nombre: r.nombre, cargo: r.cargo, descripcion: r.descripcion },
        transaction: t
      });
    }

    // Fases del Proceso
    const fasesBase = [
      { orden: 1, nombre: 'Propuesta de materia' },
      { orden: 2, nombre: 'Consejo facultativo' },
      { orden: 3, nombre: 'Convocatoria' },
      { orden: 4, nombre: 'Evaluación y selección' }
    ];
    const faseMap = {};
    for (const f of fasesBase) {
      const [fase] = await FaseProceso.findOrCreate({
        where: { nombre: f.nombre },
        defaults: { id_fase: uuidv4(), nombre: f.nombre, orden: f.orden },
        transaction: t
      });
      faseMap[f.orden] = fase.id_fase;
    }

    // Tipos de Documento
    const docTypesBase = [
      { nombre: 'Oficio expedido', descripcion: 'Correspondencia oficial despachada por Dirección de Carrera' },
      { nombre: 'Oficio recibido', descripcion: 'Correspondencia entrante a Dirección de Carrera' },
      { nombre: 'Acta de graduación', descripcion: 'Acta formal de defensa de grado y titulación' },
      { nombre: 'Curriculum Vitae', descripcion: 'Expediente docente: Hoja de vida y respaldos' },
      { nombre: 'Programa Analítico', descripcion: 'Expediente docente: Plan de materia semestral' },
      { nombre: 'Informe Final', descripcion: 'Expediente docente: Informe final de notas y avance' },
      { nombre: 'Lista de Asistencia', descripcion: 'Expediente docente: Planillas de control y asistencia' },
      { nombre: 'Informe de Cátedra', descripcion: 'Expediente docente: Informe evaluativo de cátedra' },
      { nombre: 'Otro', descripcion: 'Expediente docente: Documentación complementaria' }
    ];
    const tipoDocMap = {};
    for (const dt of docTypesBase) {
      const [tipo] = await DocumentType.findOrCreate({
        where: { nombre: dt.nombre },
        defaults: { id_tipo_documento: uuidv4(), nombre: dt.nombre, descripcion: dt.descripcion },
        transaction: t
      });
      tipoDocMap[dt.nombre] = tipo.id_tipo_documento;
    }

    // Mapeo específico para tipos de DocenteArchivo antiguos
    const docenteArchivoTipoToNombre = {
      curriculum: 'Curriculum Vitae',
      programa_analitico: 'Programa Analítico',
      informe_final: 'Informe Final',
      lista_asistencia: 'Lista de Asistencia',
      informe_cathedra: 'Informe de Cátedra',
      informe_catedra: 'Informe de Cátedra',
      otro: 'Otro'
    };

    // -----------------------------------------------------------------
    // 4. CARRERA POR DEFECTO
    // -----------------------------------------------------------------
    console.log(`\n🏫 Paso 4: Registrando carrera por defecto: '${NOMBRE_CARRERA_DEFAULT}'...`);
    const [carreraDefault] = await Carrera.findOrCreate({
      where: { nombre: NOMBRE_CARRERA_DEFAULT },
      defaults: {
        id_carrera: uuidv4(),
        nombre: NOMBRE_CARRERA_DEFAULT,
        activo: true
      },
      transaction: t
    });

    // -----------------------------------------------------------------
    // 5. GESTIONES
    // -----------------------------------------------------------------
    console.log('\n📅 Paso 5: Migrando gestiones desde años distintos...');
    const [gestionesRaw] = await sequelize.query(`
      SELECT DISTINCT gestion FROM (
        SELECT gestion FROM "Expedidos" WHERE gestion IS NOT NULL
        UNION
        SELECT gestion FROM "Recibidos" WHERE gestion IS NOT NULL
        UNION
        SELECT gestion FROM "Actas" WHERE gestion IS NOT NULL
        UNION
        SELECT gestion FROM "Auxiliares" WHERE gestion IS NOT NULL
        UNION
        SELECT gestion FROM "DocenteArchivos" WHERE gestion IS NOT NULL
        UNION
        SELECT gestion_ingreso AS gestion FROM "Docentes" WHERE gestion_ingreso IS NOT NULL
      ) g ORDER BY gestion;
    `, { transaction: t });

    const gestionMap = {};
    for (const g of gestionesRaw) {
      const anioNum = parseInt(g.gestion, 10);
      const [gest] = await Gestion.findOrCreate({
        where: { anio: anioNum },
        defaults: { id_gestion: uuidv4(), anio: anioNum },
        transaction: t
      });
      gestionMap[anioNum] = gest.id_gestion;
    }
    console.log(`   ✅ ${Object.keys(gestionMap).length} gestiones consolidadas:`, Object.keys(gestionMap).join(', '));

    // -----------------------------------------------------------------
    // 6. MATERIAS
    // -----------------------------------------------------------------
    console.log('\n📚 Paso 6: Migrando materias desde Auxiliares y Docentes...');
    const [materiasAux] = await sequelize.query(`
      SELECT DISTINCT TRIM(materia) AS materia, semestre 
      FROM "Auxiliares" 
      WHERE materia IS NOT NULL AND TRIM(materia) != '';
    `, { transaction: t });

    const [materiasDoc] = await sequelize.query(`
      SELECT DISTINCT TRIM(materia_principal) AS materia 
      FROM "Docentes" 
      WHERE materia_principal IS NOT NULL AND TRIM(materia_principal) != '';
    `, { transaction: t });

    const materiasMap = {}; // nombreNormalizado -> id_materia
    const materiasParaRevision = [];
    let matCounter = 100;

    // A) Materias con semestre confirmado de Auxiliares
    for (const m of materiasAux) {
      const nombreLimpio = m.materia;
      const key = nombreLimpio.toLowerCase();
      if (!materiasMap[key]) {
        matCounter++;
        const codigo = `SIS-${matCounter}`;
        const [mat] = await Materia.findOrCreate({
          where: { id_carrera: carreraDefault.id_carrera, nombre: nombreLimpio },
          defaults: {
            id_materia: uuidv4(),
            id_carrera: carreraDefault.id_carrera,
            codigo,
            nombre: nombreLimpio,
            semestre: m.semestre || 1,
            activo: true
          },
          transaction: t
        });
        materiasMap[key] = mat.id_materia;
      }
    }

    // B) Materias provenientes de docentes (si no existían, marcar para revisión)
    for (const md of materiasDoc) {
      const nombreLimpio = md.materia;
      const key = nombreLimpio.toLowerCase();
      if (!materiasMap[key]) {
        matCounter++;
        const codigo = `SIS-${matCounter}`;
        const [mat] = await Materia.findOrCreate({
          where: { id_carrera: carreraDefault.id_carrera, nombre: nombreLimpio },
          defaults: {
            id_materia: uuidv4(),
            id_carrera: carreraDefault.id_carrera,
            codigo,
            nombre: nombreLimpio,
            semestre: 1, // Semestre provisional
            activo: true
          },
          transaction: t
        });
        materiasMap[key] = mat.id_materia;
        materiasParaRevision.push({
          nombre: nombreLimpio,
          codigo,
          semestre_asignado_provisional: 1,
          origen: 'Docente.materia_principal'
        });
      }
    }

    // -----------------------------------------------------------------
    // 7. DOCENTES Y DOCENTE_MATERIAS
    // -----------------------------------------------------------------
    console.log('\n👨‍🏫 Paso 7: Migrando Docentes y relación Docente-Materias...');
    const [docentesOld] = await sequelize.query(`SELECT * FROM "Docentes" ORDER BY id;`, { transaction: t });
    const docenteIdMap = {}; // old_id -> new_uuid
    const docenteNombreMap = {};

    for (const doc of docentesOld) {
      const idGestionIngreso = doc.gestion_ingreso && gestionMap[doc.gestion_ingreso] ? gestionMap[doc.gestion_ingreso] : null;
      
      // Buscar o crear docente por nombre en la carrera
      let docente = await DocenteV4.findOne({
        where: { id_carrera: carreraDefault.id_carrera, nombre: doc.nombre },
        transaction: t
      });

      if (!docente) {
        docente = await DocenteV4.create({
          id_docente: uuidv4(),
          nombre: doc.nombre,
          ci: doc.ci || null,
          id_carrera: carreraDefault.id_carrera,
          id_gestion_ingreso: idGestionIngreso,
          activo: doc.activo !== false
        }, { transaction: t });
      }

      docenteIdMap[doc.id] = docente.id_docente;
      docenteNombreMap[doc.id] = docente.nombre;

      // Asignar materia si tiene materia_principal
      if (doc.materia_principal) {
        const matId = materiasMap[doc.materia_principal.trim().toLowerCase()];
        if (matId) {
          await DocenteMateria.findOrCreate({
            where: { id_docente: docente.id_docente, id_materia: matId },
            defaults: {
              id_docente_materia: uuidv4(),
              id_docente: docente.id_docente,
              id_materia: matId
            },
            transaction: t
          });
        }
      }
    }

    // -----------------------------------------------------------------
    // 8. CONVOCATORIAS Y AUXILIARES
    // -----------------------------------------------------------------
    console.log('\n🎓 Paso 8: Migrando Convocatorias y Auxiliares...');
    const [convRaw] = await sequelize.query(`
      SELECT DISTINCT nro_convocatoria, gestion, semestre 
      FROM "Auxiliares" 
      ORDER BY gestion DESC, semestre ASC;
    `, { transaction: t });

    const convocatoriaMap = {}; // "nro_gestion_semestre" -> id_convocatoria
    for (const c of convRaw) {
      const nro = c.nro_convocatoria || 'CONV-S/N';
      const gId = gestionMap[c.gestion] || gestionMap[2026] || Object.values(gestionMap)[0];
      const sem = c.semestre && (c.semestre === 1 || c.semestre === 2) ? c.semestre : 1;
      const key = `${nro}_${c.gestion}_${sem}`;

      const [conv] = await Convocatoria.findOrCreate({
        where: {
          id_carrera: carreraDefault.id_carrera,
          id_gestion: gId,
          nro_convocatoria: nro,
          semestre: sem
        },
        defaults: {
          id_convocatoria: uuidv4(),
          id_carrera: carreraDefault.id_carrera,
          id_gestion: gId,
          nro_convocatoria: nro,
          semestre: sem,
          observaciones: 'Migrado desde registros de Auxiliares'
        },
        transaction: t
      });

      convocatoriaMap[key] = conv.id_convocatoria;

      // Registrar fase inicial de convocatoria
      if (faseMap[1]) {
        await ConvocatoriaFase.findOrCreate({
          where: { id_convocatoria: conv.id_convocatoria, id_fase: faseMap[1] },
          defaults: {
            id_convocatoria_fase: uuidv4(),
            id_convocatoria: conv.id_convocatoria,
            id_fase: faseMap[1],
            fecha: new Date(),
            observaciones: 'Fase inicial migrada'
          },
          transaction: t
        });
      }
    }

    // Migrar Auxiliares
    const [auxOld] = await sequelize.query(`SELECT * FROM "Auxiliares" ORDER BY id;`, { transaction: t });
    const auxiliarIdMap = {};

    for (const aux of auxOld) {
      const nro = aux.nro_convocatoria || 'CONV-S/N';
      const sem = aux.semestre && (aux.semestre === 1 || aux.semestre === 2) ? aux.semestre : 1;
      const convKey = `${nro}_${aux.gestion}_${sem}`;
      const convId = convocatoriaMap[convKey];
      const matId = materiasMap[aux.materia.trim().toLowerCase()];

      if (!convId || !matId) {
        console.warn(`   ⚠️ Advertencia: Auxiliar #${aux.id} (${aux.nombre}) sin convocatoria o materia.`);
        continue;
      }

      // Validar estado CHECK ('aprobado', 'reprobado', 'pendiente')
      let estadoNormalizado = 'pendiente';
      if (aux.estado === 'aprobado' || aux.estado === 'reprobado' || aux.estado === 'pendiente') {
        estadoNormalizado = aux.estado;
      }

      let auxiliar = await AuxiliarV4.findOne({
        where: {
          id_convocatoria: convId,
          id_materia: matId,
          nombre: aux.nombre
        },
        transaction: t
      });

      if (!auxiliar) {
        auxiliar = await AuxiliarV4.create({
          id_auxiliar: uuidv4(),
          id_convocatoria: convId,
          id_materia: matId,
          nro_registro: aux.nro_registro || 'S/R',
          nombre: aux.nombre,
          nota_examen: aux.nota_examen ? parseFloat(aux.nota_examen) : null,
          estado: estadoNormalizado,
          es_ratificacion: aux.es_ratificacion || false
        }, { transaction: t });
      }

      auxiliarIdMap[aux.id] = auxiliar.id_auxiliar;
    }

    // -----------------------------------------------------------------
    // 9. USUARIOS
    // -----------------------------------------------------------------
    console.log('\n👤 Paso 9: Migrando usuarios a tabla users...');
    const [usersOld] = await sequelize.query(`SELECT * FROM "Users" ORDER BY id;`, { transaction: t });
    let superadminCreado = false;

    for (const u of usersOld) {
      // Determinar email provisional según username
      let emailUser = (u.username || '').toLowerCase().trim();
      if (emailUser === 'tudoespi12@gmail') {
        emailUser = 'tudoespi12@gmail.com';
      } else if (!emailUser.includes('@')) {
        emailUser = `${emailUser}@uagrm.edu.bo`;
      } else if (!emailUser.includes('.')) {
        emailUser = `${emailUser}.com`;
      }

      // Rol: directora/alicia/admin -> superadmin, secretaria -> admin
      const esSuper = u.username.toLowerCase().includes('director') || u.username.toLowerCase().includes('alicia') || u.username.toLowerCase().includes('admin');
      const rolId = esSuper ? rolSuperadmin.id_rol : rolAdmin.id_rol;

      const [userV4] = await Usuario.findOrCreate({
        where: { email: emailUser },
        defaults: {
          id_usuario: uuidv4(),
          email: emailUser,
          password_hash: u.password_hash,
          nombre: u.nombre || u.username,
          id_rol: rolId,
          id_carrera: carreraDefault.id_carrera,
          activo: true
        },
        transaction: t
      });

      if (esSuper) superadminCreado = true;
    }

    // Si por alguna razón no se creó superadmin, asegurar uno provisional
    if (!superadminCreado) {
      const emailProv = 'directora@uagrm.edu.bo';
      await Usuario.findOrCreate({
        where: { email: emailProv },
        defaults: {
          id_usuario: uuidv4(),
          email: emailProv,
          password_hash: '$2b$10$wS.OqYsnwTlSvO2YIaGUZ.ZGI57L0.3D.jMs7n1tn3h4d5pTGKAkC', // 123456
          nombre: 'Directora de Carrera',
          id_rol: rolSuperadmin.id_rol,
          id_carrera: carreraDefault.id_carrera,
          activo: true
        },
        transaction: t
      });
    }

    // Obtener un usuario por defecto para created_by
    const defaultUser = await Usuario.findOne({ transaction: t });
    const defaultUserId = defaultUser ? defaultUser.id_usuario : null;

    // -----------------------------------------------------------------
    // 10. UNIFICACIÓN DE DOCUMENTOS (EXPEDIDOS, RECIBIDOS, ACTAS, DOCENTE_ARCHIVOS)
    // -----------------------------------------------------------------
    console.log('\n📄 Paso 10: Unificando todos los documentos en documents + attachments...');

    // A) Expedidos
    const [expedidosOld] = await sequelize.query(`SELECT * FROM "Expedidos" ORDER BY id;`, { transaction: t });
    for (const exp of expedidosOld) {
      const gId = gestionMap[exp.gestion] || Object.values(gestionMap)[0];
      const corr = exp.nro_oficio;
      const nroDoc = String(corr);

      let doc = await Document.findOne({
        where: {
          id_carrera: carreraDefault.id_carrera,
          id_tipo_documento: tipoDocMap['Oficio expedido'],
          id_gestion: gId,
          nro_documento: nroDoc
        },
        transaction: t
      });

      if (!doc) {
        doc = await Document.create({
          id_documento: uuidv4(),
          id_tipo_documento: tipoDocMap['Oficio expedido'],
          id_gestion: gId,
          id_carrera: carreraDefault.id_carrera,
          nro_documento: nroDoc,
          correlativo: corr,
          fecha: exp.fecha,
          fecha_recepcion: null,
          remitente: NOMBRE_CARRERA_DEFAULT,
          destinatario: exp.destinatario,
          asunto: exp.asunto,
          descripcion: exp.descripcion,
          estado: exp.estado || 'pendiente',
          requiere_respuesta: exp.requiere_respuesta || false,
          tipo_respuesta: null,
          created_by: defaultUserId
        }, { transaction: t });

        if (exp.archivo_path) {
          await DocumentAttachment.create({
            id_adjunto: uuidv4(),
            id_documento: doc.id_documento,
            nombre_archivo: exp.nombre_archivo || 'oficio_expedido.pdf',
            archivo_path: exp.archivo_path,
            archivo_tipo: 'application/pdf',
            archivo_tamano: null
          }, { transaction: t });
        }
      }
    }

    // B) Recibidos
    const [recibidosOld] = await sequelize.query(`SELECT * FROM "Recibidos" ORDER BY id;`, { transaction: t });
    for (const rec of recibidosOld) {
      const gId = gestionMap[rec.gestion] || Object.values(gestionMap)[0];
      const corr = rec.nro_recibido;
      const nroDoc = String(corr);

      let doc = await Document.findOne({
        where: {
          id_carrera: carreraDefault.id_carrera,
          id_tipo_documento: tipoDocMap['Oficio recibido'],
          id_gestion: gId,
          nro_documento: nroDoc
        },
        transaction: t
      });

      if (!doc) {
        doc = await Document.create({
          id_documento: uuidv4(),
          id_tipo_documento: tipoDocMap['Oficio recibido'],
          id_gestion: gId,
          id_carrera: carreraDefault.id_carrera,
          nro_documento: nroDoc,
          correlativo: corr,
          fecha: rec.fecha,
          fecha_recepcion: rec.fecha,
          remitente: rec.remitente,
          destinatario: NOMBRE_CARRERA_DEFAULT,
          asunto: rec.asunto,
          descripcion: rec.descripcion,
          estado: rec.estado || 'pendiente',
          requiere_respuesta: rec.tipo_respuesta === 'requiere_respuesta',
          tipo_respuesta: rec.tipo_respuesta,
          created_by: defaultUserId
        }, { transaction: t });

        if (rec.archivo_path) {
          await DocumentAttachment.create({
            id_adjunto: uuidv4(),
            id_documento: doc.id_documento,
            nombre_archivo: rec.nombre_archivo || 'documento_recibido.pdf',
            archivo_path: rec.archivo_path,
            archivo_tipo: 'application/pdf',
            archivo_tamano: null
          }, { transaction: t });
        }
      }
    }

    // C) Actas de Graduación
    const [actasOld] = await sequelize.query(`SELECT * FROM "Actas" ORDER BY id;`, { transaction: t });
    for (const act of actasOld) {
      const gId = gestionMap[act.gestion] || Object.values(gestionMap)[0];
      const nroDoc = String(act.nro_acta);
      const fechaActa = act.createdAt ? new Date(act.createdAt).toISOString().slice(0, 10) : '2026-01-01';

      let doc = await Document.findOne({
        where: {
          id_carrera: carreraDefault.id_carrera,
          id_tipo_documento: tipoDocMap['Acta de graduación'],
          id_gestion: gId,
          nro_documento: nroDoc
        },
        transaction: t
      });

      if (!doc) {
        doc = await Document.create({
          id_documento: uuidv4(),
          id_tipo_documento: tipoDocMap['Acta de graduación'],
          id_gestion: gId,
          id_carrera: carreraDefault.id_carrera,
          nro_documento: nroDoc,
          correlativo: null,
          fecha: fechaActa,
          fecha_recepcion: null,
          remitente: 'Comisión Evaluadora / CPD',
          destinatario: NOMBRE_CARRERA_DEFAULT,
          asunto: `Acta de Graduación: ${act.nombre_estudiante}`,
          descripcion: `Defensa de grado modalidad ${act.modalidad}. Registro: ${act.nro_registro || 'S/R'}`,
          estado: 'completado',
          requiere_respuesta: false,
          tipo_respuesta: null,
          created_by: defaultUserId
        }, { transaction: t });

        // Detalle de Acta (1 a 1)
        await ActaDetalle.create({
          id_documento: doc.id_documento,
          nombre_estudiante: act.nombre_estudiante,
          ci: act.ci,
          nro_registro: act.nro_registro,
          modalidad: act.modalidad,
          codigo_cpd: act.codigo_cpd,
          nota: act.nota ? parseFloat(act.nota) : null
        }, { transaction: t });

        if (act.archivo_path) {
          await DocumentAttachment.create({
            id_adjunto: uuidv4(),
            id_documento: doc.id_documento,
            nombre_archivo: act.nombre_archivo || 'acta_graduacion.pdf',
            archivo_path: act.archivo_path,
            archivo_tipo: 'application/pdf',
            archivo_tamano: null
          }, { transaction: t });
        }
      }
    }

    // D) DocenteArchivos (Expedientes de Docentes)
    const [docArchOld] = await sequelize.query(`SELECT * FROM "DocenteArchivos" ORDER BY id;`, { transaction: t });
    for (const da of docArchOld) {
      const gId = (da.gestion && gestionMap[da.gestion]) ? gestionMap[da.gestion] : Object.values(gestionMap)[0];
      const tipoNombre = docenteArchivoTipoToNombre[da.tipo] || 'Otro';
      const tipoId = tipoDocMap[tipoNombre] || tipoDocMap['Otro'];
      const docIdNuevo = docenteIdMap[da.id_docente];
      const fechaDoc = da.createdAt ? new Date(da.createdAt).toISOString().slice(0, 10) : '2026-01-01';
      const nroDoc = `EXP-DOC-${da.id}`;

      let doc = await Document.findOne({
        where: {
          id_carrera: carreraDefault.id_carrera,
          id_tipo_documento: tipoId,
          id_gestion: gId,
          nro_documento: nroDoc
        },
        transaction: t
      });

      if (!doc) {
        doc = await Document.create({
          id_documento: uuidv4(),
          id_tipo_documento: tipoId,
          id_gestion: gId,
          id_carrera: carreraDefault.id_carrera,
          nro_documento: nroDoc,
          correlativo: null,
          fecha: fechaDoc,
          remitente: docenteNombreMap[da.id_docente] || 'Docente',
          destinatario: NOMBRE_CARRERA_DEFAULT,
          asunto: `Expediente Docente: ${tipoNombre}`,
          descripcion: `Archivo digitalizado de cátedra docente.`,
          estado: 'completado',
          semestre: da.semestre ? parseInt(da.semestre, 10) : null,
          id_docente: docIdNuevo || null,
          created_by: defaultUserId
        }, { transaction: t });

        if (da.archivo_path) {
          await DocumentAttachment.create({
            id_adjunto: uuidv4(),
            id_documento: doc.id_documento,
            nombre_archivo: da.nombre_original || 'expediente_docente.pdf',
            archivo_path: da.archivo_path,
            archivo_tipo: 'application/pdf',
            archivo_tamano: null
          }, { transaction: t });
        }
      }
    }

    // Confirmar transacción
    await t.commit();
    console.log('\n=====================================================');
    console.log('🎉 ¡TRANSACCIÓN COMPLETADA Y CONFIRMADA EN POSTGRESQL!');
    console.log('=====================================================\n');

    // -----------------------------------------------------------------
    // 11. REPORTE FINAL: FILAS ORIGEN VS DESTINO
    // -----------------------------------------------------------------
    console.log('📊 REPORTE DE FILAS (ORIGEN VS DESTINO):');
    console.log('-----------------------------------------------------');
    const [cUsers] = await sequelize.query('SELECT count(*) as count FROM "Users"');
    const [cUsuariosV4] = await sequelize.query('SELECT count(*) as count FROM "users"');
    console.log(`• Usuarios:            Origen ("Users"): ${cUsers[0].count}  -->  Destino ("users"): ${cUsuariosV4[0].count}`);

    const [cExp] = await sequelize.query('SELECT count(*) as count FROM "Expedidos"');
    const [cRec] = await sequelize.query('SELECT count(*) as count FROM "Recibidos"');
    const [cAct] = await sequelize.query('SELECT count(*) as count FROM "Actas"');
    const [cDa] = await sequelize.query('SELECT count(*) as count FROM "DocenteArchivos"');
    const totalDocsEsperados = parseInt(cExp[0].count, 10) + parseInt(cRec[0].count, 10) + parseInt(cAct[0].count, 10) + parseInt(cDa[0].count, 10);
    const [cDocs] = await sequelize.query('SELECT count(*) as count FROM "documents"');
    const [cActDet] = await sequelize.query('SELECT count(*) as count FROM "actas_detalles"');
    const [cAdj] = await sequelize.query('SELECT count(*) as count FROM "document_attachments"');
    console.log(`• Documentos totales:  Origen (Exp+Rec+Act+DocArch = ${totalDocsEsperados})  -->  Destino ("documents"): ${cDocs[0].count}`);
    console.log(`• Actas Detalles (1:1):Origen ("Actas"): ${cAct[0].count}  -->  Destino ("actas_detalles"): ${cActDet[0].count}`);
    console.log(`• Adjuntos Digitales:  Destino ("document_attachments"): ${cAdj[0].count}`);

    const [cDoc] = await sequelize.query('SELECT count(*) as count FROM "Docentes"');
    const [cDocV4] = await sequelize.query('SELECT count(*) as count FROM "docentes"');
    const [cDocMat] = await sequelize.query('SELECT count(*) as count FROM "docente_materias"');
    console.log(`• Docentes:            Origen ("Docentes"): ${cDoc[0].count}  -->  Destino ("docentes"): ${cDocV4[0].count}`);
    console.log(`• Relación Doc-Materia:Destino ("docente_materias"): ${cDocMat[0].count}`);

    const [cAux] = await sequelize.query('SELECT count(*) as count FROM "Auxiliares"');
    const [cAuxV4] = await sequelize.query('SELECT count(*) as count FROM "auxiliares"');
    const [cConv] = await sequelize.query('SELECT count(*) as count FROM "convocatorias"');
    console.log(`• Auxiliares:          Origen ("Auxiliares"): ${cAux[0].count}  -->  Destino ("auxiliares"): ${cAuxV4[0].count}`);
    console.log(`• Convocatorias:       Destino ("convocatorias"): ${cConv[0].count}`);

    const [cMat] = await sequelize.query('SELECT count(*) as count FROM "materias"');
    const [cGest] = await sequelize.query('SELECT count(*) as count FROM "gestiones"');
    console.log(`• Materias Creadas:    Destino ("materias"): ${cMat[0].count}`);
    console.log(`• Gestiones Creadas:   Destino ("gestiones"): ${cGest[0].count}`);
    console.log('-----------------------------------------------------');

    if (materiasParaRevision.length > 0) {
      console.log('\n⚠️ MATERIAS QUE PROVIENEN SOLO DE DOCENTES (REQUERIRÁN REVISIÓN DE SEMESTRE):');
      console.table(materiasParaRevision);
    } else {
      console.log('\n✅ Todas las materias tenían semestre definido en Auxiliares.');
    }

    console.log('\n✨ Migración finalizada con éxito.');
    process.exit(0);

  } catch (error) {
    await t.rollback();
    console.error('\n❌ ERROR EN LA MIGRACIÓN (TRANSACCIÓN REVERTIDA):', error);
    process.exit(1);
  }
}

migrate();
