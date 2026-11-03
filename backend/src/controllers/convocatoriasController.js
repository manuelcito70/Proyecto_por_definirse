const { Convocatoria, Gestion } = require('../models');
const { getCarreraId } = require('../utils/compatibilityHelpers');

const getAll = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const convocatorias = await Convocatoria.findAll({
      where: { id_carrera },
      include: [{ model: Gestion, as: 'gestion' }],
      order: [
        [{ model: Gestion, as: 'gestion' }, 'anio', 'DESC'],
        ['semestre', 'DESC'],
        ['nro_convocatoria', 'ASC']
      ]
    });

    return res.json(convocatorias.map(c => ({
      id: c.id_convocatoria,
      nro_convocatoria: c.nro_convocatoria,
      gestion: c.gestion?.anio,
      semestre: c.semestre,
      observaciones: c.observaciones
    })));
  } catch (err) {
    console.error('Error getAll convocatorias:', err);
    return res.status(500).json({ mensaje: 'Error al obtener convocatorias' });
  }
};

module.exports = { getAll };
