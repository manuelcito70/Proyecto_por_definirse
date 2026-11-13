const { Op } = require('sequelize');
const { esErrorDeValidacion, responderValidacion } = require('../utils/errores');
const { v4: uuidv4 } = require('uuid');
const {
  sequelize,
  AuxiliarV4,
  Convocatoria,
  Materia,
  Gestion
} = require('../models');
const {
  getCarreraId,
  getGestionByAnio,
  formatAuxiliar
} = require('../utils/compatibilityHelpers');

const getAll = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const { gestion, semestre, materia, estado, busqueda } = req.query || {};

    const convWhere = { id_carrera };
    if (semestre) convWhere.semestre = parseInt(semestre, 10);

    const gestionInclude = {
      model: Gestion,
      as: 'gestion'
    };
    if (gestion) {
      gestionInclude.where = { anio: parseInt(gestion, 10) };
    }

    const materiaWhere = {};
    if (materia) {
      materiaWhere.nombre = { [Op.iLike]: `%${materia}%` };
    }

    const auxWhere = {};
    if (estado) auxWhere.estado = estado;

    if (busqueda) {
      auxWhere[Op.or] = [
        { nombre: { [Op.iLike]: `%${busqueda}%` } },
        { nro_registro: { [Op.iLike]: `%${busqueda}%` } },
        { '$materia.nombre$': { [Op.iLike]: `%${busqueda}%` } }
      ];
    }

    const auxiliares = await AuxiliarV4.findAll({
      where: auxWhere,
      include: [
        {
          model: Convocatoria,
          as: 'convocatoria',
          where: convWhere,
          required: true,
          include: [gestionInclude]
        },
        {
          model: Materia,
          as: 'materia',
          where: Object.keys(materiaWhere).length > 0 ? materiaWhere : undefined,
          required: true
        }
      ],
      order: [
        [{ model: Convocatoria, as: 'convocatoria' }, { model: Gestion, as: 'gestion' }, 'anio', 'DESC'],
        [{ model: Convocatoria, as: 'convocatoria' }, 'semestre', 'ASC'],
        ['nombre', 'ASC']
      ]
    });

    return res.json(auxiliares.map(formatAuxiliar));
  } catch (err) {
    console.error('Error getAll auxiliares:', err);
    return res.status(500).json({ mensaje: 'Error al obtener auxiliares' });
  }
};

const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const {
      gestion,
      semestre,
      nombre,
      nro_registro,
      materia,
      nota_examen,
      estado,
      nro_convocatoria,
      es_ratificacion
    } = req.body;

    const anio = parseInt(gestion, 10) || new Date().getFullYear();
    const gest = await getGestionByAnio(anio, t);
    const sem = semestre && (parseInt(semestre, 10) === 2) ? 2 : 1;
    const nroConv = (nro_convocatoria && nro_convocatoria.trim()) ? nro_convocatoria.trim() : 'CONV-S/N';

    // 1. Obtener o crear Convocatoria
    const [conv] = await Convocatoria.findOrCreate({
      where: {
        id_carrera,
        id_gestion: gest.id_gestion,
        nro_convocatoria: nroConv,
        semestre: sem
      },
      defaults: {
        id_convocatoria: uuidv4(),
        id_carrera,
        id_gestion: gest.id_gestion,
        nro_convocatoria: nroConv,
        semestre: sem,
        observaciones: 'Creada automáticamente desde módulo de auxiliares'
      },
      transaction: t
    });

    // 2. Obtener o crear Materia
    const nombreMat = (materia || 'Materia General').trim();
    let mat = await Materia.findOne({
      where: { id_carrera, nombre: { [Op.iLike]: nombreMat } },
      transaction: t
    });

    if (!mat) {
      const codRand = `SIS-${Math.floor(100 + Math.random() * 899)}`;
      mat = await Materia.create({
        id_materia: uuidv4(),
        id_carrera,
        codigo: codRand,
        nombre: nombreMat,
        semestre: sem,
        activo: true
      }, { transaction: t });
    }

    // 3. Crear Auxiliar
    const auxiliar = await AuxiliarV4.create({
      id_auxiliar: uuidv4(),
      id_convocatoria: conv.id_convocatoria,
      id_materia: mat.id_materia,
      nro_registro: nro_registro || 'S/R',
      nombre,
      nota_examen: nota_examen ? parseFloat(nota_examen) : null,
      estado: estado || 'pendiente',
      es_ratificacion: es_ratificacion === 'true' || es_ratificacion === true
    }, { transaction: t });

    await t.commit();

    const createdAux = await AuxiliarV4.findByPk(auxiliar.id_auxiliar, {
      include: [
        {
          model: Convocatoria,
          as: 'convocatoria',
          include: [{ model: Gestion, as: 'gestion' }]
        },
        { model: Materia, as: 'materia' }
      ]
    });

    return res.status(201).json(formatAuxiliar(createdAux));
  } catch (err) {
    await t.rollback();
    if (esErrorDeValidacion(err)) return responderValidacion(res, err);
    console.error('Error create auxiliar:', err);
    return res.status(500).json({ mensaje: 'Error al registrar auxiliar', error: err.message });
  }
};

const update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const auxiliar = await AuxiliarV4.findByPk(req.params.id, {
      include: [
        {
          model: Convocatoria,
          as: 'convocatoria',
          include: [{ model: Gestion, as: 'gestion' }]
        },
        { model: Materia, as: 'materia' }
      ],
      transaction: t
    });

    if (!auxiliar) {
      await t.rollback();
      return res.status(404).json({ mensaje: 'No encontrado' });
    }

    const auxUpdates = {};
    if (req.body.nombre !== undefined) auxUpdates.nombre = req.body.nombre;
    if (req.body.nro_registro !== undefined) auxUpdates.nro_registro = req.body.nro_registro;
    if (req.body.nota_examen !== undefined) {
      auxUpdates.nota_examen = req.body.nota_examen ? parseFloat(req.body.nota_examen) : null;
    }
    if (req.body.estado !== undefined) auxUpdates.estado = req.body.estado;
    if (req.body.es_ratificacion !== undefined) {
      auxUpdates.es_ratificacion = req.body.es_ratificacion === 'true' || req.body.es_ratificacion === true;
    }

    // Actualizar Materia si cambió
    if (req.body.materia && req.body.materia.trim()) {
      const nombreMat = req.body.materia.trim();
      let mat = await Materia.findOne({
        where: { id_carrera, nombre: { [Op.iLike]: nombreMat } },
        transaction: t
      });
      if (!mat) {
        const codRand = `SIS-${Math.floor(100 + Math.random() * 899)}`;
        mat = await Materia.create({
          id_materia: uuidv4(),
          id_carrera,
          codigo: codRand,
          nombre: nombreMat,
          semestre: 1,
          activo: true
        }, { transaction: t });
      }
      auxUpdates.id_materia = mat.id_materia;
    }

    // Actualizar Convocatoria si cambió gestión, semestre o nro_convocatoria
    const anioActual = auxiliar.convocatoria?.gestion?.anio;
    const semActual = auxiliar.convocatoria?.semestre;
    const nroConvActual = auxiliar.convocatoria?.nro_convocatoria;

    const nuevoAnio = req.body.gestion ? parseInt(req.body.gestion, 10) : anioActual;
    const nuevoSem = req.body.semestre ? parseInt(req.body.semestre, 10) : semActual;
    const nuevoNroConv = req.body.nro_convocatoria !== undefined ? req.body.nro_convocatoria : nroConvActual;

    if (nuevoAnio !== anioActual || nuevoSem !== semActual || nuevoNroConv !== nroConvActual) {
      const gest = await getGestionByAnio(nuevoAnio, t);
      const [conv] = await Convocatoria.findOrCreate({
        where: {
          id_carrera,
          id_gestion: gest.id_gestion,
          nro_convocatoria: nuevoNroConv || 'CONV-S/N',
          semestre: nuevoSem || 1
        },
        defaults: {
          id_convocatoria: uuidv4(),
          id_carrera,
          id_gestion: gest.id_gestion,
          nro_convocatoria: nuevoNroConv || 'CONV-S/N',
          semestre: nuevoSem || 1,
          observaciones: 'Reasignada por edición de auxiliar'
        },
        transaction: t
      });
      auxUpdates.id_convocatoria = conv.id_convocatoria;
    }

    await auxiliar.update(auxUpdates, { transaction: t });
    await t.commit();

    const reloaded = await AuxiliarV4.findByPk(auxiliar.id_auxiliar, {
      include: [
        {
          model: Convocatoria,
          as: 'convocatoria',
          include: [{ model: Gestion, as: 'gestion' }]
        },
        { model: Materia, as: 'materia' }
      ]
    });

    return res.json(formatAuxiliar(reloaded));
  } catch (err) {
    await t.rollback();
    console.error('Error update auxiliar:', err);
    return res.status(500).json({ mensaje: 'Error al actualizar auxiliar' });
  }
};

const remove = async (req, res) => {
  try {
    const auxiliar = await AuxiliarV4.findByPk(req.params.id);
    if (!auxiliar) return res.status(404).json({ mensaje: 'No encontrado' });
    await auxiliar.destroy();
    return res.json({ mensaje: 'Eliminado exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, create, update, remove };
