// Plantilla común para los documentos imprimibles de la Dirección de Carrera,
// con el formato de los oficios institucionales (membrete, CITE, A/DE, firmas y pie).
import { getUserCarrera, getCarreraCorta } from './carreraHelper';

// Datos institucionales: cambiar aquí si cambian las autoridades o el contacto.
export const INSTITUCION = {
  universidad: 'Universidad Autónoma "Gabriel René Moreno"',
  facultad: 'Facultad Integral de Ichilo',
  carrera: 'Ingeniería en Sistemas',
  cite: 'DIR.CARR: ING.SISTEMAS F.IN.I.',
  ciudad: 'Yapacaní',
  lema: 'Innovación & Emprendimiento',
  direccion: 'Yapacaní - Av. Santa Cruz B. 12 de octubre',
  telefono: '(3) 933 6271',
  correo: 'sistemas.fini@uagrm.edu.bo',
  facebook: 'Ingeniería en Sistemas'
};

export const FIRMAS = {
  directora: {
    nombre: 'M.Sc. Ing. Alicia Serrano Rodríguez',
    cargo: 'DIRECTORA',
    detalle: ['CARRERA ING. EN SISTEMAS', 'Facultad Integral de Ichilo - U.A.G.R.M.']
  },
  vicedecano: {
    nombre: 'M.Sc. Ing. Luis Fernando Villaroel Santacruz',
    cargo: 'DECANO',
    detalle: ['FACULTAD INTEGRAL DE ICHILO', 'Universidad Autónoma Gabriel René Moreno']
  }
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "Yapacaní, 9 de noviembre de 2026"
export const lugarYFecha = (fecha = new Date()) =>
  `${INSTITUCION.ciudad}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;

// Convierte 'AAAA-MM-DD' a 'DD/MM/AAAA' sin pasar por Date (evita el desfase de zona horaria)
export const formatearFechaIso = (fecha) => {
  if (!fecha) return '';
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

// Texto corto para citar un documento de respaldo: "Of. Exp. 015/2026" / "Of. Rec. 20"
export const citarRespaldo = (doc) => {
  if (!doc) return '';
  const tipo = doc.tipo === 'recibido' ? 'Of. Rec.' : doc.tipo === 'expedido' ? 'Of. Exp.' : 'Doc.';
  return `${tipo} N° ${doc.nro_documento}`;
};

// Escapa texto para insertarlo en el HTML del documento
export const esc = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const firmaHtml = (f) => `
  <div class="firma">
    <div class="linea"></div>
    <div class="firma-nombre">${esc(f.nombre)}</div>
    <div class="firma-cargo">${esc(f.cargo)}</div>
    ${f.detalle.map((d) => `<div class="firma-detalle">${esc(d)}</div>`).join('')}
  </div>`;

const ICONOS = {
  ubicacion: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  telefono: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>',
  correo: '<svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>'
};

/**
 * Abre una ventana con el documento en formato oficial y lanza la impresión.
 *
 * @param {object} doc
 * @param {string} doc.tituloVentana  Título de la pestaña del navegador
 * @param {string} doc.cite           Código del documento, ej. "OF. No. ____/2026"
 * @param {object} [doc.destinatario] { nombre, cargo } para el bloque "A:"
 * @param {boolean} [doc.conRemitente] Muestra el bloque "DE:" con la directora
 * @param {string} [doc.referencia]   Texto del bloque "REF:"
 * @param {string} [doc.titulo]       Título centrado (ej. "CONSTANCIA")
 * @param {string} doc.cuerpo         HTML del cuerpo (los datos ya deben venir escapados)
 * @param {Array}  doc.firmas         Lista de firmas (objetos de FIRMAS)
 */
// Abre la ventana de impresión. Debe llamarse directamente en el clic (antes de cualquier await),
// o el navegador la bloquea como ventana emergente.
export function abrirVentanaImpresion() {
  const ventana = window.open('', '_blank');
  if (!ventana) {
    alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio.');
    return null;
  }
  ventana.document.write('<p style="font-family:Arial,sans-serif;padding:24px;color:#555">Preparando documento...</p>');
  return ventana;
}

// Tabla con las fases de la convocatoria (fecha y documento de respaldo) para los imprimibles
export const tablaProcesoHtml = (avance) => {
  if (!avance?.fases?.length) return '';
  const filas = avance.fases.map((f) => `
    <tr>
      <td>${f.orden}. ${esc(f.nombre)}</td>
      <td style="white-space:nowrap">${f.cumplida ? esc(formatearFechaIso(f.fecha)) : 'Pendiente'}</td>
      <td>${f.cumplida && f.documento ? esc(citarRespaldo(f.documento)) : f.cumplida ? 'Sin respaldo registrado' : '—'}</td>
    </tr>`).join('');
  return `
    <table class="datos proceso">
      <tr><td class="titulo-tabla" colspan="3">Proceso de la convocatoria ${esc(avance.nro_convocatoria)}</td></tr>
      <tr><td class="campo">Fase</td><td class="campo">Fecha</td><td class="campo">Respaldo</td></tr>
      ${filas}
    </table>`;
};

export function imprimirDocumentoOficial(doc, ventanaPrevia = null) {
  const base = window.location.origin;
  const ventana = ventanaPrevia || abrirVentanaImpresion();
  if (!ventana) return;
  ventana.document.open();

  const bloqueA = doc.destinatario ? `
    <div class="bloque">
      <div><span class="etiqueta">A:</span>${esc(doc.destinatario.nombre)}</div>
      <div class="cargo">${esc(doc.destinatario.cargo)}</div>
    </div>` : '';

  const carreraActual = getUserCarrera();
  const carreraCorta = getCarreraCorta(carreraActual);

  const bloqueDe = doc.conRemitente ? `
    <div class="bloque">
      <div><span class="etiqueta">DE:</span>${esc(FIRMAS.directora.nombre.replace('Ing. ', ''))}</div>
      <div class="cargo">DIRECTORA DE CARRERA "${esc(carreraCorta)}" F.IN.I. – U.A.G.R.M.</div>
    </div>` : '';

  const bloqueRef = doc.referencia ? `
    <div class="bloque ref"><span class="etiqueta">REF.:</span><strong>${esc(doc.referencia)}</strong></div>` : '';

  ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${esc(doc.tituloVentana)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap" />
  <style>
    @page { size: letter; margin: 12mm 20mm 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Times New Roman", Times, serif; color: #111; font-size: 12pt; line-height: 1.45; }
    table.pagina { width: 100%; border-collapse: collapse; }
    table.pagina > tbody > tr > td, table.pagina > tfoot > tr > td { padding: 0; }
    .espacio-pie { height: 16mm; }
    .membrete { display: grid; grid-template-columns: 70px 1fr 70px; align-items: center; gap: 10px; }
    .membrete img.escudo { width: 66px; height: auto; }
    .membrete img.logo-carrera { width: 72px; height: 72px; justify-self: end; }
    .membrete .textos { text-align: center; font-family: "Monotype Corsiva", "Pinyon Script", "Edwardian Script ITC", cursive; line-height: 1.12; }
    .membrete .u { font-size: 20pt; color: #5b5f6b; white-space: nowrap; }
    .membrete .f { font-size: 18pt; color: #c1121f; }
    .membrete .c { font-size: 18pt; color: #5b5f6b; }
    .lugar { text-align: right; margin-top: 10px; }
    .cite { text-align: right; font-weight: bold; }
    .bloque { margin-top: 12px; }
    .bloque .etiqueta { display: inline-block; width: 46px; font-weight: bold; }
    .bloque .cargo { font-weight: bold; text-transform: uppercase; }
    .bloque.ref { margin-top: 12px; }
    .titulo { text-align: center; font-weight: bold; font-size: 15pt; letter-spacing: 3px; text-decoration: underline; margin: 22px 0 12px; }
    .cuerpo { margin-top: 16px; text-align: justify; }
    .cuerpo p { margin: 0 0 9px; text-indent: 48px; }
    .cuerpo p.sin-sangria { text-indent: 0; }
    .cuerpo .destacado { text-align: center; text-indent: 0; font-weight: bold; font-size: 13pt; margin: 10px 0; }
    table.datos { width: 88%; margin: 8px auto 12px; border-collapse: collapse; font-size: 11pt; line-height: 1.3; }
    table.datos td { border: 1px solid #555; padding: 3px 10px; }
    table.datos td.campo { width: 42%; font-weight: bold; background: #f2f2f2; }
    table.datos.doble td.campo { width: 17%; }
    table.datos.proceso { font-size: 10pt; }
    table.datos.proceso td { padding: 2px 10px; }
    table.datos.proceso td.campo { width: auto; }
    table.datos.proceso td.titulo-tabla { font-weight: bold; text-align: center; background: #e4e6ea; }
    .subtitulo { font-weight: bold; margin: 10px 0 2px; text-indent: 0 !important; }
    .cierre { break-inside: avoid; page-break-inside: avoid; }
    .atentamente { margin-top: 14px; }
    .firmas { display: flex; justify-content: space-around; gap: 30px; margin-top: 48px; text-align: center; }
    .firma { width: 46%; max-width: 260px; }
    .firma .linea { border-top: 1px solid #111; margin-bottom: 4px; }
    .firma-nombre { font-style: italic; font-size: 11pt; }
    .firma-cargo { font-family: Arial, sans-serif; font-weight: bold; letter-spacing: 3px; font-size: 10.5pt; }
    .firma-detalle { font-family: Arial, sans-serif; font-size: 8.5pt; }
    .cc { margin-top: 16px; font-family: Arial, sans-serif; font-style: italic; font-weight: bold; font-size: 10pt; }
    .pie { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; font-family: Arial, sans-serif; font-size: 8.5pt; color: #555; }
    .pie .lema { text-align: center; letter-spacing: 6px; color: #b9bcc4; font-style: italic; font-size: 9pt; }
    .pie .raya { border-top: 2px solid #5b4fa3; margin: 3px 0 5px; }
    .pie .datos { display: flex; justify-content: space-between; gap: 8px; }
    .pie .datos span { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
    .pie svg { width: 11px; height: 11px; fill: #555; }
    @media screen { body { max-width: 216mm; margin: 10mm auto; padding: 0 18mm; } .pie { position: static; margin-top: 30px; } .espacio-pie { display: none; } }
  </style>
</head>
<body>
  <!-- La tabla repite un espacio vacío al final de cada hoja para que el pie fijo no tape el texto -->
  <table class="pagina"><tfoot><tr><td><div class="espacio-pie"></div></td></tr></tfoot><tbody><tr><td>
  <header class="membrete">
    <img class="escudo" src="${base}/escudo%20UAGRM.png" alt="Escudo UAGRM" />
    <div class="textos">
      <div class="u">${esc(INSTITUCION.universidad)}</div>
      <div class="f">${esc(INSTITUCION.facultad)}</div>
      <div class="c">${esc(carreraActual)}</div>
    </div>
    <img class="logo-carrera" src="${base}/logo-sistemas.svg" alt="Logo ${esc(carreraActual)}" />
  </header>

  <div class="lugar">${esc(lugarYFecha())}</div>
  <div class="cite">DIR.CARR: ${esc(carreraCorta)} F.IN.I. ${esc(doc.cite)}</div>

  ${bloqueA}
  ${bloqueDe}
  ${bloqueRef}
  ${doc.titulo ? `<div class="titulo">${esc(doc.titulo)}</div>` : ''}

  <div class="cuerpo">${doc.cuerpo}</div>

  <div class="cierre">
    <div class="atentamente">Atentamente.</div>
    <div class="firmas">${doc.firmas.map(firmaHtml).join('')}</div>
    <div class="cc">CC. Archivo.</div>
  </div>
  </td></tr></tbody></table>

  <footer class="pie">
    <div class="lema">${esc(INSTITUCION.lema)}</div>
    <div class="raya"></div>
    <div class="datos">
      <span>${ICONOS.ubicacion}${esc(INSTITUCION.direccion)}</span>
      <span>${ICONOS.correo}${esc(INSTITUCION.correo)}</span>
      <span>${ICONOS.facebook}${esc(INSTITUCION.facebook)}</span>
    </div>
  </footer>

  <script>
    window.onload = function () { setTimeout(function () { window.print(); }, 300); };
  </script>
</body>
</html>`);
  ventana.document.close();
}
