const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Acta = require('../models/Acta');

const getAll = async (req, res) => {
  try {
    const { gestion, modalidad, busqueda } = req.query;
    const where = {};
    if (gestion) where.gestion = parseInt(gestion);
    if (modalidad) where.modalidad = modalidad;
    if (busqueda) {
      where[Op.or] = [
        { nombre_estudiante: { [Op.iLike]: `%${busqueda}%` } },
        { nro_registro: { [Op.iLike]: `%${busqueda}%` } },
        { nro_acta: { [Op.iLike]: `%${busqueda}%` } },
        { ci: { [Op.iLike]: `%${busqueda}%` } }
      ];
    }
    const actas = await Acta.findAll({
      where,
      order: [['gestion', 'DESC'], ['createdAt', 'DESC']]
    });
    return res.json(actas);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al obtener actas' });
  }
};

const create = async (req, res) => {
  try {
    const { nro_acta, codigo_cpd, nro_registro, nombre_estudiante, ci, modalidad, nota, gestion } = req.body;
    const archivo_path = req.file ? req.file.path : null;
    const nombre_archivo = req.file ? req.file.originalname : null;

    const acta = await Acta.create({
      nro_acta,
      codigo_cpd: codigo_cpd || null,
      nro_registro: nro_registro || null,
      nombre_estudiante,
      ci: ci || null,
      modalidad,
      nota: nota ? parseFloat(nota) : null,
      gestion: parseInt(gestion) || new Date().getFullYear(),
      archivo_path,
      nombre_archivo
    });
    return res.status(201).json(acta);
  } catch (err) {
    console.error('Error create acta:', err);
    return res.status(500).json({ mensaje: 'Error al registrar acta', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const acta = await Acta.findByPk(req.params.id);
    if (!acta) return res.status(404).json({ mensaje: 'Acta no encontrada' });
    await acta.update(req.body);
    return res.json(acta);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al actualizar acta' });
  }
};

const download = async (req, res) => {
  try {
    const acta = await Acta.findByPk(req.params.id);
    if (!acta || !acta.archivo_path) return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    const absPath = path.resolve(acta.archivo_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ mensaje: 'Archivo no existe' });
    return res.download(absPath, acta.nombre_archivo || 'acta.pdf');
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al descargar' });
  }
};

const remove = async (req, res) => {
  try {
    const acta = await Acta.findByPk(req.params.id);
    if (!acta) return res.status(404).json({ mensaje: 'No encontrada' });
    if (acta.archivo_path && fs.existsSync(acta.archivo_path)) fs.unlinkSync(acta.archivo_path);
    await acta.destroy();
    return res.json({ mensaje: 'Eliminada exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, create, update, download, remove };
