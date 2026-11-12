const { Op } = require('sequelize');
const {
  Convocatoria,
  Gestion,
  FaseProceso,
  ConvocatoriaFase,
  Document,
  DocumentType,
  DocumentAttachment
} = require('../models');
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

// ============================================
// AVANCE POR FASES (tablas fases_proceso y convocatoria_fases)
// ============================================

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

// Solo los oficios expedidos y recibidos sirven como respaldo de una fase
const TIPOS_RESPALDO = { 'Oficio expedido': 'expedido', 'Oficio recibido': 'recibido' };

const includeDocumento = {
  model: Document,
  as: 'documento',
  attributes: ['id_documento', 'nro_documento', 'asunto', 'fecha', 'remitente', 'destinatario'],
  include: [
    { model: DocumentType, as: 'tipo_documento', attributes: ['nombre'] },
    { model: DocumentAttachment, as: 'adjuntos', attributes: ['id_adjunto', 'nombre_archivo'] }
  ]
};

// Datos del documento que necesita el frontend para mostrarlo y abrirlo
const formatearRespaldo = (doc) => {
  if (!doc) return null;
  const tipoNombre = doc.tipo_documento?.nombre || '';
  return {
    id: doc.id_documento,
    nro_documento: doc.nro_documento,
    asunto: doc.asunto,
    fecha: doc.fecha,
    tipo: TIPOS_RESPALDO[tipoNombre] || null,
    tipo_nombre: tipoNombre,
    contraparte: TIPOS_RESPALDO[tipoNombre] === 'recibido' ? doc.remitente : doc.destinatario,
    tiene_archivo: Array.isArray(doc.adjuntos) && doc.adjuntos.length > 0,
    nombre_archivo: doc.adjuntos?.[0]?.nombre_archivo || null
  };
};

// Busca la convocatoria asegurando que sea de la carrera del usuario
const buscarConvocatoria = async (req) => {
  const id_carrera = await getCarreraId(req);
  return Convocatoria.findOne({
    where: { id_convocatoria: req.params.id, id_carrera },
    include: [{ model: Gestion, as: 'gestion' }]
  });
};

// Arma la lista de las 4 fases indicando cuáles están cumplidas, en qué fecha y con qué respaldo
const armarAvance = async (convocatoria) => {
  const [fases, cumplidas] = await Promise.all([
    FaseProceso.findAll({ order: [['orden', 'ASC']] }),
    ConvocatoriaFase.findAll({
      where: { id_convocatoria: convocatoria.id_convocatoria },
      include: [includeDocumento]
    })
  ]);
  const porFase = new Map(cumplidas.map(cf => [cf.id_fase, cf]));

  return {
    id: convocatoria.id_convocatoria,
    nro_convocatoria: convocatoria.nro_convocatoria,
    gestion: convocatoria.gestion?.anio,
    semestre: convocatoria.semestre,
    fases: fases.map(f => {
      const cf = porFase.get(f.id_fase);
      return {
        id_fase: f.id_fase,
        orden: f.orden,
        nombre: f.nombre,
        cumplida: Boolean(cf),
        fecha: cf ? cf.fecha : null,
        observaciones: cf ? cf.observaciones : null,
        documento: cf ? formatearRespaldo(cf.documento) : null
      };
    })
  };
};

// GET /convocatorias/:id/fases
const getFases = async (req, res) => {
  try {
    const convocatoria = await buscarConvocatoria(req);
    if (!convocatoria) return res.status(404).json({ mensaje: 'Convocatoria no encontrada' });
    return res.json(await armarAvance(convocatoria));
  } catch (err) {
    console.error('Error getFases convocatoria:', err);
    return res.status(500).json({ mensaje: 'Error al obtener el avance de la convocatoria' });
  }
};

// GET /convocatorias/:id/documentos-respaldo?busqueda=
// Oficios expedidos y recibidos de la carrera (del año de la convocatoria y del anterior)
// que se pueden elegir como respaldo de una fase.
const getDocumentosRespaldo = async (req, res) => {
  try {
    const convocatoria = await buscarConvocatoria(req);
    if (!convocatoria) return res.status(404).json({ mensaje: 'Convocatoria no encontrada' });

    const anio = convocatoria.gestion?.anio;
    const where = { id_carrera: convocatoria.id_carrera };
    const busqueda = typeof req.query.busqueda === 'string' ? req.query.busqueda.trim() : '';
    if (busqueda) {
      const patron = `%${busqueda}%`;
      where[Op.or] = [
        { nro_documento: { [Op.iLike]: patron } },
        { asunto: { [Op.iLike]: patron } },
        { remitente: { [Op.iLike]: patron } },
        { destinatario: { [Op.iLike]: patron } }
      ];
    }

    const docs = await Document.findAll({
      where,
      attributes: includeDocumento.attributes,
      include: [
        { model: DocumentType, as: 'tipo_documento', attributes: ['nombre'], where: { nombre: Object.keys(TIPOS_RESPALDO) } },
        { model: Gestion, as: 'gestion', attributes: ['anio'], where: anio ? { anio: [anio, anio - 1] } : undefined },
        { model: DocumentAttachment, as: 'adjuntos', attributes: ['id_adjunto', 'nombre_archivo'] }
      ],
      order: [['fecha', 'DESC'], ['nro_documento', 'DESC']],
      limit: 100
    });

    return res.json(docs.map(formatearRespaldo));
  } catch (err) {
    console.error('Error getDocumentosRespaldo:', err);
    return res.status(500).json({ mensaje: 'Error al obtener los documentos de respaldo' });
  }
};

// PUT /convocatorias/:id/fases/:idFase  { fecha, observaciones, id_documento }
// Marca una fase como cumplida (o la corrige). Exige que la fase anterior esté cumplida.
const registrarFase = async (req, res) => {
  try {
    const convocatoria = await buscarConvocatoria(req);
    if (!convocatoria) return res.status(404).json({ mensaje: 'Convocatoria no encontrada' });

    const fase = await FaseProceso.findByPk(req.params.idFase);
    if (!fase) return res.status(404).json({ mensaje: 'Fase no encontrada' });

    const { fecha, observaciones, id_documento } = req.body || {};
    if (!fecha || !FECHA_VALIDA.test(fecha)) {
      return res.status(400).json({ mensaje: 'Indica la fecha en que se cumplió la fase (AAAA-MM-DD).' });
    }

    // Documento de respaldo opcional: debe ser un oficio expedido o recibido de la misma carrera
    let idRespaldo = null;
    if (id_documento) {
      const doc = await Document.findOne({
        where: { id_documento, id_carrera: convocatoria.id_carrera },
        include: [{ model: DocumentType, as: 'tipo_documento', attributes: ['nombre'] }]
      });
      if (!doc || !TIPOS_RESPALDO[doc.tipo_documento?.nombre]) {
        return res.status(400).json({ mensaje: 'El documento de respaldo debe ser un oficio expedido o recibido de la carrera.' });
      }
      idRespaldo = doc.id_documento;
    }

    const avance = await armarAvance(convocatoria);
    const anterior = avance.fases.find(f => f.orden === fase.orden - 1);
    if (anterior && !anterior.cumplida) {
      return res.status(400).json({ mensaje: `Primero registra la fase "${anterior.nombre}".` });
    }
    if (anterior && fecha < anterior.fecha) {
      return res.status(400).json({ mensaje: `La fecha no puede ser anterior a la de "${anterior.nombre}" (${anterior.fecha}).` });
    }
    const siguiente = avance.fases.find(f => f.orden === fase.orden + 1);
    if (siguiente && siguiente.cumplida && fecha > siguiente.fecha) {
      return res.status(400).json({ mensaje: `La fecha no puede ser posterior a la de "${siguiente.nombre}" (${siguiente.fecha}).` });
    }

    const datos = {
      fecha,
      observaciones: typeof observaciones === 'string' && observaciones.trim() ? observaciones.trim() : null,
      id_documento: idRespaldo
    };
    const existente = await ConvocatoriaFase.findOne({
      where: { id_convocatoria: convocatoria.id_convocatoria, id_fase: fase.id_fase }
    });
    if (existente) {
      await existente.update(datos);
    } else {
      await ConvocatoriaFase.create({ id_convocatoria: convocatoria.id_convocatoria, id_fase: fase.id_fase, ...datos });
    }

    return res.json(await armarAvance(convocatoria));
  } catch (err) {
    console.error('Error registrarFase convocatoria:', err);
    return res.status(500).json({ mensaje: 'Error al registrar la fase' });
  }
};

// DELETE /convocatorias/:id/fases/:idFase
// Deshace una fase cumplida. Solo se permite con la última cumplida, para no dejar huecos.
const quitarFase = async (req, res) => {
  try {
    const convocatoria = await buscarConvocatoria(req);
    if (!convocatoria) return res.status(404).json({ mensaje: 'Convocatoria no encontrada' });

    const avance = await armarAvance(convocatoria);
    const fase = avance.fases.find(f => f.id_fase === req.params.idFase);
    if (!fase || !fase.cumplida) return res.status(404).json({ mensaje: 'Esa fase no está registrada' });

    const siguiente = avance.fases.find(f => f.orden === fase.orden + 1);
    if (siguiente && siguiente.cumplida) {
      return res.status(400).json({ mensaje: `Primero deshaz la fase "${siguiente.nombre}".` });
    }

    await ConvocatoriaFase.destroy({
      where: { id_convocatoria: convocatoria.id_convocatoria, id_fase: fase.id_fase }
    });
    return res.json(await armarAvance(convocatoria));
  } catch (err) {
    console.error('Error quitarFase convocatoria:', err);
    return res.status(500).json({ mensaje: 'Error al deshacer la fase' });
  }
};

module.exports = { getAll, getFases, getDocumentosRespaldo, registrarFase, quitarFase };
