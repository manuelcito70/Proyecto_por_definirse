const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Expedido = require('../models/Expedido');

const getAll = async (req, res) => {
  try {
    const { gestion, estado, busqueda } = req.query;
    const where = {};
    if (gestion) where.gestion = parseInt(gestion);
    if (estado) where.estado = estado;
    if (busqueda) {
      where[Op.or] = [
        { destinatario: { [Op.iLike]: `%${busqueda}%` } },
        { asunto: { [Op.iLike]: `%${busqueda}%` } },
        { descripcion: { [Op.iLike]: `%${busqueda}%` } }
      ];
    }
    const expedidos = await Expedido.findAll({
      where,
      order: [['gestion', 'DESC'], ['nro_oficio', 'DESC']]
    });
    return res.json(expedidos);
  } catch (err) {
    console.error('Error getAll expedidos:', err);
    return res.status(500).json({ mensaje: 'Error al obtener expedidos' });
  }
};

const getNextNumber = async (req, res) => {
  try {
    const gestion = parseInt(req.query.gestion) || new Date().getFullYear();
    const last = await Expedido.findOne({
      where: { gestion },
      order: [['nro_oficio', 'DESC']]
    });
    return res.json({ next: last ? last.nro_oficio + 1 : 1, gestion });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al obtener siguiente número' });
  }
};

const create = async (req, res) => {
  try {
    const { destinatario, asunto, descripcion, estado, requiere_respuesta, fecha } = req.body;
    const gestion = req.body.gestion ? parseInt(req.body.gestion) : (fecha ? new Date(fecha).getFullYear() : new Date().getFullYear());

    // Auto-assign nro_oficio
    const last = await Expedido.findOne({ where: { gestion }, order: [['nro_oficio', 'DESC']] });
    const nro_oficio = last ? last.nro_oficio + 1 : 1;

    const archivo_path = req.file ? req.file.path : null;
    const nombre_archivo = req.file ? req.file.originalname : null;

    const expedido = await Expedido.create({
      nro_oficio,
      gestion,
      fecha: fecha || new Date().toISOString().split('T')[0],
      destinatario,
      asunto,
      descripcion: descripcion || null,
      estado: estado || 'pendiente',
      requiere_respuesta: requiere_respuesta === 'true' || requiere_respuesta === true,
      archivo_path,
      nombre_archivo
    });

    return res.status(201).json(expedido);
  } catch (err) {
    console.error('Error create expedido:', err);
    return res.status(500).json({ mensaje: 'Error al crear expedido', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const expedido = await Expedido.findByPk(req.params.id);
    if (!expedido) return res.status(404).json({ mensaje: 'Expedido no encontrado' });
    await expedido.update(req.body);
    return res.json(expedido);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al actualizar expedido' });
  }
};

const download = async (req, res) => {
  try {
    const expedido = await Expedido.findByPk(req.params.id);
    if (!expedido || !expedido.archivo_path) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    }
    const absPath = path.resolve(expedido.archivo_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ mensaje: 'Archivo no existe en disco' });
    return res.download(absPath, expedido.nombre_archivo || 'documento.pdf');
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al descargar archivo' });
  }
};

const remove = async (req, res) => {
  try {
    const expedido = await Expedido.findByPk(req.params.id);
    if (!expedido) return res.status(404).json({ mensaje: 'No encontrado' });
    if (expedido.archivo_path && fs.existsSync(expedido.archivo_path)) {
      fs.unlinkSync(expedido.archivo_path);
    }
    await expedido.destroy();
    return res.json({ mensaje: 'Eliminado exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, getNextNumber, create, update, download, remove };
