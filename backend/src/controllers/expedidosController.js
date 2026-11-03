const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const {
  sequelize,
  Document,
  DocumentType,
  DocumentAttachment,
  Gestion
} = require('../models');
const {
  getCarreraId,
  getGestionByAnio,
  getDocumentTypeId,
  formatExpedido
} = require('../utils/compatibilityHelpers');

const VALID_CATEGORIAS = ['carta', 'solicitud', 'informe', 'memorandum', 'otro'];

function sanitizeCategoria(cat) {
  if (!cat) return 'otro';
  const c = String(cat).toLowerCase().trim();
  return VALID_CATEGORIAS.includes(c) ? c : 'otro';
}

const getAll = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const id_tipo_documento = await getDocumentTypeId('Oficio expedido');
    const { gestion, estado, busqueda, categoria } = req.query || {};

    const where = {
      id_carrera,
      id_tipo_documento
    };

    if (estado && estado !== 'all') where.estado = estado;
    if (categoria && categoria !== 'all' && categoria !== 'todas') {
      where.categoria = sanitizeCategoria(categoria);
    }
    if (busqueda) {
      where[Op.or] = [
        { destinatario: { [Op.iLike]: `%${busqueda}%` } },
        { asunto: { [Op.iLike]: `%${busqueda}%` } },
        { descripcion: { [Op.iLike]: `%${busqueda}%` } },
        { nro_documento: { [Op.iLike]: `%${busqueda}%` } }
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
        { model: DocumentAttachment, as: 'adjuntos' }
      ],
      order: [
        [{ model: Gestion, as: 'gestion' }, 'anio', 'DESC'],
        ['correlativo', 'DESC']
      ]
    });

    return res.json(docs.map(formatExpedido));
  } catch (err) {
    console.error('Error getAll expedidos:', err);
    return res.status(500).json({ mensaje: 'Error al obtener expedidos' });
  }
};

const getNextNumber = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id_carrera = await getCarreraId(req);
    const id_tipo_documento = await getDocumentTypeId('Oficio expedido', t);
    const anio = parseInt(req.query?.gestion, 10) || new Date().getFullYear();
    const gestion = await getGestionByAnio(anio, t);

    const last = await Document.findOne({
      where: {
        id_carrera,
        id_tipo_documento,
        id_gestion: gestion.id_gestion,
        correlativo: { [Op.ne]: null }
      },
      order: [['correlativo', 'DESC']],
      lock: t.LOCK.SHARE,
      transaction: t
    });

    await t.commit();
    const next = last && last.correlativo ? last.correlativo + 1 : 1;
    return res.json({ next, gestion: anio });
  } catch (err) {
    await t.rollback();
    console.error('Error getNextNumber expedidos:', err);
    return res.status(500).json({ mensaje: 'Error al obtener siguiente número' });
  }
};

const create = async (req, res) => {
  const id_carrera = await getCarreraId(req);
  const id_tipo_documento = await getDocumentTypeId('Oficio expedido');
  const { destinatario, asunto, descripcion, estado, requiere_respuesta, fecha, categoria } = req.body;
  const anio = req.body.gestion ? parseInt(req.body.gestion, 10) : (fecha ? new Date(fecha).getFullYear() : new Date().getFullYear());
  const catSanitized = sanitizeCategoria(categoria);

  let attempts = 0;
  let expedidoDoc = null;

  while (attempts < 3) {
    attempts++;
    const t = await sequelize.transaction();
    try {
      const gestion = await getGestionByAnio(anio, t);

      // Calcular correlativo dentro de la transacción
      const last = await Document.findOne({
        where: {
          id_carrera,
          id_tipo_documento,
          id_gestion: gestion.id_gestion,
          correlativo: { [Op.ne]: null }
        },
        order: [['correlativo', 'DESC']],
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      const correlativo = last && last.correlativo ? last.correlativo + 1 : 1;
      const nro_documento = String(correlativo);

      expedidoDoc = await Document.create({
        id_documento: uuidv4(),
        id_tipo_documento,
        id_gestion: gestion.id_gestion,
        id_carrera,
        nro_documento,
        correlativo,
        fecha: fecha || new Date().toISOString().split('T')[0],
        remitente: 'Dirección de Carrera FINI',
        destinatario: destinatario || '',
        asunto: asunto || '',
        descripcion: descripcion || null,
        categoria: catSanitized,
        estado: estado || 'pendiente',
        requiere_respuesta: requiere_respuesta === 'true' || requiere_respuesta === true,
        created_by: req.user?.id || null
      }, { transaction: t });

      if (req.file) {
        let finalFilePath = req.file.path;
        try {
          const uploadsExpedidosDir = path.resolve(__dirname, '../../uploads/expedidos');
          const targetDir = path.join(uploadsExpedidosDir, catSanitized);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          const destinationPath = path.join(targetDir, path.basename(req.file.path));
          if (fs.existsSync(req.file.path)) {
            fs.renameSync(req.file.path, destinationPath);
            finalFilePath = destinationPath;
          }
        } catch (moveErr) {
          console.error('Aviso: no se pudo mover el archivo a la subcarpeta de categoría:', moveErr.message);
        }

        await DocumentAttachment.create({
          id_adjunto: uuidv4(),
          id_documento: expedidoDoc.id_documento,
          nombre_archivo: req.file.originalname,
          archivo_path: finalFilePath,
          archivo_tipo: req.file.mimetype || 'application/pdf',
          archivo_tamano: req.file.size || null
        }, { transaction: t });
      }

      await t.commit();
      break;
    } catch (err) {
      await t.rollback();
      if (attempts >= 3) {
        console.error('Error create expedido tras reintentos:', err);
        return res.status(500).json({ mensaje: 'Error al crear expedido', error: err.message });
      }
    }
  }

  // Recargar con asociaciones para el formato final
  const createdDoc = await Document.findByPk(expedidoDoc.id_documento, {
    include: [
      { model: Gestion, as: 'gestion' },
      { model: DocumentAttachment, as: 'adjuntos' }
    ]
  });

  return res.status(201).json(formatExpedido(createdDoc));
};

const update = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: {
        id_documento: req.params.id,
        id_carrera
      },
      include: [
        { model: Gestion, as: 'gestion' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ]
    });

    if (!doc) return res.status(404).json({ mensaje: 'Expedido no encontrado' });

    const fieldsToUpdate = {};
    if (req.body.destinatario !== undefined) fieldsToUpdate.destinatario = req.body.destinatario;
    if (req.body.asunto !== undefined) fieldsToUpdate.asunto = req.body.asunto;
    if (req.body.descripcion !== undefined) fieldsToUpdate.descripcion = req.body.descripcion;
    if (req.body.estado !== undefined) fieldsToUpdate.estado = req.body.estado;
    if (req.body.requiere_respuesta !== undefined) {
      fieldsToUpdate.requiere_respuesta = req.body.requiere_respuesta === 'true' || req.body.requiere_respuesta === true;
    }
    if (req.body.fecha !== undefined) fieldsToUpdate.fecha = req.body.fecha;
    if (req.body.gestion) {
      const g = await getGestionByAnio(req.body.gestion);
      fieldsToUpdate.id_gestion = g.id_gestion;
    }

    if (req.body.categoria !== undefined) {
      const newCat = sanitizeCategoria(req.body.categoria);
      fieldsToUpdate.categoria = newCat;

      // Si cambió de categoría, mover archivos adjuntos
      if (doc.adjuntos && doc.adjuntos.length > 0) {
        for (const adj of doc.adjuntos) {
          if (adj.archivo_path && fs.existsSync(adj.archivo_path)) {
            try {
              const uploadsExpedidosDir = path.resolve(__dirname, '../../uploads/expedidos');
              const targetDir = path.join(uploadsExpedidosDir, newCat);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              const destinationPath = path.join(targetDir, path.basename(adj.archivo_path));
              if (adj.archivo_path !== destinationPath) {
                fs.renameSync(adj.archivo_path, destinationPath);
                await adj.update({ archivo_path: destinationPath });
              }
            } catch (moveErr) {
              console.error('Aviso: error al mover archivo de expedido por cambio de categoría:', moveErr.message);
            }
          }
        }
      }
    }

    await doc.update(fieldsToUpdate);

    const reloaded = await Document.findByPk(doc.id_documento, {
      include: [
        { model: Gestion, as: 'gestion' },
        { model: DocumentAttachment, as: 'adjuntos' }
      ]
    });

    return res.json(formatExpedido(reloaded));
  } catch (err) {
    console.error('Error update expedido:', err);
    return res.status(500).json({ mensaje: 'Error al actualizar expedido', error: err.message });
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
      // Fallback a carpeta base de expedidos
      const fallbackBase = path.resolve(__dirname, '../../uploads/expedidos', path.basename(attachment.archivo_path));
      if (fs.existsSync(fallbackBase)) {
        absPath = fallbackBase;
      } else {
        return res.status(404).json({ mensaje: 'Archivo no existe en disco' });
      }
    }
    return res.download(absPath, attachment.nombre_archivo || 'documento.pdf');
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al descargar archivo' });
  }
};

const remove = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const doc = await Document.findOne({
      where: { id_documento: req.params.id, id_carrera },
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
    return res.json({ mensaje: 'Eliminado exitosamente' });
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error al eliminar' });
  }
};

module.exports = { getAll, getNextNumber, create, update, download, remove };
