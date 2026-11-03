const { Op } = require('sequelize');
const { Document, DocumentType, Gestion } = require('../models');
const { getCarreraId, getDocumentTypeId } = require('../utils/compatibilityHelpers');

const getNotificaciones = async (req, res) => {
  try {
    const id_carrera = await getCarreraId(req);
    const nDias = parseInt(process.env.ALERTA_DIAS, 10) || 3;
    const ahora = new Date();

    const idTipoRecibido = await getDocumentTypeId('Oficio recibido');
    const idTipoExpedido = await getDocumentTypeId('Oficio expedido');

    // 1. Recibidos pendientes que requieren respuesta
    const recibidosPendientes = await Document.findAll({
      where: {
        id_carrera,
        id_tipo_documento: idTipoRecibido,
        estado: 'pendiente',
        requiere_respuesta: true
      },
      include: [{ model: Gestion, as: 'gestion' }],
      order: [['fecha', 'ASC']]
    });

    // 2. Expedidos pendientes
    const expedidosPendientes = await Document.findAll({
      where: {
        id_carrera,
        id_tipo_documento: idTipoExpedido,
        estado: 'pendiente'
      },
      include: [{ model: Gestion, as: 'gestion' }],
      order: [['fecha', 'ASC']]
    });

    // 3. Recibidos o expedidos "en_curso" sin cambios recientes
    const documentosEnCurso = await Document.findAll({
      where: {
        id_carrera,
        estado: 'en_curso'
      },
      include: [{ model: Gestion, as: 'gestion' }],
      order: [['updated_at', 'ASC']]
    });

    const notificaciones = [];

    // Helper cálculo de días
    const calcularDias = (fechaBase) => {
      if (!fechaBase) return 0;
      const f = new Date(fechaBase);
      const diffMs = ahora.getTime() - f.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    // Procesar recibidos pendientes
    for (const doc of recibidosPendientes) {
      const fechaRef = doc.fecha_recepcion || doc.fecha || doc.createdAt;
      const dias = calcularDias(fechaRef);
      if (dias >= nDias) {
        const esUrgente = dias >= (2 * nDias);
        notificaciones.push({
          id: doc.id_documento,
          tipo: 'recibido',
          modulo: 'Documentos Recibidos',
          nro: doc.correlativo || doc.nro_documento || 'S/N',
          gestion: doc.gestion ? doc.gestion.anio : new Date().getFullYear(),
          asunto: doc.asunto,
          origen: doc.remitente || 'Remitente externo',
          fecha_referencia: doc.fecha,
          dias_transcurridos: dias,
          nivel: esUrgente ? 'urgente' : 'aviso',
          mensaje: `Lleva ${dias} día(s) esperando respuesta formal.`,
          link: '/recibidos'
        });
      }
    }

    // Procesar expedidos pendientes
    for (const doc of expedidosPendientes) {
      const fechaRef = doc.fecha || doc.createdAt;
      const dias = calcularDias(fechaRef);
      if (dias >= nDias) {
        const esUrgente = dias >= (2 * nDias);
        notificaciones.push({
          id: doc.id_documento,
          tipo: 'expedido',
          modulo: 'Documentos Expedidos',
          nro: doc.correlativo || doc.nro_documento || 'S/N',
          gestion: doc.gestion ? doc.gestion.anio : new Date().getFullYear(),
          asunto: doc.asunto,
          origen: doc.destinatario || 'Destinatario',
          fecha_referencia: doc.fecha,
          dias_transcurridos: dias,
          nivel: esUrgente ? 'urgente' : 'aviso',
          mensaje: `Oficio pendiente de emisión/firma desde hace ${dias} día(s).`,
          link: '/expedidos'
        });
      }
    }

    // Procesar documentos en curso sin cambios
    for (const doc of documentosEnCurso) {
      const dias = calcularDias(doc.updatedAt || doc.createdAt);
      if (dias >= nDias) {
        const esRecibido = doc.id_tipo_documento === idTipoRecibido;
        const esUrgente = dias >= (2 * nDias);
        notificaciones.push({
          id: doc.id_documento,
          tipo: esRecibido ? 'recibido' : 'expedido',
          modulo: esRecibido ? 'Documentos Recibidos' : 'Documentos Expedidos',
          nro: doc.correlativo || doc.nro_documento || 'S/N',
          gestion: doc.gestion ? doc.gestion.anio : new Date().getFullYear(),
          asunto: doc.asunto,
          origen: esRecibido ? (doc.remitente || 'Remitente') : (doc.destinatario || 'Destinatario'),
          fecha_referencia: doc.updatedAt ? new Date(doc.updatedAt).toISOString().split('T')[0] : doc.fecha,
          dias_transcurridos: dias,
          nivel: esUrgente ? 'urgente' : 'aviso',
          mensaje: `Trámite en curso sin actualizaciones desde hace ${dias} día(s).`,
          link: esRecibido ? '/recibidos' : '/expedidos'
        });
      }
    }

    // Ordenar: primero 'urgente', luego por mayor número de días transcurridos
    notificaciones.sort((a, b) => {
      if (a.nivel === 'urgente' && b.nivel !== 'urgente') return -1;
      if (a.nivel !== 'urgente' && b.nivel === 'urgente') return 1;
      return b.dias_transcurridos - a.dias_transcurridos;
    });

    const conteoUrgentes = notificaciones.filter(n => n.nivel === 'urgente').length;
    const conteoAvisos = notificaciones.filter(n => n.nivel === 'aviso').length;

    return res.json({
      alerta_dias_config: nDias,
      total: notificaciones.length,
      urgentes: conteoUrgentes,
      avisos: conteoAvisos,
      notificaciones
    });
  } catch (err) {
    console.error('Error al obtener notificaciones:', err);
    return res.status(500).json({ mensaje: 'Error al calcular notificaciones y alertas' });
  }
};

module.exports = {
  getNotificaciones
};

