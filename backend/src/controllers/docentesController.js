const path = require('path');
const { esErrorDeValidacion, responderValidacion } = require('../utils/errores');
const fs = require('fs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  sequelize,
  DocenteV4,
  DocenteMateria,
  Materia,
  Gestion,
  Document,
  DocumentType,
  DocumentAttachment
} = require('../models');
const {
  getCarreraId,
  getGestionByAnio,
  getDocumentTypeId,
  DOCENTE_TIPO_LEGACY_TO_V4,
  formatDocente,
  formatDocenteArchivo
} = require('../utils/compatibilityHelpers');

// ── Docentes ──

const getAll = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const { busqueda, activo, id_materia, materia } = req.query || {};

    const where = { id_carrera };
    if (activo !== undefined) where.activo = activo === 'true';

    // Filtro por materia desde la tabla materias
    if (id_materia && id_materia !== 'todas') {
      const dm = await DocenteMateria.findAll({ where: { id_materia }, attributes: ['id_docente'] });
      const ids = dm.map(d => d.id_docente);
      where.id_docente = { [Op.in]: ids };
    } else if (materia && materia !== 'todas' && String(materia).trim()) {
      const termMat = String(materia).trim();
      const mats = await Materia.findAll({
        where: {
          id_carrera,
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${termMat}%` } },
            { codigo: { [Op.iLike]: `%${termMat}%` } }
          ]
        },
        attributes: ['id_materia']
      });
      const matIds = mats.map(m => m.id_materia);
      const dm = await DocenteMateria.findAll({ where: { id_materia: { [Op.in]: matIds } }, attributes: ['id_docente'] });
      const ids = dm.map(d => d.id_docente);
      where.id_docente = { [Op.in]: ids };
    }

    if (busqueda && String(busqueda).trim()) {
      const term = String(busqueda).trim();
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${term}%` } },
        { ci: { [Op.iLike]: `%${term}%` } },
        { '$materias.nombre$': { [Op.iLike]: `%${term}%` } },
        { '$materias.codigo$': { [Op.iLike]: `%${term}%` } }
      ];
    }

    const docentes = await DocenteV4.findAll({
      where,
      include: [
        { model: Materia, as: 'materias' },
        { model: Gestion, as: 'gestion_ingreso' },
        {
          model: Document,
          as: 'documentos',
          attributes: ['id_documento', 'id_tipo_documento', 'semestre'],
          include: [
            { model: DocumentType, as: 'tipo_documento', attributes: ['nombre'] }
          ]
        }
      ],
      order: [['nombre', 'ASC']]
    });

    return res.json(docentes.map(formatDocente));
  } catch (err) {
    console.error('Error getAll docentes:', err);
    return res.status(500).json({ mensaje: 'Error al obtener docentes' });
  }
};

const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const { nombre, ci, materia_principal, gestion_ingreso } = req.body;

    const anioIngreso = gestion_ingreso ? parseInt(gestion_ingreso, 10) : new Date().getFullYear();
    const gest = await getGestionByAnio(anioIngreso, t);

    const docente = await DocenteV4.create({
      id_docente: uuidv4(),
      nombre,
      ci: ci || null,
      id_carrera,
      id_gestion_ingreso: gest.id_gestion,
      activo: true
    }, { transaction: t });

    // Soporte para materias múltiples (array) o materia_principal única
    const listaMaterias = Array.isArray(req.body.materias)
      ? req.body.materias
      : (materia_principal && materia_principal.trim() ? [materia_principal.trim()] : []);

    for (const itemMat of listaMaterias) {
      if (!itemMat) continue;
      const val = String(itemMat).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const orClauses = [{ nombre: { [Op.iLike]: val } }, { codigo: { [Op.iLike]: val } }];
      if (isUuid) orClauses.push({ id_materia: val });

      let mat = await Materia.findOne({
        where: { id_carrera, [Op.or]: orClauses },
        transaction: t
      });

      if (!mat && val) {
        const codRand = `SIS-${Math.floor(100 + Math.random() * 899)}`;
        mat = await Materia.create({
          id_materia: uuidv4(),
          id_carrera,
          codigo: codRand,
          nombre: val,
          semestre: 1,
          activo: true
        }, { transaction: t });
      }

      if (mat) {
        await DocenteMateria.create({
          id_docente_materia: uuidv4(),
          id_docente: docente.id_docente,
          id_materia: mat.id_materia
        }, { transaction: t });
      }
    }

    await t.commit();

    const createdDocente = await DocenteV4.findByPk(docente.id_docente, {
      include: [
        { model: Materia, as: 'materias' },
        { model: Gestion, as: 'gestion_ingreso' }
      ]
    });

    return res.status(201).json(formatDocente(createdDocente));
  } catch (err) {
    await t.rollback();
    if (esErrorDeValidacion(err)) return responderValidacion(res, err);
    console.error('Error create docente:', err);
    return res.status(500).json({ mensaje: 'Error al registrar docente', error: err.message });
  }
};

const update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const docente = await DocenteV4.findOne({
      where: { id_docente: req.params.id, id_carrera },
      include: [{ model: Materia, as: 'materias' }],
      transaction: t
    });

    if (!docente) {
      await t.rollback();
      return res.status(404).json({ mensaje: 'No encontrado' });
    }

    const updates = {};
    if (req.body.nombre !== undefined) updates.nombre = req.body.nombre;
    if (req.body.ci !== undefined) updates.ci = req.body.ci;
    if (req.body.activo !== undefined) updates.activo = req.body.activo === 'true' || req.body.activo === true;
    if (req.body.gestion_ingreso) {
      const g = await getGestionByAnio(req.body.gestion_ingreso, t);
      updates.id_gestion_ingreso = g.id_gestion;
    }

    await docente.update(updates, { transaction: t });

    // Actualizar materias si se suministraron materias (array) o materia_principal
    if (req.body.materias !== undefined || (req.body.materia_principal && req.body.materia_principal.trim())) {
      const listaMaterias = Array.isArray(req.body.materias)
        ? req.body.materias
        : (req.body.materia_principal && req.body.materia_principal.trim() ? [req.body.materia_principal.trim()] : []);

      await DocenteMateria.destroy({ where: { id_docente: docente.id_docente }, transaction: t });

      for (const itemMat of listaMaterias) {
        if (!itemMat) continue;
        const val = String(itemMat).trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        const orClauses = [{ nombre: { [Op.iLike]: val } }, { codigo: { [Op.iLike]: val } }];
        if (isUuid) orClauses.push({ id_materia: val });

        let mat = await Materia.findOne({
          where: { id_carrera, [Op.or]: orClauses },
          transaction: t
        });

        if (!mat && val) {
          const codRand = `SIS-${Math.floor(100 + Math.random() * 899)}`;
          mat = await Materia.create({
            id_materia: uuidv4(),
            id_carrera,
            codigo: codRand,
            nombre: val,
            semestre: 1,
            activo: true
          }, { transaction: t });
        }

        if (mat) {
          await DocenteMateria.create({
            id_docente_materia: uuidv4(),
            id_docente: docente.id_docente,
            id_materia: mat.id_materia
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    const reloaded = await DocenteV4.findByPk(docente.id_docente, {
      include: [
        { model: Materia, as: 'materias' },
        { model: Gestion, as: 'gestion_ingreso' }
      ]
    });

    return res.json(formatDocente(reloaded));
  } catch (err) {
    await t.rollback();
    console.error('Error update docente:', err);
    return res.status(500).json({ mensaje: 'Error al actualizar docente' });
  }
};

// ── Archivos del Docente (Mapeados a documents + document_attachments) ──

const getArchivos = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const { gestion, semestre, tipo } = req.query || {};

    const where = {
      id_carrera,
      id_docente: req.params.id
    };

    if (semestre) where.semestre = parseInt(semestre, 10);

    const tipoDocInclude = {
      model: DocumentType,
      as: 'tipo_documento'
    };
    if (tipo) {
      const tipoV4 = DOCENTE_TIPO_LEGACY_TO_V4[tipo] || 'Otro';
      tipoDocInclude.where = { nombre: tipoV4 };
    }

    const gestionInclude = {
      model: Gestion,
      as: 'gestion'
    };
    if (gestion) {
      gestionInclude.where = { anio: parseInt(gestion, 10) };
    }

    const docs = await Document.findAll({
      where,
      include: [
        gestionInclude,
        tipoDocInclude,
        { model: DocumentAttachment, as: 'adjuntos' }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(docs.map(formatDocenteArchivo));
  } catch (err) {
    console.error('Error getArchivos docente:', err);
    return res.status(500).json({ mensaje: 'Error al obtener archivos' });
  }
};

const uploadArchivo = async (req, res) => {
  if (!req.file) return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
  const t = await sequelize.transaction();

  try {
    const id_carrera = await getCarreraId(req);
    const { tipo, gestion, semestre } = req.body;

    const docente = await DocenteV4.findOne({
      where: { id_docente: req.params.id, id_carrera },
      transaction: t
    });

    if (!docente) {
      await t.rollback();
      return res.status(404).json({ mensaje: 'Docente no encontrado' });
    }

    const anio = gestion ? parseInt(gestion, 10) : new Date().getFullYear();
    const gest = await getGestionByAnio(anio, t);

    const tipoV4Nombre = DOCENTE_TIPO_LEGACY_TO_V4[tipo] || 'Otro';
    const tipoId = await getDocumentTypeId(tipoV4Nombre, t) || await getDocumentTypeId('Otro', t);

    const docId = uuidv4();
    const nroDoc = `EXP-DOC-${Date.now().toString().slice(-6)}`;

    const doc = await Document.create({
      id_documento: docId,
      id_tipo_documento: tipoId,
      id_gestion: gest.id_gestion,
      id_carrera,
      nro_documento: nroDoc,
      correlativo: null,
      fecha: new Date().toISOString().split('T')[0],
      remitente: docente.nombre,
      destinatario: 'Dirección de Carrera FINI',
      asunto: `Expediente Docente: ${tipoV4Nombre}`,
      descripcion: `Archivo digitalizado de cátedra docente`,
      estado: 'completado',
      semestre: semestre ? parseInt(semestre, 10) : null,
      id_docente: docente.id_docente,
      created_by: req.user?.id || null
    }, { transaction: t });

    await DocumentAttachment.create({
      id_adjunto: uuidv4(),
      id_documento: docId,
      nombre_archivo: req.file.originalname,
      archivo_path: req.file.path,
      archivo_tipo: req.file.mimetype || 'application/pdf',
      archivo_tamano: req.file.size || null
    }, { transaction: t });

    await t.commit();

    const createdDoc = await Document.findByPk(docId, {
      include: [
        { model: Gestion, as: 'gestion' },
        { model: DocumentType, as: 'tipo_documento' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ]
    });

    return res.status(201).json(formatDocenteArchivo(createdDoc));
  } catch (err) {
    await t.rollback();
    console.error('Error upload archivo docente:', err);
    return res.status(500).json({ mensaje: 'Error al subir archivo', error: err.message });
  }
};

const downloadArchivo = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: { id_documento: req.params.archivoId, id_carrera },
      include: [{ model: DocumentAttachment, as: 'adjuntos' }]
    });

    if (!doc || !doc.adjuntos || doc.adjuntos.length === 0) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    }

    const attachment = doc.adjuntos[0];
    const absPath = path.resolve(attachment.archivo_path);
    if (!fs.existsSync(absPath)) return res.status(404).json({ mensaje: 'Archivo no existe en disco' });
    return res.download(absPath, attachment.nombre_archivo || 'documento.pdf');
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al descargar' });
  }
};

const deleteArchivo = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: { id_documento: req.params.archivoId, id_carrera },
      include: [{ model: DocumentAttachment, as: 'adjuntos' }]
    });

    if (!doc) return res.status(404).json({ mensaje: 'No encontrado' });

    if (doc.adjuntos && doc.adjuntos.length > 0) {
      for (const adj of doc.adjuntos) {
        if (adj.archivo_path && fs.existsSync(adj.archivo_path)) {
          fs.unlinkSync(adj.archivo_path);
        }
        await adj.destroy();
      }
    }

    await doc.destroy();
    return res.json({ mensaje: 'Archivo eliminado' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar archivo' });
  }
};

const remove = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const docente = await DocenteV4.findOne({
      where: { id_docente: req.params.id, id_carrera }
    });
    if (!docente) return res.status(404).json({ mensaje: 'Docente no encontrado' });
    await docente.destroy();
    return res.json({ mensaje: 'Docente eliminado correctamente' });
  } catch (err) {
    console.error('Error delete docente:', err);
    return res.status(500).json({ mensaje: 'Error al eliminar docente' });
  }
};

module.exports = { getAll, create, update, remove, getArchivos, uploadArchivo, downloadArchivo, deleteArchivo };
