/**
 * Script de inicialización de Base de Datos SIGAD V4 (Desarrollo / Testing)
 * Dirección de Carrera FINI - UAGRM
 * 
 * Uso: node setup_database.js
 * ADVERTENCIA: Solo para desarrollo local. No usar en producción.
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
  FaseProceso,
  Convocatoria,
  ConvocatoriaFase,
  AuxiliarV4,
  DocumentType,
  Document,
  ActaDetalle,
  DocumentAttachment
} = require('./src/models');

async function setupDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.error('\n❌ ERROR CRÍTICO DE SEGURIDAD:');
    console.error('   setup_database.js no puede ejecutarse en NODE_ENV=production.');
    console.error('   Para migraciones de producción use DATABASE_URL y scripts idempotentes.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida con PostgreSQL:', process.env.DB_NAME || 'sistema_documentos');

    console.log('\n⏳ Sincronizando modelos V4 normalizados...');
    // Sincronizar solo los modelos V4 sin borrar tablas legadas
    await Carrera.sync({ alter: true });
    await Rol.sync({ alter: true });
    await Usuario.sync({ alter: true });
    await Gestion.sync({ alter: true });
    await Materia.sync({ alter: true });
    await DocenteV4.sync({ alter: true });
    await DocenteMateria.sync({ alter: true });
    await FaseProceso.sync({ alter: true });
    await Convocatoria.sync({ alter: true });
    await ConvocatoriaFase.sync({ alter: true });
    await AuxiliarV4.sync({ alter: true });
    await DocumentType.sync({ alter: true });
    await Document.sync({ alter: true });
    await ActaDetalle.sync({ alter: true });
    await DocumentAttachment.sync({ alter: true });
    console.log('✅ Modelos V4 sincronizados correctamente.');

    // 1. Carrera por defecto
    const [carrera] = await Carrera.findOrCreate({
      where: { nombre: 'Ingeniería de Sistemas' },
      defaults: {
        id_carrera: uuidv4(),
        nombre: 'Ingeniería de Sistemas',
        activo: true
      }
    });

    // 2. Roles
    const rolesList = [
      { nombre: 'superadmin', cargo: 'Director de carrera', descripcion: 'Acceso total administrativo' },
      { nombre: 'director', cargo: 'Directora', descripcion: 'Dirección de Carrera' },
      { nombre: 'admin', cargo: 'Secretaria', descripcion: 'Secretaría de Dirección de Carrera' },
      { nombre: 'secretaria', cargo: 'Secretaria', descripcion: 'Secretaría de Dirección' },
      { nombre: 'docente', cargo: 'Docente', descripcion: 'Docente de la Carrera' },
      { nombre: 'auxiliar', cargo: 'Auxiliar', descripcion: 'Auxiliar de Cátedra' }
    ];
    let superadminRol = null;
    for (const r of rolesList) {
      const [rol] = await Rol.findOrCreate({
        where: { nombre: r.nombre },
        defaults: { id_rol: uuidv4(), nombre: r.nombre, cargo: r.cargo, descripcion: r.descripcion }
      });
      if (r.nombre === 'superadmin') superadminRol = rol;
    }

    // 3. Fases del Proceso de Convocatorias
    const fases = [
      { orden: 1, nombre: 'Propuesta de materia' },
      { orden: 2, nombre: 'Consejo facultativo' },
      { orden: 3, nombre: 'Convocatoria' },
      { orden: 4, nombre: 'Evaluación y selección' }
    ];
    for (const f of fases) {
      await FaseProceso.findOrCreate({
        where: { nombre: f.nombre },
        defaults: { id_fase: uuidv4(), orden: f.orden, nombre: f.nombre }
      });
    }

    // 4. Tipos de Documento Oficiales
    const docTypes = [
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
    for (const dt of docTypes) {
      await DocumentType.findOrCreate({
        where: { nombre: dt.nombre },
        defaults: { id_tipo_documento: uuidv4(), nombre: dt.nombre, descripcion: dt.descripcion }
      });
    }

    // 5. Gestiones básicas
    const currentYear = new Date().getFullYear();
    for (const anio of [currentYear - 1, currentYear, currentYear + 1]) {
      await Gestion.findOrCreate({
        where: { anio },
        defaults: { id_gestion: uuidv4(), anio }
      });
    }

    // 6. Usuario inicial Directora (superadmin)
    const [userDirectora] = await Usuario.findOrCreate({
      where: { email: 'directora@uagrm.edu.bo' },
      defaults: {
        id_usuario: uuidv4(),
        email: 'directora@uagrm.edu.bo',
        password_hash: '1234',
        nombre: 'Directora de Carrera',
        id_rol: superadminRol.id_rol,
        id_carrera: carrera.id_carrera,
        activo: true
      }
    });

    console.log('\n🎉 ¡BASE DE DATOS V4 INICIALIZADA EXITOSAMENTE!');
    console.log('   Carrera base:', carrera.nombre);
    console.log('   Usuario principal:', userDirectora.email, '· Clave: 1234');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en setup_database:', error);
    process.exit(1);
  }
}

setupDatabase();
