/**
 * Seed — Pensum completo Ingeniería en Sistemas
 * SIGAD · Dirección de Carrera FINI · UAGRM
 *
 * Uso: node database/seed_materias_sistemas.js
 *
 * - Usa findOrCreate: si la materia ya existe (mismo código + carrera) NO la duplica.
 * - Si el nombre cambió, lo actualiza.
 * - Es seguro correrlo más de una vez.
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { sequelize, Carrera, Materia } = require('../src/models');

// ============================================================
// PENSUM COMPLETO — Ingeniería en Sistemas (FINI · UAGRM)
// ============================================================
const PENSUM = [
  // --- Semestre 1 ---
  { codigo: 'FIS100', nombre: 'Física I',                              semestre: 1 },
  { codigo: 'MAT101', nombre: 'Cálculo I',                             semestre: 1 },
  { codigo: 'INF119', nombre: 'Estructuras Discretas',                 semestre: 1 },
  { codigo: 'INF110', nombre: 'Introducción a la Informática',         semestre: 1 },
  { codigo: 'LIN100', nombre: 'Inglés Técnico I',                      semestre: 1 },

  // --- Semestre 2 ---
  { codigo: 'FIS102', nombre: 'Física II',                             semestre: 2 },
  { codigo: 'MAT102', nombre: 'Cálculo II',                            semestre: 2 },
  { codigo: 'MAT103', nombre: 'Álgebra',                               semestre: 2 },
  { codigo: 'INF120', nombre: 'Programación I',                        semestre: 2 },
  { codigo: 'LIN101', nombre: 'Inglés Técnico II',                     semestre: 2 },

  // --- Semestre 3 ---
  { codigo: 'FIS200', nombre: 'Física III',                            semestre: 3 },
  { codigo: 'MAT207', nombre: 'Ecuaciones Diferenciales',              semestre: 3 },
  { codigo: 'INF210', nombre: 'Programación II',                       semestre: 3 },
  { codigo: 'INF211', nombre: 'Arquitectura de Computadoras',          semestre: 3 },
  { codigo: 'ADM100', nombre: 'Administración',                        semestre: 3 },

  // --- Semestre 4 ---
  { codigo: 'MAT205', nombre: 'Métodos Numéricos',                     semestre: 4 },
  { codigo: 'MAT202', nombre: 'Probabilidad y Estadística I',          semestre: 4 },
  { codigo: 'INF220', nombre: 'Estructura de Datos I',                 semestre: 4 },
  { codigo: 'INF221', nombre: 'Programación en Ensamblador',           semestre: 4 },
  { codigo: 'ADM200', nombre: 'Contabilidad',                          semestre: 4 },

  // --- Semestre 5 ---
  { codigo: 'MAT302', nombre: 'Probabilidad y Estadística II',         semestre: 5 },
  { codigo: 'INF312', nombre: 'Base de Datos I',                       semestre: 5 },
  { codigo: 'INF310', nombre: 'Estructura de Datos II',                semestre: 5 },
  { codigo: 'ECO300', nombre: 'Economía para la Gestión',              semestre: 5 },
  { codigo: 'ADM330', nombre: 'Organización y Métodos',                semestre: 5 },

  // --- Semestre 6 ---
  { codigo: 'MAT329', nombre: 'Investigación Operativa I',             semestre: 6 },
  { codigo: 'INF342', nombre: 'Sistemas de Información I',             semestre: 6 },
  { codigo: 'INF322', nombre: 'Base de Datos II',                      semestre: 6 },
  { codigo: 'INF323', nombre: 'Sistemas Operativos I',                 semestre: 6 },
  { codigo: 'ADM320', nombre: 'Finanzas para la Empresa',              semestre: 6 },

  // --- Semestre 7 ---
  { codigo: 'MAT419', nombre: 'Investigación Operativa II',            semestre: 7 },
  { codigo: 'INF412', nombre: 'Sistemas de Información II',            semestre: 7 },
  { codigo: 'INF432', nombre: 'Soporte a la Toma de Decisiones',       semestre: 7 },
  { codigo: 'INF413', nombre: 'Sistemas Operativos II',                semestre: 7 },
  { codigo: 'INF433', nombre: 'Redes I',                               semestre: 7 },

  // --- Semestre 8 ---
  { codigo: 'ECO449', nombre: 'Preparación y Evaluación de Proyectos', semestre: 8 },
  { codigo: 'INF422', nombre: 'Ingeniería de Software I',              semestre: 8 },
  { codigo: 'IN442',  nombre: 'Sistemas de Información Geográfica',    semestre: 8 },
  { codigo: 'INF462', nombre: 'Auditoría Informática',                 semestre: 8 },
  { codigo: 'INF423', nombre: 'Redes II',                              semestre: 8 },

  // --- Semestre 9 ---
  { codigo: 'INF511', nombre: 'Taller de Grado I',                     semestre: 9 },
  { codigo: 'INF512', nombre: 'Ingeniería de Software II',             semestre: 9 },
  { codigo: 'INF513', nombre: 'Tecnología Web',                        semestre: 9 },
  { codigo: 'INF552', nombre: 'Arquitectura de Software',              semestre: 9 },

  // --- Titulación ---
  { codigo: 'GRL001', nombre: 'Modalidad de Titulación',              semestre: 10 },

  // --- Materias Electivas (semestre 0 = electiva) ---
  { codigo: 'ELC001', nombre: 'Administración de RRHH',                semestre: 0 },
  { codigo: 'ELC002', nombre: 'Costos y Presupuestos',                 semestre: 0 },
  { codigo: 'ELC003', nombre: 'Producción y Marketing',                semestre: 0 },
  { codigo: 'ELC004', nombre: 'Reingeniería',                          semestre: 0 },
  { codigo: 'ELC005', nombre: 'Ingeniería de la Calidad',              semestre: 0 },
  { codigo: 'ELC006', nombre: 'Benchmarking',                          semestre: 0 },
  { codigo: 'ELC007', nombre: 'Introducción a la Macroeconomía',       semestre: 0 },
  { codigo: 'ELC008', nombre: 'Legislación en Ciencias de la Computación', semestre: 0 },
];

async function seedMaterias() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');

    // Buscar o crear la carrera
    const [carrera] = await Carrera.findOrCreate({
      where: { nombre: 'Ingeniería de Sistemas' },
      defaults: { id_carrera: uuidv4(), nombre: 'Ingeniería de Sistemas', activo: true }
    });
    console.log(`📌 Carrera: ${carrera.nombre} (${carrera.id_carrera})\n`);

    let creadas = 0;
    let actualizadas = 0;
    let sinCambios = 0;

    for (const m of PENSUM) {
      const [materia, created] = await Materia.findOrCreate({
        where: { id_carrera: carrera.id_carrera, codigo: m.codigo },
        defaults: {
          id_materia: uuidv4(),
          id_carrera: carrera.id_carrera,
          codigo: m.codigo,
          nombre: m.nombre,
          semestre: m.semestre,
          activo: true
        }
      });

      if (created) {
        console.log(`  ✅ CREADA   [S${String(m.semestre).padStart(2,'0')}] ${m.codigo} — ${m.nombre}`);
        creadas++;
      } else if (materia.nombre !== m.nombre || materia.semestre !== m.semestre) {
        await materia.update({ nombre: m.nombre, semestre: m.semestre });
        console.log(`  🔄 ACTUALIZADA [S${String(m.semestre).padStart(2,'0')}] ${m.codigo} — ${m.nombre}`);
        actualizadas++;
      } else {
        console.log(`  ⏭️  sin cambios [S${String(m.semestre).padStart(2,'0')}] ${m.codigo} — ${m.nombre}`);
        sinCambios++;
      }
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Creadas:     ${creadas}
🔄 Actualizadas: ${actualizadas}
⏭️  Sin cambios: ${sinCambios}
📦 Total:       ${PENSUM.length} materias procesadas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

seedMaterias();
