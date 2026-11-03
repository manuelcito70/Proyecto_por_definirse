/**
 * Script para poblar datos de demostración sobre el modelo normalizado V4
 * SIGAD - Dirección de Carrera FINI UAGRM
 * 
 * Uso: node seed_demo_data.js
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const {
  sequelize,
  Carrera,
  Rol,
  Usuario,
  Gestion,
  Materia,
  DocenteV4,
  DocenteMateria,
  Convocatoria,
  AuxiliarV4,
  DocumentType,
  Document,
  ActaDetalle
} = require('./src/models');

async function seedV4() {
  const t = await sequelize.transaction();
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL para seed V4');

    // 1. Obtener Carrera Base
    const [carrera] = await Carrera.findOrCreate({
      where: { nombre: 'Ingeniería de Sistemas' },
      defaults: { id_carrera: uuidv4(), nombre: 'Ingeniería de Sistemas', activo: true },
      transaction: t
    });

    // 2. Obtener o crear Gestiones
    const gestionesMap = {};
    for (const anio of [2025, 2026, 2027]) {
      const [g] = await Gestion.findOrCreate({
        where: { anio },
        defaults: { id_gestion: uuidv4(), anio },
        transaction: t
      });
      gestionesMap[anio] = g.id_gestion;
    }

    // 3. Tipos de Documento
    const tipoExp = await DocumentType.findOne({ where: { nombre: 'Oficio expedido' }, transaction: t });
    const tipoRec = await DocumentType.findOne({ where: { nombre: 'Oficio recibido' }, transaction: t });
    const tipoActa = await DocumentType.findOne({ where: { nombre: 'Acta de graduación' }, transaction: t });

    // 4. Materias Demo
    const materiasDemo = [
      { codigo: 'SIS-101', nombre: 'Cálculo I', semestre: 1 },
      { codigo: 'SIS-102', nombre: 'Programación I', semestre: 1 },
      { codigo: 'SIS-103', nombre: 'Estructuras Discretas', semestre: 1 },
      { codigo: 'SIS-104', nombre: 'Sistemas Operativos', semestre: 2 },
      { codigo: 'SIS-105', nombre: 'Redes y Telecomunicaciones', semestre: 3 },
      { codigo: 'SIS-106', nombre: 'Ingeniería de Software', semestre: 4 }
    ];
    const materiasMap = {};
    for (const m of materiasDemo) {
      const [mat] = await Materia.findOrCreate({
        where: { id_carrera: carrera.id_carrera, nombre: m.nombre },
        defaults: { id_materia: uuidv4(), id_carrera: carrera.id_carrera, codigo: m.codigo, nombre: m.nombre, semestre: m.semestre, activo: true },
        transaction: t
      });
      materiasMap[m.nombre] = mat.id_materia;
    }

    // 5. Convocatorias Demo
    const [conv2026_1] = await Convocatoria.findOrCreate({
      where: { id_carrera: carrera.id_carrera, nro_convocatoria: 'CONV-01/2026', semestre: 1 },
      defaults: {
        id_convocatoria: uuidv4(),
        id_carrera: carrera.id_carrera,
        id_gestion: gestionesMap[2026],
        nro_convocatoria: 'CONV-01/2026',
        semestre: 1,
        observaciones: 'Convocatoria Semestre 1/2026'
      },
      transaction: t
    });

    const [conv2026_2] = await Convocatoria.findOrCreate({
      where: { id_carrera: carrera.id_carrera, nro_convocatoria: 'CONV-02/2026', semestre: 2 },
      defaults: {
        id_convocatoria: uuidv4(),
        id_carrera: carrera.id_carrera,
        id_gestion: gestionesMap[2026],
        nro_convocatoria: 'CONV-02/2026',
        semestre: 2,
        observaciones: 'Convocatoria Semestre 2/2026'
      },
      transaction: t
    });

    // 6. Expedidos Demo (Documentos con tipo Oficio expedido)
    if (tipoExp) {
      const expedidosCount = await Document.count({ where: { id_tipo_documento: tipoExp.id_tipo_documento }, transaction: t });
      if (expedidosCount === 0) {
        console.log('🌱 Sembrando Expedidos Demo...');
        const expList = [
          { nro: '107', correlativo: 107, anio: 2026, fecha: '2026-02-15', dest: 'CPD', asunto: 'Solicitud de documentación académica', est: 'completado', req: false },
          { nro: '108', correlativo: 108, anio: 2026, fecha: '2026-02-20', dest: 'Decanato', asunto: 'Remisión de informe de cátedra', est: 'pendiente', req: true },
          { nro: '109', correlativo: 109, anio: 2026, fecha: '2026-02-28', dest: 'Consejo Facultativo', asunto: 'Ratificación de auxiliar de cátedra', est: 'completado', req: false }
        ];
        for (const e of expList) {
          await Document.create({
            id_documento: uuidv4(),
            id_carrera: carrera.id_carrera,
            id_tipo_documento: tipoExp.id_tipo_documento,
            id_gestion: gestionesMap[e.anio],
            nro_documento: e.nro,
            correlativo: e.correlativo,
            fecha_documento: e.fecha,
            destinatario: e.dest,
            asunto: e.asunto,
            descripcion: 'Registro oficial de correspondencia de Dirección de Carrera.',
            estado: e.est,
            requiere_respuesta: e.req
          }, { transaction: t });
        }
      }
    }

    // 7. Recibidos Demo (Documentos con tipo Oficio recibido)
    if (tipoRec) {
      const recibidosCount = await Document.count({ where: { id_tipo_documento: tipoRec.id_tipo_documento }, transaction: t });
      if (recibidosCount === 0) {
        console.log('🌱 Sembrando Recibidos Demo...');
        const recList = [
          { nro: '9', correlativo: 9, anio: 2026, fecha: '2026-01-20', rem: 'Decanato', asunto: 'Comunicación institucional y circular de inicio de gestión', est: 'completado', resp: 'para_conocimiento' },
          { nro: '10', correlativo: 10, anio: 2026, fecha: '2026-01-28', rem: 'Consejo Facultativo', asunto: 'Respuesta a solicitud de licencia docente', est: 'completado', resp: 'para_conocimiento' },
          { nro: '13', correlativo: 13, anio: 2026, fecha: '2026-03-01', rem: 'Decanato', asunto: 'Solicitud de informe trimestral', est: 'pendiente', resp: 'requiere_respuesta' }
        ];
        for (const r of recList) {
          await Document.create({
            id_documento: uuidv4(),
            id_carrera: carrera.id_carrera,
            id_tipo_documento: tipoRec.id_tipo_documento,
            id_gestion: gestionesMap[r.anio],
            nro_documento: r.nro,
            correlativo: r.correlativo,
            fecha_documento: r.fecha,
            remitente: r.rem,
            asunto: r.asunto,
            descripcion: 'Oficio ingresado a Dirección de Carrera.',
            estado: r.est,
            tipo_respuesta: r.resp,
            requiere_respuesta: r.resp === 'requiere_respuesta'
          }, { transaction: t });
        }
      }
    }

    // 8. Actas Demo
    if (tipoActa) {
      const actasCount = await Document.count({ where: { id_tipo_documento: tipoActa.id_tipo_documento }, transaction: t });
      if (actasCount === 0) {
        console.log('🌱 Sembrando Actas Demo con actas_detalles...');
        const actasList = [
          { nro: '081', cpd: 'CPD-EJ-081', reg: 'EJ-20435', est: 'Carlos Eduardo Peña Soto', ci: '6381920', mod: 'trabajo_dirigido', nota: 90.0 },
          { nro: '082', cpd: 'CPD-EJ-082', reg: 'EJ-20431', est: 'Lucia Isabel Mendoza Rios', ci: '9283741', mod: 'excelencia', nota: 98.0 }
        ];
        for (const a of actasList) {
          const docId = uuidv4();
          await Document.create({
            id_documento: docId,
            id_carrera: carrera.id_carrera,
            id_tipo_documento: tipoActa.id_tipo_documento,
            id_gestion: gestionesMap[2026],
            nro_documento: a.nro,
            fecha_documento: '2026-03-15',
            asunto: `Acta de Grado - ${a.est}`,
            descripcion: `Defensa de grado modalidad ${a.mod}. Nota: ${a.nota}`,
            estado: 'completado'
          }, { transaction: t });

          await ActaDetalle.create({
            id_documento: docId,
            codigo_cpd: a.cpd,
            nro_registro: a.reg,
            nombre_estudiante: a.est,
            ci: a.ci,
            modalidad: a.mod,
            nota: a.nota
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    console.log('🎉 Seed V4 ejecutado exitosamente sin duplicados.');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('❌ Error en seed_demo_data V4:', err);
    process.exit(1);
  }
}

seedV4();
