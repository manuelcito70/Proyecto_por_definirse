require('dotenv').config();
const sequelize = require('./src/config/database');
const { Expedido, Recibido, Acta, Auxiliar, Docente, DocenteArchivo, User } = require('./src/models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la BD para seed');

    // 1. Actualizar enum si es necesario
    try {
      await sequelize.query("ALTER TYPE \"enum_Actas_modalidad\" ADD VALUE IF NOT EXISTS 'proyecto_grado';");
      await sequelize.query("ALTER TYPE \"enum_Actas_modalidad\" ADD VALUE IF NOT EXISTS 'titulacion_continua';");
      console.log('✅ Enum modalidades actualizado');
    } catch (e) {
      console.log('ℹ️ Nota sobre enum:', e.message);
    }

    // 2. Limpiar tablas transaccionales de demo si estaban vacías
    const countExp = await Expedido.count();
    if (countExp === 0) {
      console.log('🌱 Poblando Expedidos...');
      await Expedido.bulkCreate([
        { nro_oficio: 107, gestion: 2026, fecha: '2026-02-15', destinatario: 'CPD', asunto: 'Solicitud de documentación académica', descripcion: 'Oficio de requerimiento documental institucional.', estado: 'completado' },
        { nro_oficio: 108, gestion: 2026, fecha: '2026-02-20', destinatario: 'Decanato', asunto: 'Remisión de informe de cátedra', descripcion: 'Envío de informes de avance de semestre.', estado: 'pendiente' },
        { nro_oficio: 109, gestion: 2026, fecha: '2026-02-28', destinatario: 'Consejo Facultativo', asunto: 'Ratificación de auxiliar de cátedra', descripcion: 'Ratificación para el segundo semestre.', estado: 'completado' },
        { nro_oficio: 110, gestion: 2026, fecha: '2026-03-05', destinatario: 'Consejo Facultativo', asunto: 'Licencia docente', descripcion: 'Espera de tratamiento y resolución en Consejo Facultativo.', estado: 'en_curso' },
        { nro_oficio: 111, gestion: 2026, fecha: '2026-03-10', destinatario: 'CPD', asunto: 'Acta de graduación', descripcion: 'Último oficio expedido confirmado con nuevo formato de membrete.', estado: 'completado' },
        // Gestión 2025
        { nro_oficio: 95, gestion: 2025, fecha: '2025-11-15', destinatario: 'Consejo de Carrera', asunto: 'Convocatoria a auxiliares 2º semestre 2025', descripcion: 'Propuesta de materias y cupos.', estado: 'completado' },
        { nro_oficio: 96, gestion: 2025, fecha: '2025-12-20', destinatario: 'Decanato', asunto: 'Cierre de gestión y balance de oficios 2025', descripcion: 'Informe anual de correspondencia de Dirección.', estado: 'completado' }
      ]);
    }

    const countRec = await Recibido.count();
    if (countRec === 0) {
      console.log('🌱 Poblando Recibidos...');
      await Recibido.bulkCreate([
        { nro_recibido: 9, gestion: 2026, fecha: '2026-01-20', remitente: 'Decanato', asunto: 'Comunicación institucional y circular de inicio de gestión', estado: 'completado', tipo_respuesta: 'para_conocimiento' },
        { nro_recibido: 10, gestion: 2026, fecha: '2026-01-28', remitente: 'Consejo Facultativo', asunto: 'Respuesta a solicitud de licencia docente', estado: 'completado', tipo_respuesta: 'para_conocimiento' },
        { nro_recibido: 11, gestion: 2026, fecha: '2026-02-04', remitente: 'Secretaría Facultativa', asunto: 'Invitación a acto cívico y reunión de coordinación', estado: 'completado', tipo_respuesta: 'para_conocimiento' },
        { nro_recibido: 12, gestion: 2026, fecha: '2026-02-12', remitente: 'CPD', asunto: 'Entrega de documentos de auxiliares aprobados', estado: 'completado', tipo_respuesta: 'para_conocimiento' },
        { nro_recibido: 13, gestion: 2026, fecha: '2026-03-01', remitente: 'Decanato', asunto: 'Solicitud de informe de actividades académicas trimestral', estado: 'pendiente', tipo_respuesta: 'requiere_respuesta' },
        { nro_recibido: 14, gestion: 2026, fecha: '2026-03-08', remitente: 'Consejo Facultativo', asunto: 'Aprobación de propuesta de convocatoria de auxiliares', estado: 'en_curso', tipo_respuesta: 'requiere_respuesta' }
      ]);
    }

    const countActas = await Acta.count();
    if (countActas === 0) {
      console.log('🌱 Poblando Actas...');
      await Acta.bulkCreate([
        { nro_acta: '081', codigo_cpd: 'CPD-EJ-081', nro_registro: 'EJ-20435', nombre_estudiante: 'Carlos Eduardo Peña Soto', ci: '6381920', modalidad: 'trabajo_dirigido', nota: 90.0, gestion: 2026 },
        { nro_acta: '082', codigo_cpd: 'CPD-EJ-082', nro_registro: 'EJ-20431', nombre_estudiante: 'Lucia Isabel Mendoza Rios', ci: '9283741', modalidad: 'excelencia', nota: 98.0, gestion: 2026 },
        { nro_acta: '083', codigo_cpd: 'CPD-EJ-083', nro_registro: 'EJ-20422', nombre_estudiante: 'Diego Andrés Vargas Flores', ci: '7261944', modalidad: 'proyecto_grado', nota: 88.0, gestion: 2026 },
        { nro_acta: '084', codigo_cpd: 'CPD-EJ-084', nro_registro: 'EJ-20418', nombre_estudiante: 'Maria Fernanda Rojas Pérez', ci: '8472910', modalidad: 'tesis', nota: 95.0, gestion: 2026 }
      ]);
    }

    const countAux = await Auxiliar.count();
    if (countAux === 0) {
      console.log('🌱 Poblando Auxiliares...');
      await Auxiliar.bulkCreate([
        { gestion: 2026, semestre: 1, nombre: 'Victor Daniel Guayao', nro_registro: '219045812', materia: 'Estructuras Discretas', nota_examen: 85.5, estado: 'aprobado', nro_convocatoria: 'CONV-01/2026', es_ratificacion: false },
        { gestion: 2026, semestre: 1, nombre: 'Mario Choque Quispe', nro_registro: '218092144', materia: 'Cálculo I', nota_examen: 78.0, estado: 'aprobado', nro_convocatoria: 'CONV-01/2026', es_ratificacion: false },
        { gestion: 2026, semestre: 1, nombre: 'Andrea Silvestre Paz', nro_registro: '220038471', materia: 'Programación I', nota_examen: 92.0, estado: 'aprobado', nro_convocatoria: 'CONV-01/2026', es_ratificacion: false },
        { gestion: 2025, semestre: 2, nombre: 'Lucas Morales Justiniano', nro_registro: '217039281', materia: 'Sistemas Operativos', nota_examen: 88.0, estado: 'aprobado', nro_convocatoria: 'CONV-02/2025', es_ratificacion: true }
      ]);
    }

    const countDoc = await Docente.count();
    if (countDoc === 0) {
      console.log('🌱 Poblando Docentes...');
      const d1 = await Docente.create({
        nombre: 'Mario Renato Chocala',
        ci: '4829102',
        materia_principal: 'Sistemas de Información',
        gestion_ingreso: 2020,
        activo: true
      });
      const d2 = await Docente.create({
        nombre: 'Alicia Serrano Rodríguez',
        ci: '3928174',
        materia_principal: 'Ingeniería de Software',
        gestion_ingreso: 2018,
        activo: true
      });
      const d3 = await Docente.create({
        nombre: 'Juan Carlos Morales',
        ci: '5192834',
        materia_principal: 'Redes y Telecomunicaciones',
        gestion_ingreso: 2021,
        activo: true
      });

      await DocenteArchivo.bulkCreate([
        { id_docente: d1.id, tipo: 'curriculum', gestion: 2026, semestre: null, archivo_path: 'uploads/docentes/cv_mario_chocala.pdf', nombre_original: 'CV_Mario_Chocala.pdf' },
        { id_docente: d1.id, tipo: 'informe_final', gestion: 2025, semestre: 2, archivo_path: 'uploads/docentes/informe_catedra.pdf', nombre_original: 'informe_catedra.pdf' },
        { id_docente: d1.id, tipo: 'lista_asistencia', gestion: 2026, semestre: 1, archivo_path: 'uploads/docentes/asistencia.pdf', nombre_original: 'asistencia.pdf' },
        { id_docente: d1.id, tipo: 'programa_analitico', gestion: 2026, semestre: 1, archivo_path: 'uploads/docentes/programa_analitico.pdf', nombre_original: 'programa_analitico.pdf' }
      ]);
    }

    console.log('🎉 Seed completado exitosamente con datos reales de la entrevista.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
