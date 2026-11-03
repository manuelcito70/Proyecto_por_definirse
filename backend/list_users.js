require('dotenv').config();
const { sequelize, Usuario, Rol, Carrera } = require('./src/models');

async function listUsers() {
  try {
    await sequelize.authenticate();
    const users = await Usuario.findAll({
      include: [
        { model: Rol, as: 'rol' },
        { model: Carrera, as: 'carrera' }
      ]
    });

    console.log(`\n📋 Encontrados ${users.length} usuarios registrados en SIGAD:`);
    users.forEach(u => {
      console.log(`- Email: ${u.email} | Nombre: ${u.nombre} | Rol: ${u.rol?.nombre} (${u.rol?.cargo}) | Activo: ${u.activo}`);
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error.message);
  } finally {
    await sequelize.close();
  }
}

listUsers();
