/**
 * Seed — Carreras FINI · UAGRM
 *
 * Uso: node database/seed_carreras.js
 *
 * - Usa findOrCreate: si la carrera ya existe NO la duplica.
 * - Mantiene "Ingeniería de Sistemas" existente para conservar relaciones.
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { sequelize, Carrera } = require('../src/models');

const CARRERAS = [
  'Ingeniería Agropecuaria',
  'Ciencias de la Educación',
  'Administración de Empresas',
  'Enfermería',
  'Ingeniería Comercial',
  'Ingeniería de Sistemas',
  'Medicina Veterinaria y Zootecnia',
  'Ingeniería Industrial',
  'Ingeniería Informática',
  'Ingeniería en Redes y Telecomunicaciones',
  'Ingeniería Financiera',
  'Contaduría Pública'
];

async function seedCarreras() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');

    let creadas = 0;
    let existentes = 0;

    for (const nombre of CARRERAS) {
      // Evitar duplicar Ingeniería de/en Sistemas si ya existe una variante
      const whereClause =
        nombre === 'Ingeniería de Sistemas'
          ? { nombre: { [Op.iLike]: '%Sistemas%' } }
          : { nombre: { [Op.iLike]: nombre } };

      const existente = await Carrera.findOne({ where: whereClause });
      if (existente) {
        console.log(`  ⏭️  Ya existe: ${existente.nombre}`);
        existentes++;
      } else {
        await Carrera.create({
          id_carrera: uuidv4(),
          nombre,
          activo: true
        });
        console.log(`  ✅ CREADA:    ${nombre}`);
        creadas++;
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Creadas:    ${creadas}`);
    console.log(`⏭️  Existentes: ${existentes}`);
    console.log(`📦 Total:      ${CARRERAS.length} carreras`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedCarreras();
