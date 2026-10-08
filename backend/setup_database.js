/**
 * Script de configuración inicial de la base de datos SIGAD
 * Sistema de Gestión de Archivos y Documentación - Dirección de Carrera FINI
 * Ejecutar: node setup_database.js
 */
require('dotenv').config();
const { sequelize, User } = require('./src/models');

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    // Recrear todas las tablas
    console.log('\n⏳ Recreando tablas...');
    await sequelize.sync({ force: true });
    console.log('✅ Tablas creadas correctamente');

    // Crear usuario directora inicial
    console.log('\n⏳ Creando usuario inicial...');
    await User.create({
      username: 'directora',
      password_hash: '123456',
      nombre: 'Directora de Carrera',
      cargo: 'Directora'
    });
    console.log('  ✔ Usuario directora creado');

    console.log('\n🎉 ¡BASE DE DATOS SIGAD CONFIGURADA EXITOSAMENTE!');
    console.log('');
    console.log('   Sistema: SIGAD - Dirección de Carrera FINI');
    console.log('   Usuario inicial: directora  →  contraseña: 123456');
    console.log('');
    console.log('   Módulos disponibles:');
    console.log('   📥 Documentos Recibidos');
    console.log('   📤 Documentos Expedidos');
    console.log('   🎓 Actas de Graduación');
    console.log('   👩‍🏫 Auxiliares de Cátedra');
    console.log('   👨‍🏫 Docentes');
    console.log('');
    console.log('   Frontend: http://localhost:5173');
    console.log('   Backend:  http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al configurar la base de datos:');
    console.error(error.message);
    process.exit(1);
  }
}

setupDatabase();
