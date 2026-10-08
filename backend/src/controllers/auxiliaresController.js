const { Op } = require('sequelize');
const Auxiliar = require('../models/Auxiliar');

const getAll = async (req, res) => {
  try {
    const { gestion, semestre, materia, estado, busqueda } = req.query;
    const where = {};
    if (gestion) where.gestion = parseInt(gestion);
    if (semestre) where.semestre = parseInt(semestre);
    if (estado) where.estado = estado;
    if (materia) where.materia = { [Op.iLike]: `%${materia}%` };
    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${busqueda}%` } },
        { materia: { [Op.iLike]: `%${busqueda}%` } },
        { nro_registro: { [Op.iLike]: `%${busqueda}%` } }
      ];
    }
    const auxiliares = await Auxiliar.findAll({
      where,
      order: [['gestion', 'DESC'], ['semestre', 'ASC'], ['nombre', 'ASC']]
    });
    return res.json(auxiliares);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al obtener auxiliares' });
  }
};

const create = async (req, res) => {
  try {
    const { gestion, semestre, nombre, nro_registro, materia, nota_examen, estado, nro_convocatoria, es_ratificacion } = req.body;
    const auxiliar = await Auxiliar.create({
      gestion: parseInt(gestion) || new Date().getFullYear(),
      semestre: parseInt(semestre) || 1,
      nombre,
      nro_registro: nro_registro || null,
      materia,
      nota_examen: nota_examen ? parseFloat(nota_examen) : null,
      estado: estado || 'pendiente',
      nro_convocatoria: nro_convocatoria || null,
      es_ratificacion: es_ratificacion === 'true' || es_ratificacion === true
    });
    return res.status(201).json(auxiliar);
  } catch (err) {
    console.error('Error create auxiliar:', err);
    return res.status(500).json({ mensaje: 'Error al registrar auxiliar', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const auxiliar = await Auxiliar.findByPk(req.params.id);
    if (!auxiliar) return res.status(404).json({ mensaje: 'No encontrado' });
    await auxiliar.update(req.body);
    return res.json(auxiliar);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al actualizar auxiliar' });
  }
};

const remove = async (req, res) => {
  try {
    const auxiliar = await Auxiliar.findByPk(req.params.id);
    if (!auxiliar) return res.status(404).json({ mensaje: 'No encontrado' });
    await auxiliar.destroy();
    return res.json({ mensaje: 'Eliminado exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, create, update, remove };
