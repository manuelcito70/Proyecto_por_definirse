const path = require('path');
const { esErrorDeValidacion, responderValidacion } = require('../utils/errores');
const fs = require('fs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  sequelize,
  Document,
  DocumentType,
  DocumentAttachment,
  ActaDetalle,
  Gestion
} = require('../models');
const {
  getCarreraId,
  getGestionByAnio,
  getDocumentTypeId,
  formatActa
} = require('../utils/compatibilityHelpers');

const getAll = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const id_tipo_documento = await getDocumentTypeId('Acta de graduación');
    const { gestion, modalidad, busqueda } = req.query || {};

    const where = {
      id_carrera,
      id_tipo_documento
    };

    const actaDetalleWhere = {};
    if (modalidad) {
      actaDetalleWhere.modalidad = modalidad;
    }

    if (busqueda) {
      actaDetalleWhere[Op.or] = [
        { nombre_estudiante: { [Op.iLike]: `%${busqueda}%` } },
        { nro_registro: { [Op.iLike]: `%${busqueda}%` } },
        { ci: { [Op.iLike]: `%${busqueda}%` } }
      ];
      where[Op.or] = [
        { nro_documento: { [Op.iLike]: `%${busqueda}%` } },
        { '$acta_detalle.nombre_estudiante$': { [Op.iLike]: `%${busqueda}%` } },
        { '$acta_detalle.nro_registro$': { [Op.iLike]: `%${busqueda}%` } },
        { '$acta_detalle.ci$': { [Op.iLike]: `%${busqueda}%` } }
      ];
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
        {
          model: ActaDetalle,
          as: 'acta_detalle',
          where: Object.keys(actaDetalleWhere).length > 0 ? actaDetalleWhere : undefined,
          required: true
        },
        { model: DocumentAttachment, as: 'adjuntos' }
      ],
      order: [
        [{ model: Gestion, as: 'gestion' }, 'anio', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return res.json(docs.map(formatActa));
  } catch (err) {
    console.error('Error getAll actas:', err);
    return res.status(500).json({ mensaje: 'Error al obtener actas' });
  }
};

const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const id_tipo_documento = await getDocumentTypeId('Acta de graduación', t);
    const { nro_acta, codigo_cpd, nro_registro, nombre_estudiante, ci, modalidad, nota, gestion } = req.body;
    const anio = parseInt(gestion, 10) || new Date().getFullYear();
    const gest = await getGestionByAnio(anio, t);

    const docId = uuidv4();
    const doc = await Document.create({
      id_documento: docId,
      id_tipo_documento,
      id_gestion: gest.id_gestion,
      id_carrera,
      nro_documento: String(nro_acta || '').trim(),
      correlativo: null,
      fecha: new Date().toISOString().split('T')[0],
      remitente: 'Comisión Evaluadora / CPD',
      destinatario: 'Dirección de Carrera FINI',
      asunto: `Acta de Graduación: ${nombre_estudiante}`,
      descripcion: `Modalidad: ${modalidad}. Registro: ${nro_registro || 'S/R'}`,
      estado: 'completado',
      created_by: req.user?.id || null
    }, { transaction: t });

    await ActaDetalle.create({
      id_documento: docId,
      nombre_estudiante,
      ci: ci || null,
      nro_registro: nro_registro || null,
      modalidad,
      codigo_cpd: codigo_cpd || null,
      nota: nota ? parseFloat(nota) : null
    }, { transaction: t });

    if (req.file) {
      await DocumentAttachment.create({
        id_adjunto: uuidv4(),
        id_documento: docId,
        nombre_archivo: req.file.originalname,
        archivo_path: req.file.path,
        archivo_tipo: req.file.mimetype || 'application/pdf',
        archivo_tamano: req.file.size || null
      }, { transaction: t });
    }

    await t.commit();

    const createdDoc = await Document.findByPk(docId, {
      include: [
        { model: Gestion, as: 'gestion' },
        { model: ActaDetalle, as: 'acta_detalle' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ]
    });

    return res.status(201).json(formatActa(createdDoc));
  } catch (err) {
    await t.rollback();
    if (esErrorDeValidacion(err)) return responderValidacion(res, err);
    console.error('Error create acta:', err);
    return res.status(500).json({ mensaje: 'Error al registrar acta', error: err.message });
  }
};

const update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: { id_documento: req.params.id, id_carrera },
      include: [
        { model: Gestion, as: 'gestion' },
        { model: ActaDetalle, as: 'acta_detalle' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ],
      transaction: t
    });

    if (!doc) {
      await t.rollback();
      return res.status(404).json({ mensaje: 'Acta no encontrada' });
    }

    const docUpdates = {};
    if (req.body.nro_acta !== undefined) docUpdates.nro_documento = String(req.body.nro_acta);
    if (req.body.nombre_estudiante) docUpdates.asunto = `Acta de Graduación: ${req.body.nombre_estudiante}`;
    if (req.body.gestion) {
      const g = await getGestionByAnio(req.body.gestion, t);
      docUpdates.id_gestion = g.id_gestion;
    }

    if (Object.keys(docUpdates).length > 0) {
      await doc.update(docUpdates, { transaction: t });
    }

    const detalleUpdates = {};
    if (req.body.nombre_estudiante !== undefined) detalleUpdates.nombre_estudiante = req.body.nombre_estudiante;
    if (req.body.ci !== undefined) detalleUpdates.ci = req.body.ci;
    if (req.body.nro_registro !== undefined) detalleUpdates.nro_registro = req.body.nro_registro;
    if (req.body.modalidad !== undefined) detalleUpdates.modalidad = req.body.modalidad;
    if (req.body.codigo_cpd !== undefined) detalleUpdates.codigo_cpd = req.body.codigo_cpd;
    if (req.body.nota !== undefined) detalleUpdates.nota = req.body.nota ? parseFloat(req.body.nota) : null;

    if (doc.acta_detalle && Object.keys(detalleUpdates).length > 0) {
      await doc.acta_detalle.update(detalleUpdates, { transaction: t });
    }

    if (req.file) {
      if (doc.adjuntos && doc.adjuntos.length > 0) {
        for (const adj of doc.adjuntos) {
          if (adj.archivo_path && fs.existsSync(adj.archivo_path)) {
            try { fs.unlinkSync(adj.archivo_path); } catch (e) {}
          }
          await adj.destroy({ transaction: t });
        }
      }
      await DocumentAttachment.create({
        id_adjunto: uuidv4(),
        id_documento: doc.id_documento,
        nombre_archivo: req.file.originalname,
        archivo_path: req.file.path,
        archivo_tipo: req.file.mimetype || 'application/pdf',
        archivo_tamano: req.file.size || null
      }, { transaction: t });
    }

    await t.commit();

    const reloaded = await Document.findByPk(doc.id_documento, {
      include: [
        { model: Gestion, as: 'gestion' },
        { model: ActaDetalle, as: 'acta_detalle' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ]
    });

    return res.json(formatActa(reloaded));
  } catch (err) {
    await t.rollback();
    console.error('Error update acta:', err);
    return res.status(500).json({ mensaje: 'Error al actualizar acta' });
  }
};

const download = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: { id_documento: req.params.id, id_carrera },
      include: [{ model: DocumentAttachment, as: 'adjuntos' }]
    });

    if (!doc || !doc.adjuntos || doc.adjuntos.length === 0) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    }

    const attachment = doc.adjuntos[0];
    let absPath = path.resolve(attachment.archivo_path);
    if (!fs.existsSync(absPath)) {
      const fallback = path.resolve(__dirname, '../../uploads/actas', path.basename(attachment.archivo_path));
      if (fs.existsSync(fallback)) {
        absPath = fallback;
      } else {
        return res.status(404).json({ mensaje: 'Archivo no existe en disco' });
      }
    }
    return res.download(absPath, attachment.nombre_archivo || 'acta.pdf', (err) => {
      if (err && !res.headersSent) {
        console.error('Error enviando archivo en actas download:', err);
        return res.status(500).json({ mensaje: 'Error al enviar archivo' });
      }
    });
  } catch (err) {
    console.error('Error actas download:', err);
    return res.status(500).json({ mensaje: 'Error al descargar' });
  }
};

const remove = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: { id_documento: req.params.id, id_carrera },
      include: [
        { model: ActaDetalle, as: 'acta_detalle' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ]
    });

    if (!doc) return res.status(404).json({ mensaje: 'No encontrada' });

    if (doc.adjuntos && doc.adjuntos.length > 0) {
      for (const adj of doc.adjuntos) {
        if (adj.archivo_path && fs.existsSync(adj.archivo_path)) {
          fs.unlinkSync(adj.archivo_path);
        }
        await adj.destroy();
      }
    }

    if (doc.acta_detalle) {
      await doc.acta_detalle.destroy();
    }

    await doc.destroy();
    return res.json({ mensaje: 'Eliminada exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, create, update, download, remove };
