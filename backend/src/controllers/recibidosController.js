const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Recibido = require('../models/Recibido');

const getAll = async (req, res) => {
  try {
    const { gestion, estado, busqueda } = req.query;
    const where = {};
    if (gestion) where.gestion = parseInt(gestion);
    if (estado) where.estado = estado;
    if (busqueda) {
      where[Op.or] = [
        { remitente: { [Op.iLike]: `%${busqueda}%` } },
        { asunto: { [Op.iLike]: `%${busqueda}%` } }
      ];
    }
    const recibidos = await Recibido.findAll({
      where,
      order: [['gestion', 'DESC'], ['nro_recibido', 'DESC']]
    });
    return res.json(recibidos);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al obtener recibidos' });
  }
};

const create = async (req, res) => {
  try {
    const { remitente, asunto, descripcion, estado, tipo_respuesta, fecha } = req.body;
    const gestion = req.body.gestion ? parseInt(req.body.gestion) : (fecha ? new Date(fecha).getFullYear() : new Date().getFullYear());
    const last = await Recibido.findOne({ where: { gestion }, order: [['nro_recibido', 'DESC']] });
    const nro_recibido = last ? last.nro_recibido + 1 : 1;
    const archivo_path = req.file ? req.file.path : null;
    const nombre_archivo = req.file ? req.file.originalname : null;

    const recibido = await Recibido.create({
      nro_recibido,
      gestion,
      fecha: fecha || new Date().toISOString().split('T')[0],
      remitente,
      asunto,
      descripcion: descripcion || null,
      estado: estado || 'pendiente',
      tipo_respuesta: tipo_respuesta || 'para_conocimiento',
      archivo_path,
      nombre_archivo
    });
    return res.status(201).json(recibido);
  } catch (err) {
    console.error('Error create recibido:', err);
    return res.status(500).json({ mensaje: 'Error al crear recibido', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const recibido = await Recibido.findByPk(req.params.id);
    if (!recibido) return res.status(404).json({ mensaje: 'No encontrado' });
    await recibido.update(req.body);
    return res.json(recibido);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al actualizar recibido' });
  }
};

const download = async (req, res) => {
  try {
    const recibido = await Recibido.findByPk(req.params.id);
    if (!recibido || !recibido.archivo_path) return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    const absPath = path.resolve(recibido.archivo_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ mensaje: 'Archivo no existe en disco' });
    return res.download(absPath, recibido.nombre_archivo || 'documento.pdf');
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al descargar' });
  }
};

const remove = async (req, res) => {
  try {
    const recibido = await Recibido.findByPk(req.params.id);
    if (!recibido) return res.status(404).json({ mensaje: 'No encontrado' });
    if (recibido.archivo_path && fs.existsSync(recibido.archivo_path)) {
      fs.unlinkSync(recibido.archivo_path);
    }
    await recibido.destroy();
    return res.json({ mensaje: 'Eliminado exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, create, update, download, remove };
