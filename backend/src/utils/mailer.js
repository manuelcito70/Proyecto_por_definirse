const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Document, DocumentType, Carrera, Gestion } = require('../models');
const { getDocumentTypeId } = require('./compatibilityHelpers');

// Variables de entorno
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  ALERTA_DESTINATARIO,
  ALERTAS_ACTIVAS,
  ALERTA_DIAS
} = process.env;

const alertaDiasConfig = parseInt(ALERTA_DIAS, 10) || 3;

// Inicializar transportador solo si existen credenciales válidas
let transporter = null;
const isMailerConfigured = Boolean(EMAIL_HOST && EMAIL_USER && EMAIL_PASS);

if (isMailerConfigured) {
  try {
    const isGmail = (EMAIL_HOST || '').includes('gmail') || (EMAIL_USER || '').includes('@gmail.com');
    const port = parseInt(EMAIL_PORT, 10) || 465;
    const host = EMAIL_HOST || 'smtp.gmail.com';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      },
      tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
      }
    });
  } catch (err) {
    console.warn('⚠️ Error al inicializar el transportador de correo:', err.message);
    transporter = null;
  }
} else {
  console.warn('⚠️ Mailer SIGAD: Variables de correo no configuradas completamente en .env. El envío de correos quedará inactivo.');
}

/**
 * Enviar correo genérico con captura total de errores (no bloqueante)
 */
async function sendEmail({ to, subject, html, text }) {
  if (!transporter || !isMailerConfigured) {
    return { ok: false, mensaje: 'Servicio de correo no configurado' };
  }

  const recipient = to || ALERTA_DESTINATARIO;
  if (!recipient) {
    return { ok: false, mensaje: 'No hay destinatario configurado' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"SIGAD - Dirección de Carrera FINI" <${EMAIL_USER}>`,
      to: recipient,
      subject,
      text: text || '',
      html: html || ''
    });
    console.log(`📧 [Correo Enviado] ID: ${info.messageId} a ${recipient}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Error no bloqueante al enviar correo:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Notificación inmediata al registrar un documento recibido que requiere respuesta
 */
async function sendAlertaNuevoRecibido(doc) {
  try {
    if (!doc || !doc.requiere_respuesta) return;
    const recipient = ALERTA_DESTINATARIO;
    if (!recipient) return;

    const nro = doc.correlativo || doc.nro_documento || 'S/N';
    const asunto = doc.asunto || 'Sin asunto';
    const remitente = doc.remitente || 'No especificado';
    const fecha = doc.fecha || new Date().toISOString().split('T')[0];

    const subject = `[SIGAD - URGENTE] Nuevo Recibido Nº ${nro} requiere respuesta`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0b2545; color: white; padding: 20px; text-align: center; border-bottom: 4px solid #c1121f;">
          <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">DIRECCIÓN DE CARRERA — FINI UAGRM</h2>
          <p style="margin: 5px 0 0; color: #c5a059; font-size: 13px; text-transform: uppercase;">Sistema de Archivo y Gestión Documental (SIGAD)</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <h3 style="color: #c1121f; margin-top: 0;">⚠️ Atención: Documento Recibido Requiere Respuesta</h3>
          <p>Se ha registrado un nuevo oficio/documento externo en el sistema que demanda atención oficial:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 35%; color: #0b2545;">N.° Interno:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">#${nro}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0b2545;">Fecha Recepción:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${fecha}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0b2545;">Remitente:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${remitente}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: bold; color: #0b2545;">Asunto:</td>
              <td style="padding: 10px 14px;">${asunto}</td>
            </tr>
          </table>
          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
            Por favor, ingrese al portal SIGAD para revisar los antecedentes y emitir la respuesta correspondiente antes del plazo reglamentario.
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          UAGRM — Facultad Integral del Ichilo · Yapacaní, Santa Cruz, Bolivia
        </div>
      </div>
    `;

    await sendEmail({
      to: recipient,
      subject,
      html,
      text: `Se ha registrado el documento recibido #${nro} de ${remitente} (${asunto}) que requiere respuesta formal.`
    });
  } catch (err) {
    console.error('Error al generar alerta de nuevo recibido:', err.message);
  }
}

/**
 * Tarea programada diaria a las 08:00 (America/La_Paz)
 */
function iniciarCronAlertas() {
  if (ALERTAS_ACTIVAS === 'false') {
    console.log('⏰ Cron SIGAD: Desactivado según variable ALERTAS_ACTIVAS=false.');
    return null;
  }

  // Expresión: a las 08:00 cada día
  const task = cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [Cron SIGAD 08:00] Evaluando documentos pendientes y por vencer...');
    try {
      if (!isMailerConfigured || !ALERTA_DESTINATARIO) {
        console.log('⏰ [Cron SIGAD] Variables de correo no presentes; omitiendo envío diario.');
        return;
      }

      const ahora = new Date();
      const limiteDias = alertaDiasConfig;
      const fechaLimite = new Date(ahora.getTime() - limiteDias * 24 * 60 * 60 * 1000);
      const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

      const idTipoRecibido = await getDocumentTypeId('Oficio recibido');
      const idTipoExpedido = await getDocumentTypeId('Oficio expedido');

      // Buscar recibidos pendientes que requieren respuesta y sobrepasan los días de alerta
      const whereRecibidos = {
        estado: 'pendiente',
        requiere_respuesta: true,
        fecha: { [Op.lte]: fechaLimiteStr }
      };
      if (idTipoRecibido) {
        whereRecibidos.id_tipo_documento = idTipoRecibido;
      }

      const recibidosPendientes = await Document.findAll({
        where: whereRecibidos,
        limit: 25,
        order: [['fecha', 'ASC']]
      });

      // Buscar expedidos pendientes con más de N días (filtrando estrictamente por tipo Oficio expedido)
      const whereExpedidos = {
        estado: 'pendiente',
        fecha: { [Op.lte]: fechaLimiteStr }
      };
      if (idTipoExpedido) {
        whereExpedidos.id_tipo_documento = idTipoExpedido;
      }

      const expedidosPendientes = await Document.findAll({
        where: whereExpedidos,
        limit: 25,
        order: [['fecha', 'ASC']]
      });

      const totalAlertas = recibidosPendientes.length + expedidosPendientes.length;
      if (totalAlertas === 0) {
        console.log('⏰ [Cron SIGAD] No hay documentos en mora. Todos los trámites están al día.');
        return;
      }

      console.log(`⏰ [Cron SIGAD] Se detectaron ${totalAlertas} documentos con alertas. Enviando reporte...`);

      const filasRecibidos = recibidosPendientes.map(r => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">#${r.correlativo || r.nro_documento}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${r.remitente || 'N/A'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${r.asunto}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #c1121f; font-weight: bold;">${r.fecha}</td>
        </tr>
      `).join('');

      const filasExpedidos = expedidosPendientes.map(e => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">#${e.correlativo || e.nro_documento}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${e.destinatario || 'N/A'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${e.asunto}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #c1121f; font-weight: bold;">${e.fecha}</td>
        </tr>
      `).join('');

      const subject = `[SIGAD FINI] Resumen diario: ${totalAlertas} trámites pendientes / en mora`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0b2545; color: white; padding: 18px; text-align: center; border-bottom: 4px solid #c1121f;">
            <h2 style="margin: 0; font-size: 18px;">DIRECCIÓN DE CARRERA — FINI UAGRM</h2>
            <p style="margin: 4px 0 0; color: #c5a059; font-size: 12px;">INFORME MATUTINO DE DOCUMENTOS EN MORA (08:00 AM)</p>
          </div>
          <div style="padding: 20px; color: #1e293b;">
            <p style="font-size: 14px; margin-top: 0;">
              Se han identificado <strong>${totalAlertas} documento(s)</strong> con más de ${limiteDias} días de espera que requieren acción inmediata:
            </p>
            ${recibidosPendientes.length > 0 ? `
              <h4 style="color: #0b2545; margin-bottom: 8px;">Documentos Recibidos por responder (${recibidosPendientes.length}):</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <thead style="background: #f1f5f9; text-align: left;">
                  <tr>
                    <th style="padding: 8px 12px; font-size: 12px;">Nº Interno</th>
                    <th style="padding: 8px 12px; font-size: 12px;">Remitente</th>
                    <th style="padding: 8px 12px; font-size: 12px;">Asunto</th>
                    <th style="padding: 8px 12px; font-size: 12px;">Fecha</th>
                  </tr>
                </thead>
                <tbody>${filasRecibidos}</tbody>
              </table>
            ` : ''}
            ${expedidosPendientes.length > 0 ? `
              <h4 style="color: #0b2545; margin-bottom: 8px;">Oficios Expedidos pendientes (${expedidosPendientes.length}):</h4>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                <thead style="background: #f1f5f9; text-align: left;">
                  <tr>
                    <th style="padding: 8px 12px; font-size: 12px;">Nº Oficio</th>
                    <th style="padding: 8px 12px; font-size: 12px;">Destinatario</th>
                    <th style="padding: 8px 12px; font-size: 12px;">Asunto</th>
                    <th style="padding: 8px 12px; font-size: 12px;">Fecha</th>
                  </tr>
                </thead>
                <tbody>${filasExpedidos}</tbody>
              </table>
            ` : ''}
            <p style="font-size: 12px; color: #64748b;">
              Consulte el panel de notificaciones en el sistema para gestionar cada expediente.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 10px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Reporte generado automáticamente por SIGAD · Yapacaní
          </div>
        </div>
      `;

      await sendEmail({
        to: ALERTA_DESTINATARIO,
        subject,
        html,
        text: `Informe matutino: Hay ${totalAlertas} trámites pendientes con más de ${limiteDias} días de espera en SIGAD.`
      });
    } catch (cronErr) {
      console.error('❌ Error en ejecución de cron matutino:', cronErr.message);
    }
  }, {
    timezone: 'America/La_Paz'
  });

  console.log('⏰ Cron SIGAD: Tarea de alertas diarias programada a las 08:00 (America/La_Paz).');
  return task;
}

module.exports = {
  sendEmail,
  sendAlertaNuevoRecibido,
  iniciarCronAlertas
};

