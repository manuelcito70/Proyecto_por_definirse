const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Docente = require('../models/Docente');
const DocenteArchivo = require('../models/DocenteArchivo');

const getAll = async (req, res) => {
  try {
    const { busqueda, activo } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${busqueda}%` } },
        { materia_principal: { [Op.iLike]: `%${busqueda}%` } }
      ];
    }
    const docentes = await Docente.findAll({ where, order: [['nombre', 'ASC']] });
    return res.json(docentes);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al obtener docentes' });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, ci, materia_principal, gestion_ingreso } = req.body;
    const docente = await Docente.create({
      nombre,
      ci: ci || null,
      materia_principal: materia_principal || null,
      gestion_ingreso: gestion_ingreso ? parseInt(gestion_ingreso) : new Date().getFullYear(),
      activo: true
    });
    return res.status(201).json(docente);
  } catch (err) {
    console.error('Error create docente:', err);
    return res.status(500).json({ mensaje: 'Error al registrar docente', error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const docente = await Docente.findByPk(req.params.id);
    if (!docente) return res.status(404).json({ mensaje: 'No encontrado' });
    await docente.update(req.body);
    return res.json(docente);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al actualizar docente' });
  }
};

// ── Archivos del Docente ──

const getArchivos = async (req, res) => {
  try {
    const { gestion, semestre, tipo } = req.query;
    const where = { id_docente: req.params.id };
    if (gestion) where.gestion = parseInt(gestion);
    if (semestre) where.semestre = parseInt(semestre);
    if (tipo) where.tipo = tipo;
    const archivos = await DocenteArchivo.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json(archivos);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al obtener archivos' });
  }
};

const uploadArchivo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
    const { tipo, gestion, semestre } = req.body;
    const archivo = await DocenteArchivo.create({
      id_docente: parseInt(req.params.id),
      tipo: tipo || 'otro',
      gestion: gestion ? parseInt(gestion) : new Date().getFullYear(),
      semestre: semestre ? parseInt(semestre) : null,
      archivo_path: req.file.path,
      nombre_original: req.file.originalname
    });
    return res.status(201).json(archivo);
  } catch (err) {
    console.error('Error upload archivo docente:', err);
    return res.status(500).json({ mensaje: 'Error al subir archivo', error: err.message });
  }
};

const downloadArchivo = async (req, res) => {
  try {
    const archivo = await DocenteArchivo.findByPk(req.params.archivoId);
    if (!archivo) return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    const absPath = path.resolve(archivo.archivo_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ mensaje: 'Archivo no existe en disco' });
    return res.download(absPath, archivo.nombre_original || 'documento.pdf');
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al descargar' });
  }
};

const deleteArchivo = async (req, res) => {
  try {
    const archivo = await DocenteArchivo.findByPk(req.params.archivoId);
    if (!archivo) return res.status(404).json({ mensaje: 'No encontrado' });
    if (fs.existsSync(archivo.archivo_path)) fs.unlinkSync(archivo.archivo_path);
    await archivo.destroy();
    return res.json({ mensaje: 'Archivo eliminado' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar archivo' });
  }
};

module.exports = { getAll, create, update, getArchivos, uploadArchivo, downloadArchivo, deleteArchivo };
