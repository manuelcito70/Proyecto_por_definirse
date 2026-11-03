const { Materia } = require('../models');
const { getCarreraId } = require('../utils/compatibilityHelpers');

const getAll = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const materias = await Materia.findAll({
      where: { id_carrera, activo: true },
      order: [
        ['semestre', 'ASC'],
        ['nombre', 'ASC']
      ]
    });

    return res.json(materias.map(m => ({
      id: m.id_materia,
      sigla: m.codigo,
      codigo: m.codigo,
      nombre: m.nombre,
      semestre: m.semestre
    })));
  } catch (err) {
    console.error('Error getAll materias:', err);
    return res.status(500).json({ mensaje: 'Error al obtener materias' });
  }
};

module.exports = { getAll };
