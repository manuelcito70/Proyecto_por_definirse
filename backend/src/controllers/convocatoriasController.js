const { Convocatoria, Gestion, FaseProceso, ConvocatoriaFase } = require('../models');
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

// Busca la convocatoria asegurando que sea de la carrera del usuario
const buscarConvocatoria = async (req) => {
  const id_carrera = await getCarreraId(req);
  return Convocatoria.findOne({
    where: { id_convocatoria: req.params.id, id_carrera },
    include: [{ model: Gestion, as: 'gestion' }]
  });
};

// Arma la lista de las 4 fases indicando cuáles están cumplidas y en qué fecha
const armarAvance = async (convocatoria) => {
  const [fases, cumplidas] = await Promise.all([
    FaseProceso.findAll({ order: [['orden', 'ASC']] }),
    ConvocatoriaFase.findAll({ where: { id_convocatoria: convocatoria.id_convocatoria } })
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
        observaciones: cf ? cf.observaciones : null
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

// PUT /convocatorias/:id/fases/:idFase  { fecha, observaciones }
// Marca una fase como cumplida (o corrige su fecha). Exige que la fase anterior esté cumplida.
const registrarFase = async (req, res) => {
  try {
    const convocatoria = await buscarConvocatoria(req);
    if (!convocatoria) return res.status(404).json({ mensaje: 'Convocatoria no encontrada' });

    const fase = await FaseProceso.findByPk(req.params.idFase);
    if (!fase) return res.status(404).json({ mensaje: 'Fase no encontrada' });

    const { fecha, observaciones } = req.body || {};
    if (!fecha || !FECHA_VALIDA.test(fecha)) {
      return res.status(400).json({ mensaje: 'Indica la fecha en que se cumplió la fase (AAAA-MM-DD).' });
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

    const texto = typeof observaciones === 'string' && observaciones.trim() ? observaciones.trim() : null;
    const existente = await ConvocatoriaFase.findOne({
      where: { id_convocatoria: convocatoria.id_convocatoria, id_fase: fase.id_fase }
    });
    if (existente) {
      await existente.update({ fecha, observaciones: texto });
    } else {
      await ConvocatoriaFase.create({
        id_convocatoria: convocatoria.id_convocatoria,
        id_fase: fase.id_fase,
        fecha,
        observaciones: texto
      });
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

module.exports = { getAll, getFases, registrarFase, quitarFase };
