/**
 * Actualiza una base de datos SIGAD de la versión antigua a la versión actual (V4).
 *
 * Uso (desde la carpeta backend, ANTES de arrancar el backend nuevo):
 *   npm run db:actualizar                 -> respaldo + migración + verificación
 *   npm run db:actualizar -- --limpiar    -> además borra las tablas antiguas, solo si todo se migró
 *
 * Qué hace:
 *   1. Revisa en qué estado está la base (antigua, actual o actual con tablas antiguas sobrantes).
 *   2. Hace un respaldo completo con pg_dump en backend/respaldos/ (obligatorio; --sin-respaldo lo omite).
 *   3. Si la base es antigua: renombra las tablas de la versión 1 que chocan con las nuevas
 *      (users, documents, roles...) a _legacy_old_*, crea las tablas V4 y copia los datos de
 *      "Users", "Expedidos", "Recibidos", "Actas", "Docentes", "DocenteArchivos" y "Auxiliares".
 *      Todo en una sola transacción: si algo falla, no se cambia nada.
 *   4. Verifica registro por registro que cada dato antiguo exista en las tablas nuevas.
 *   5. Con --limpiar, y solo si la verificación no encontró faltantes, borra las tablas antiguas.
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { randomUUID } = require('crypto');

require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const {
  sequelize,
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

const args = process.argv.slice(2);
const LIMPIAR = args.includes('--limpiar');
const SIN_RESPALDO = args.includes('--sin-respaldo');

const CARRERA = 'Ingeniería de Sistemas';

// Tablas de la versión anterior (con mayúscula), de donde salen los datos
const TABLAS_V3 = ['Users', 'Docentes', 'DocenteArchivos', 'Auxiliares', 'Expedidos', 'Recibidos', 'Actas'];

// Tablas de una versión aún más vieja; algunas se llaman igual que las nuevas y deben apartarse
const TABLAS_V1 = [
  'documents', 'document_types', 'document_attachments', 'roles', 'users', 'departments',
  'document_histories', 'document_priorities', 'document_recipients', 'document_statuses',
  'movement_types', 'notifications', 'verification_tokens'
];

// Orden de creación: cada tabla después de las que referencia
const MODELOS_V4 = [
  Carrera, Rol, Usuario, Gestion, Materia, DocenteV4, DocenteMateria, FaseProceso, Convocatoria,
  AuxiliarV4, DocumentType, Document, ActaDetalle, DocumentAttachment, ConvocatoriaFase
];

const ROLES = [
  { nombre: 'superadmin', cargo: 'Director de carrera', descripcion: 'Acceso total administrativo' },
  { nombre: 'director', cargo: 'Directora', descripcion: 'Dirección de Carrera' },
  { nombre: 'admin', cargo: 'Secretaria', descripcion: 'Secretaría de Dirección de Carrera' },
  { nombre: 'secretaria', cargo: 'Secretaria', descripcion: 'Secretaría de Dirección' },
  { nombre: 'docente', cargo: 'Docente', descripcion: 'Docente de la Carrera' },
  { nombre: 'auxiliar', cargo: 'Auxiliar', descripcion: 'Auxiliar de Cátedra' }
];

const FASES = ['Propuesta de materia', 'Consejo facultativo', 'Convocatoria', 'Evaluación y selección'];

const TIPOS_DOC = [
  ['Oficio expedido', 'Correspondencia oficial despachada por Dirección de Carrera'],
  ['Oficio recibido', 'Correspondencia entrante a Dirección de Carrera'],
  ['Acta de graduación', 'Acta formal de defensa de grado y titulación'],
  ['Curriculum Vitae', 'Expediente docente: Hoja de vida y respaldos'],
  ['Programa Analítico', 'Expediente docente: Plan de materia semestral'],
  ['Informe Final', 'Expediente docente: Informe final de notas y avance'],
  ['Lista de Asistencia', 'Expediente docente: Planillas de control y asistencia'],
  ['Informe de Cátedra', 'Expediente docente: Informe evaluativo de cátedra'],
  ['Otro', 'Expediente docente: Documentación complementaria']
];

const TIPO_ARCHIVO_DOCENTE = {
  curriculum: 'Curriculum Vitae',
  programa_analitico: 'Programa Analítico',
  informe_final: 'Informe Final',
  lista_asistencia: 'Lista de Asistencia',
  informe_cathedra: 'Informe de Cátedra',
  informe_catedra: 'Informe de Cátedra',
  otro: 'Otro'
};

// Correo con el que cada usuario antiguo inicia sesión en la versión nueva
const correoDesdeUsuario = (username) => {
  let correo = String(username || '').toLowerCase().trim();
  if (!correo.includes('@')) return `${correo}@uagrm.edu.bo`;
  if (!correo.split('@')[1].includes('.')) correo = `${correo}.com`;
  return correo;
};
const esSuperadmin = (username) => /director|alicia|admin/i.test(String(username || ''));

const ESTADOS_DOC = ['pendiente', 'en_curso', 'completado', 'archivado'];
const estadoDoc = (valor) => (ESTADOS_DOC.includes(valor) ? valor : 'pendiente');

const titulo = (texto) => console.log(`\n=== ${texto} ===`);

// ------------------------------------------------------------------
// Utilidades de base de datos
// ------------------------------------------------------------------
async function listarTablas() {
  // El alias evita que Sequelize trate la consulta como "SHOW TABLES" y cambie el formato del resultado
  const [filas] = await sequelize.query(
    "SELECT t.table_name AS nombre FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'"
  );
  return new Set(filas.map((f) => f.nombre));
}

async function contar(tabla, opciones = {}) {
  const [[fila]] = await sequelize.query(`SELECT count(*)::int AS n FROM "${tabla}"`, opciones);
  return fila.n;
}

async function diagnosticar() {
  const tablas = await listarTablas();
  const esV4 = tablas.has('gestiones') && tablas.has('convocatorias');
  const v3 = [];
  for (const t of TABLAS_V3) if (tablas.has(t)) v3.push({ tabla: t, filas: await contar(t) });
  const legacy = [...tablas].filter((t) => t.startsWith('_legacy_old_'));
  const v1SinApartar = esV4 ? [] : TABLAS_V1.filter((t) => tablas.has(t));
  return { tablas, esV4, v3, legacy, v1SinApartar };
}

// ------------------------------------------------------------------
// Respaldo con pg_dump
// ------------------------------------------------------------------
function buscarPgDump() {
  const nombre = process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';
  try {
    execFileSync(nombre, ['--version'], { stdio: 'ignore' });
    return nombre;
  } catch { /* no está en el PATH */ }
  const bases = process.platform === 'win32'
    ? ['C:\\Program Files\\PostgreSQL', 'C:\\Program Files (x86)\\PostgreSQL']
    : ['/usr/lib/postgresql', '/Library/PostgreSQL'];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    const versiones = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a));
    for (const v of versiones) {
      const candidato = path.join(base, v, 'bin', nombre);
      if (fs.existsSync(candidato)) return candidato;
    }
  }
  return null;
}

function hacerRespaldo() {
  if (SIN_RESPALDO) {
    console.log('⚠️  Respaldo omitido por --sin-respaldo.');
    return;
  }
  const pgDump = buscarPgDump();
  if (!pgDump) {
    throw new Error(
      'No encontré pg_dump para hacer el respaldo. Haz un respaldo manual desde pgAdmin ' +
      '(clic derecho en la base → Backup...) y vuelve a ejecutar con --sin-respaldo.'
    );
  }
  const carpeta = path.resolve(__dirname, '../respaldos');
  fs.mkdirSync(carpeta, { recursive: true });
  const sello = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const archivo = path.join(carpeta, `${process.env.DB_NAME}_antes_de_actualizar_${sello}.dump`);
  execFileSync(pgDump, [
    '-h', process.env.DB_HOST || 'localhost',
    '-p', String(process.env.DB_PORT || 5432),
    '-U', process.env.DB_USER,
    '-F', 'c',
    '-f', archivo,
    process.env.DB_NAME
  ], { env: { ...process.env, PGPASSWORD: process.env.DB_PASS || '' }, stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`💾 Respaldo creado: ${archivo}`);
  console.log('   Para volver atrás: pg_restore -U postgres -d', process.env.DB_NAME, '--clean --if-exists "<archivo>"');
}

// ------------------------------------------------------------------
// Migración de datos (versión anterior -> V4)
// ------------------------------------------------------------------
async function migrar(estado) {
  const t = await sequelize.transaction();
  const opt = { transaction: t };
  try {
    if (!estado.esV4) {
      titulo('Apartando tablas de la versión 1 que chocan con las nuevas');
      for (const tabla of estado.v1SinApartar) {
        const destino = `_legacy_old_${tabla}`;
        if (estado.tablas.has(destino)) {
          throw new Error(`Ya existe "${destino}". Revisa la base a mano antes de continuar.`);
        }
        await sequelize.query(`ALTER TABLE "${tabla}" RENAME TO "${destino}"`, opt);
        console.log(`   ${tabla} → ${destino}`);
      }

      titulo('Creando tablas de la versión actual');
      for (const modelo of MODELOS_V4) await modelo.sync(opt);
      console.log(`   ${MODELOS_V4.length} tablas listas.`);
    }

    titulo('Datos base (carrera, roles, fases, tipos de documento)');
    const [carrera] = await Carrera.findOrCreate({
      where: { nombre: CARRERA },
      defaults: { id_carrera: randomUUID(), nombre: CARRERA, activo: true },
      ...opt
    });
    const rolPorNombre = {};
    for (const r of ROLES) {
      const [rol] = await Rol.findOrCreate({ where: { nombre: r.nombre }, defaults: { id_rol: randomUUID(), ...r }, ...opt });
      rolPorNombre[r.nombre] = rol;
    }
    const fasePorOrden = {};
    for (const [i, nombre] of FASES.entries()) {
      const [fase] = await FaseProceso.findOrCreate({
        where: { nombre }, defaults: { id_fase: randomUUID(), nombre, orden: i + 1 }, ...opt
      });
      fasePorOrden[i + 1] = fase.id_fase;
    }
    const tipoId = {};
    for (const [nombre, descripcion] of TIPOS_DOC) {
      const [tipo] = await DocumentType.findOrCreate({
        where: { nombre }, defaults: { id_tipo_documento: randomUUID(), nombre, descripcion }, ...opt
      });
      tipoId[nombre] = tipo.id_tipo_documento;
    }

    const leer = async (tabla) => (estado.v3.some((x) => x.tabla === tabla)
      ? (await sequelize.query(`SELECT * FROM "${tabla}" ORDER BY id`, opt))[0]
      : []);
    const [usersV3, docentesV3, archivosV3, auxV3, expV3, recV3, actasV3] = await Promise.all(
      ['Users', 'Docentes', 'DocenteArchivos', 'Auxiliares', 'Expedidos', 'Recibidos', 'Actas'].map(leer)
    );

    titulo('Gestiones (años)');
    const anios = new Set();
    [...auxV3, ...expV3, ...recV3, ...actasV3, ...archivosV3].forEach((r) => r.gestion && anios.add(Number(r.gestion)));
    docentesV3.forEach((d) => d.gestion_ingreso && anios.add(Number(d.gestion_ingreso)));
    anios.add(new Date().getFullYear());
    const gestionId = {};
    for (const anio of [...anios].sort()) {
      const [g] = await Gestion.findOrCreate({ where: { anio }, defaults: { id_gestion: randomUUID(), anio }, ...opt });
      gestionId[anio] = g.id_gestion;
    }
    const gestionDe = (anio) => gestionId[Number(anio)] || gestionId[new Date().getFullYear()];
    console.log(`   ${Object.keys(gestionId).join(', ')}`);

    titulo('Materias');
    const materiaId = {};
    let correlativoMateria = (await Materia.count(opt)) + 100;
    const asegurarMateria = async (nombre, semestre) => {
      const limpio = String(nombre || '').trim();
      if (!limpio) return null;
      const clave = limpio.toLowerCase();
      if (materiaId[clave]) return materiaId[clave];
      let materia = await Materia.findOne({ where: { id_carrera: carrera.id_carrera, nombre: limpio }, ...opt });
      if (!materia) {
        correlativoMateria += 1;
        materia = await Materia.create({
          id_materia: randomUUID(), id_carrera: carrera.id_carrera, codigo: `SIS-${correlativoMateria}`,
          nombre: limpio, semestre: semestre || 1, activo: true
        }, opt);
      }
      materiaId[clave] = materia.id_materia;
      return materia.id_materia;
    };
    for (const a of auxV3) await asegurarMateria(a.materia, a.semestre);
    for (const d of docentesV3) await asegurarMateria(d.materia_principal, 1);
    console.log(`   ${Object.keys(materiaId).length} materias.`);

    titulo('Usuarios');
    const correos = [];
    for (const u of usersV3) {
      const email = correoDesdeUsuario(u.username);
      const rol = esSuperadmin(u.username) ? rolPorNombre.superadmin : rolPorNombre.admin;
      await Usuario.findOrCreate({
        where: { email },
        defaults: {
          id_usuario: randomUUID(), email, password_hash: u.password_hash, nombre: u.nombre || u.username,
          id_rol: rol.id_rol, id_carrera: carrera.id_carrera, activo: true
        },
        ...opt
      });
      correos.push({ usuario_antiguo: u.username, correo_nuevo: email, rol: rol.nombre });
    }
    const creador = await Usuario.findOne({ ...opt });

    titulo('Docentes');
    const docenteId = {};
    const docenteNombre = {};
    for (const d of docentesV3) {
      let docente = await DocenteV4.findOne({ where: { id_carrera: carrera.id_carrera, nombre: d.nombre }, ...opt });
      if (!docente) {
        docente = await DocenteV4.create({
          id_docente: randomUUID(), nombre: d.nombre, ci: d.ci || null, id_carrera: carrera.id_carrera,
          id_gestion_ingreso: d.gestion_ingreso ? gestionDe(d.gestion_ingreso) : null, activo: d.activo !== false
        }, opt);
      }
      docenteId[d.id] = docente.id_docente;
      docenteNombre[d.id] = docente.nombre;
      const idMat = d.materia_principal ? materiaId[d.materia_principal.trim().toLowerCase()] : null;
      if (idMat) {
        await DocenteMateria.findOrCreate({
          where: { id_docente: docente.id_docente, id_materia: idMat },
          defaults: { id_docente_materia: randomUUID(), id_docente: docente.id_docente, id_materia: idMat },
          ...opt
        });
      }
    }

    titulo('Convocatorias y auxiliares');
    const convId = {};
    for (const a of auxV3) {
      const nro = a.nro_convocatoria || 'CONV-S/N';
      const sem = a.semestre === 2 ? 2 : 1;
      const clave = `${nro}|${a.gestion}|${sem}`;
      if (!convId[clave]) {
        const [conv] = await Convocatoria.findOrCreate({
          where: { id_carrera: carrera.id_carrera, id_gestion: gestionDe(a.gestion), nro_convocatoria: nro, semestre: sem },
          defaults: {
            id_convocatoria: randomUUID(), id_carrera: carrera.id_carrera, id_gestion: gestionDe(a.gestion),
            nro_convocatoria: nro, semestre: sem, observaciones: 'Migrada desde la versión anterior'
          },
          ...opt
        });
        convId[clave] = conv.id_convocatoria;
      }
      const idMat = materiaId[String(a.materia || '').trim().toLowerCase()];
      if (!idMat) {
        console.warn(`   ⚠️  Auxiliar "${a.nombre}" (id ${a.id}) no tiene materia: no se migra.`);
        continue;
      }
      const existe = await AuxiliarV4.findOne({
        where: { id_convocatoria: convId[clave], id_materia: idMat, nombre: a.nombre }, ...opt
      });
      if (!existe) {
        await AuxiliarV4.create({
          id_auxiliar: randomUUID(), id_convocatoria: convId[clave], id_materia: idMat,
          nro_registro: a.nro_registro || 'S/R', nombre: a.nombre,
          nota_examen: a.nota_examen != null ? parseFloat(a.nota_examen) : null,
          estado: ['aprobado', 'reprobado', 'pendiente'].includes(a.estado) ? a.estado : 'pendiente',
          es_ratificacion: Boolean(a.es_ratificacion)
        }, opt);
      }
    }

    titulo('Documentos y archivos adjuntos');
    const crearDocumento = async ({ tipo, anio, nro, adjunto, ...datos }) => {
      const where = { id_carrera: carrera.id_carrera, id_tipo_documento: tipoId[tipo], id_gestion: gestionDe(anio), nro_documento: String(nro) };
      if (await Document.findOne({ where, ...opt })) return null;
      const doc = await Document.create({ id_documento: randomUUID(), ...where, created_by: creador ? creador.id_usuario : null, ...datos }, opt);
      if (adjunto && adjunto.archivo_path) {
        await DocumentAttachment.create({
          id_adjunto: randomUUID(), id_documento: doc.id_documento, nombre_archivo: adjunto.nombre || 'documento.pdf',
          archivo_path: adjunto.archivo_path, archivo_tipo: 'application/pdf', archivo_tamano: null
        }, opt);
      }
      return doc;
    };
    const fechaDe = (r) => (r.fecha ? r.fecha : (r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : `${r.gestion || new Date().getFullYear()}-01-01`));

    for (const e of expV3) {
      await crearDocumento({
        tipo: 'Oficio expedido', anio: e.gestion, nro: e.nro_oficio, correlativo: e.nro_oficio, fecha: fechaDe(e),
        remitente: CARRERA, destinatario: e.destinatario, asunto: e.asunto || 'Sin asunto', descripcion: e.descripcion,
        estado: estadoDoc(e.estado), requiere_respuesta: Boolean(e.requiere_respuesta),
        adjunto: { archivo_path: e.archivo_path, nombre: e.nombre_archivo }
      });
    }
    for (const r of recV3) {
      await crearDocumento({
        tipo: 'Oficio recibido', anio: r.gestion, nro: r.nro_recibido, correlativo: r.nro_recibido, fecha: fechaDe(r),
        fecha_recepcion: r.fecha, remitente: r.remitente, destinatario: CARRERA, asunto: r.asunto || 'Sin asunto',
        descripcion: r.descripcion, estado: estadoDoc(r.estado),
        requiere_respuesta: r.tipo_respuesta === 'requiere_respuesta', tipo_respuesta: r.tipo_respuesta,
        adjunto: { archivo_path: r.archivo_path, nombre: r.nombre_archivo }
      });
    }
    for (const a of actasV3) {
      const doc = await crearDocumento({
        tipo: 'Acta de graduación', anio: a.gestion, nro: a.nro_acta, fecha: fechaDe(a),
        remitente: 'Comisión Evaluadora / CPD', destinatario: CARRERA, asunto: `Acta de Graduación: ${a.nombre_estudiante}`,
        descripcion: `Defensa de grado modalidad ${a.modalidad}. Registro: ${a.nro_registro || 'S/R'}`, estado: 'completado',
        adjunto: { archivo_path: a.archivo_path, nombre: a.nombre_archivo }
      });
      if (doc) {
        await ActaDetalle.create({
          id_documento: doc.id_documento, nombre_estudiante: a.nombre_estudiante, ci: a.ci, nro_registro: a.nro_registro,
          modalidad: a.modalidad || 'tesis', codigo_cpd: a.codigo_cpd, nota: a.nota != null ? parseFloat(a.nota) : null
        }, opt);
      }
    }
    for (const da of archivosV3) {
      const tipo = TIPO_ARCHIVO_DOCENTE[da.tipo] || 'Otro';
      await crearDocumento({
        tipo, anio: da.gestion, nro: `EXP-DOC-${da.id}`, fecha: fechaDe(da),
        remitente: docenteNombre[da.id_docente] || 'Docente', destinatario: CARRERA, asunto: `Expediente Docente: ${tipo}`,
        descripcion: 'Archivo digitalizado de cátedra docente.', estado: 'completado',
        semestre: da.semestre ? parseInt(da.semestre, 10) : null, id_docente: docenteId[da.id_docente] || null,
        adjunto: { archivo_path: da.archivo_path, nombre: da.nombre_original }
      });
    }

    // Primera fase de cada convocatoria migrada, para que su avance no quede vacío
    for (const id of Object.values(convId)) {
      await ConvocatoriaFase.findOrCreate({
        where: { id_convocatoria: id, id_fase: fasePorOrden[1] },
        defaults: {
          id_convocatoria_fase: randomUUID(), id_convocatoria: id, id_fase: fasePorOrden[1],
          fecha: new Date().toISOString().slice(0, 10), observaciones: 'Fase inicial migrada'
        },
        ...opt
      });
    }

    await t.commit();
    console.log('\n✅ Migración confirmada.');
    if (correos.length) {
      console.log('\nUsuarios: inician sesión con este correo y la MISMA contraseña de antes:');
      console.table(correos);
    }
  } catch (err) {
    await t.rollback();
    throw new Error(`La migración falló y se revirtió por completo (la base quedó como estaba): ${err.message}`);
  }
}

// ------------------------------------------------------------------
// Verificación: cada registro antiguo debe existir en las tablas nuevas
// ------------------------------------------------------------------
async function verificar(estado) {
  const hay = (t) => estado.v3.some((x) => x.tabla === t) || false;
  const faltantes = [];
  const revisar = async (tabla, sql, describir) => {
    if (!hay(tabla)) return;
    const [filas] = await sequelize.query(sql);
    filas.forEach((f) => faltantes.push({ tabla, registro: describir(f) }));
  };
  const docSql = (tabla, campoNro, tipo) => `
    SELECT x.id, x."${campoNro}" AS nro, x.gestion FROM "${tabla}" x
    WHERE NOT EXISTS (
      SELECT 1 FROM documents d
      JOIN document_types t ON t.id_tipo_documento = d.id_tipo_documento
      JOIN gestiones g ON g.id_gestion = d.id_gestion
      WHERE t.nombre = '${tipo}' AND d.nro_documento = x."${campoNro}"::text
        AND (x.gestion IS NULL OR g.anio = x.gestion::int))`;

  await revisar('Expedidos', docSql('Expedidos', 'nro_oficio', 'Oficio expedido'), (f) => `Oficio ${f.nro} (${f.gestion})`);
  await revisar('Recibidos', docSql('Recibidos', 'nro_recibido', 'Oficio recibido'), (f) => `Recibido ${f.nro} (${f.gestion})`);
  await revisar('Actas', docSql('Actas', 'nro_acta', 'Acta de graduación'), (f) => `Acta ${f.nro} (${f.gestion})`);
  await revisar('DocenteArchivos',
    `SELECT x.id FROM "DocenteArchivos" x WHERE NOT EXISTS (SELECT 1 FROM documents d WHERE d.nro_documento = 'EXP-DOC-' || x.id)`,
    (f) => `Archivo de docente id ${f.id}`);
  await revisar('Docentes',
    'SELECT x.id, x.nombre FROM "Docentes" x WHERE NOT EXISTS (SELECT 1 FROM docentes d WHERE d.nombre = x.nombre)',
    (f) => `Docente ${f.nombre}`);
  await revisar('Auxiliares', `
    SELECT x.id, x.nombre, x.materia FROM "Auxiliares" x WHERE NOT EXISTS (
      SELECT 1 FROM auxiliares a JOIN materias m ON m.id_materia = a.id_materia
      WHERE a.nombre = x.nombre AND lower(trim(m.nombre)) = lower(trim(coalesce(x.materia, ''))))`,
  (f) => `Auxiliar ${f.nombre} (${f.materia || 'sin materia'})`);
  if (hay('Users')) {
    const [usuarios] = await sequelize.query('SELECT username FROM "Users"');
    const [nuevos] = await sequelize.query('SELECT email FROM users');
    const emails = new Set(nuevos.map((u) => u.email));
    usuarios.forEach((u) => {
      if (!emails.has(correoDesdeUsuario(u.username))) faltantes.push({ tabla: 'Users', registro: `Usuario ${u.username}` });
    });
  }
  return faltantes;
}

async function limpiar(estado) {
  const tablas = [...estado.v3.map((x) => x.tabla), ...estado.legacy];
  if (!tablas.length) {
    console.log('No hay tablas antiguas que borrar.');
    return;
  }
  const t = await sequelize.transaction();
  try {
    for (const tabla of tablas) {
      await sequelize.query(`DROP TABLE IF EXISTS "${tabla}" CASCADE`, { transaction: t });
      console.log(`   🗑️  ${tabla}`);
    }
    // Tipos ENUM que solo usaban las tablas antiguas
    const [tipos] = await sequelize.query(`
      SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
        AND t.typname ~ '^enum_(${TABLAS_V3.join('|')})_'`, { transaction: t });
    for (const { typname } of tipos) {
      await sequelize.query(`DROP TYPE IF EXISTS "${typname}"`, { transaction: t });
    }
    await t.commit();
    console.log(`✅ ${tablas.length} tablas antiguas eliminadas.`);
  } catch (err) {
    await t.rollback();
    throw new Error(`No se pudieron borrar las tablas antiguas (no se borró nada): ${err.message}`);
  }
}

// ------------------------------------------------------------------
async function main() {
  await sequelize.authenticate();
  console.log(`Base de datos: ${process.env.DB_NAME} en ${process.env.DB_HOST}`);

  let estado = await diagnosticar();
  titulo('Estado actual');
  console.log(`   Estructura nueva (V4): ${estado.esV4 ? 'sí' : 'no'}`);
  console.log(`   Tablas de la versión anterior: ${estado.v3.map((x) => `${x.tabla} (${x.filas})`).join(', ') || 'ninguna'}`);
  if (estado.legacy.length) console.log(`   Tablas apartadas (_legacy_old_*): ${estado.legacy.length}`);

  if (!estado.esV4 && !estado.v3.length) {
    console.log('\nLa base no tiene datos antiguos ni la estructura nueva. Para una base vacía usa: npm run db:setup');
    return;
  }

  let faltantes = estado.esV4 ? await verificar(estado) : null;
  const necesitaMigrar = !estado.esV4 || faltantes.length > 0;
  const necesitaLimpiar = LIMPIAR && (estado.v3.length || estado.legacy.length);

  if (!necesitaMigrar && !estado.v3.length && !estado.legacy.length) {
    console.log('\n✅ La base ya está actualizada y no tiene tablas antiguas. No hay nada que hacer.');
    return;
  }

  if (necesitaMigrar || necesitaLimpiar) {
    titulo('Respaldo');
    hacerRespaldo();
  }

  if (necesitaMigrar) {
    if (estado.esV4) console.log('\nℹ️  La estructura nueva ya existe pero faltan datos antiguos: se completan.');
    await migrar(estado);
    estado = await diagnosticar();
    faltantes = await verificar(estado);
  }

  titulo('Verificación (cada registro antiguo debe estar en las tablas nuevas)');
  if (faltantes.length) {
    console.table(faltantes);
    console.log(`❌ ${faltantes.length} registro(s) antiguos no están en las tablas nuevas. No se borrará nada.`);
    process.exitCode = 1;
    return;
  }
  console.log('✅ Todos los registros antiguos están en las tablas nuevas.');

  if (LIMPIAR) {
    titulo('Borrando tablas antiguas');
    await limpiar(estado);
  } else if (estado.v3.length || estado.legacy.length) {
    console.log('\nLas tablas antiguas siguen en la base (son las que "flotan" en el diagrama).');
    console.log('Cuando revises que el sistema funciona bien, bórralas con:  npm run db:actualizar -- --limpiar');
  }
}

main()
  .catch((err) => {
    console.error(`\n❌ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
