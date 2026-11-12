import React, { useEffect, useMemo, useState } from 'react';
import {
  getFasesConvocatoria,
  registrarFaseConvocatoria,
  quitarFaseConvocatoria,
  getDocumentosRespaldo,
  abrirDocumentoRespaldo
} from '../services/api';
import { formatearFechaIso, citarRespaldo } from '../utils/documentoOficial';

const hoy = () => new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local

const CLAVE_PLEGADO = 'sigad_avance_convocatoria_abierto';
const leerAbierto = () => {
  try { return localStorage.getItem(CLAVE_PLEGADO) === 'true'; } catch { return false; }
};
const guardarAbierto = (valor) => {
  try { localStorage.setItem(CLAVE_PLEGADO, String(valor)); } catch { /* sin almacenamiento */ }
};

/**
 * Expediente del proceso de una convocatoria de auxiliares:
 * Propuesta de materia → Consejo facultativo → Convocatoria → Evaluación y selección.
 * Cada fase guarda su fecha y el oficio (expedido o recibido) que la respalda.
 */
export default function AvanceConvocatoria({ convocatorias = [], gestion, onCambio }) {
  const convocatoriasGestion = useMemo(
    () => convocatorias.filter((c) => String(c.gestion) === String(gestion)),
    [convocatorias, gestion]
  );

  const [abierto, setAbierto] = useState(leerAbierto);
  const [idSeleccionada, setIdSeleccionada] = useState('');
  const [avance, setAvance] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [faseEnEdicion, setFaseEnEdicion] = useState(null);
  const [formFase, setFormFase] = useState({ fecha: '', observaciones: '', id_documento: '' });
  const [guardando, setGuardando] = useState(false);
  const [confirmarDeshacer, setConfirmarDeshacer] = useState(null);
  const [documentos, setDocumentos] = useState(null);
  const [errorDocs, setErrorDocs] = useState('');
  const [filtroDoc, setFiltroDoc] = useState('');

  useEffect(() => {
    setIdSeleccionada(convocatoriasGestion[0]?.id || '');
  }, [convocatoriasGestion]);

  useEffect(() => {
    setFaseEnEdicion(null);
    setConfirmarDeshacer(null);
    setDocumentos(null);
    setErrorDocs('');
    setError('');
    if (!idSeleccionada) {
      setAvance(null);
      return;
    }
    let cancelado = false;
    setCargando(true);
    getFasesConvocatoria(idSeleccionada)
      .then((datos) => { if (!cancelado) setAvance(datos); })
      .catch((err) => { if (!cancelado) setError(err.message); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [idSeleccionada]);

  const fases = avance?.fases || [];
  const cumplidas = fases.filter((f) => f.cumplida).length;
  const conRespaldo = fases.filter((f) => f.cumplida && f.documento).length;
  const siguiente = fases.find((f) => !f.cumplida);
  const ultimaCumplida = [...fases].reverse().find((f) => f.cumplida);

  const documentosFiltrados = useMemo(() => {
    const lista = documentos || [];
    const q = filtroDoc.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((d) =>
      [d.nro_documento, d.asunto, d.contraparte].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [documentos, filtroDoc]);

  const alternarAbierto = () => {
    setAbierto((v) => { guardarAbierto(!v); return !v; });
  };

  const actualizarAvance = (datos) => {
    setAvance(datos);
    if (onCambio) onCambio(datos);
  };

  const abrirFormulario = (fase) => {
    setConfirmarDeshacer(null);
    setError('');
    setFiltroDoc('');
    setFaseEnEdicion(fase);
    setFormFase({
      fecha: fase.fecha || hoy(),
      observaciones: fase.observaciones || '',
      id_documento: fase.documento?.id || ''
    });
    if (documentos === null || errorDocs) {
      setErrorDocs('');
      getDocumentosRespaldo(idSeleccionada)
        .then(setDocumentos)
        .catch((err) => { setDocumentos([]); setErrorDocs(err.message); });
    }
  };

  const guardarFase = async (e) => {
    e.preventDefault();
    if (!faseEnEdicion) return;
    setGuardando(true);
    setError('');
    try {
      const datos = await registrarFaseConvocatoria(idSeleccionada, faseEnEdicion.id_fase, formFase);
      actualizarAvance(datos);
      setFaseEnEdicion(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const deshacerFase = async (fase) => {
    setGuardando(true);
    setError('');
    try {
      const datos = await quitarFaseConvocatoria(idSeleccionada, fase.id_fase);
      actualizarAvance(datos);
      setConfirmarDeshacer(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // El documento elegido puede no estar en la lista filtrada; se mantiene visible en el select
  const docElegido = (documentos || []).find((d) => d.id === formFase.id_documento)
    || (faseEnEdicion?.documento?.id === formFase.id_documento ? faseEnEdicion.documento : null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 sm:p-5 mb-6">
      {/* Encabezado: siempre visible, con resumen del avance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <button
          type="button"
          onClick={alternarAbierto}
          aria-expanded={abierto}
          className="flex items-center gap-2.5 text-left cursor-pointer group min-w-0"
        >
          <span className="material-symbols-outlined text-[#0B2545] text-2xl">folder_managed</span>
          <span className="min-w-0">
            <span className="block text-sm sm:text-base font-bold text-[#0B2545] leading-tight group-hover:underline">
              Expediente del proceso de convocatoria
            </span>
            <span className="block text-xs text-slate-500">
              {avance
                ? `${cumplidas} de ${fases.length} fases cumplidas · ${conRespaldo} con documento de respaldo`
                : 'Fechas y oficios que respaldan la designación de auxiliares'}
            </span>
          </span>
          {avance && (
            <span className="hidden sm:flex items-center gap-1 ml-2" aria-hidden="true">
              {fases.map((f) => (
                <span
                  key={f.id_fase}
                  title={f.nombre}
                  className={`w-2.5 h-2.5 rounded-full ${
                    f.cumplida ? (f.documento ? 'bg-emerald-600' : 'bg-amber-400') : 'bg-slate-200'
                  }`}
                />
              ))}
            </span>
          )}
          <span className="material-symbols-outlined text-slate-400 text-xl ml-1">
            {abierto ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {convocatoriasGestion.length > 0 && (
          <div className="relative min-w-[240px]">
            <select
              id="avance-convocatoria"
              value={idSeleccionada}
              onChange={(e) => setIdSeleccionada(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] cursor-pointer"
            >
              {convocatoriasGestion.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nro_convocatoria} · Semestre {c.semestre === 2 ? 'II' : 'I'}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl">
              expand_more
            </span>
          </div>
        )}
      </div>

      {abierto && (
        <div className="mt-4">
          {convocatoriasGestion.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
              No hay convocatorias registradas para la gestión {gestion}.
            </p>
          ) : cargando && !avance ? (
            <p className="text-xs sm:text-sm text-slate-500 px-1 py-3">Cargando avance...</p>
          ) : (
            <>
              <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {fases.map((fase) => {
                  const esSiguiente = siguiente && siguiente.id_fase === fase.id_fase;
                  const esUltima = ultimaCumplida && ultimaCumplida.id_fase === fase.id_fase;
                  const enEdicion = faseEnEdicion && faseEnEdicion.id_fase === fase.id_fase;
                  const estilo = fase.cumplida
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : esSiguiente
                    ? 'border-[#C1121F]/40 bg-red-50/40'
                    : 'border-slate-200 bg-slate-50/60';

                  return (
                    <li
                      key={fase.id_fase}
                      className={`rounded-xl border p-3.5 flex flex-col gap-2 ${estilo} ${enEdicion ? 'ring-2 ring-[#0B2545]/25' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                            fase.cumplida ? 'bg-emerald-600 text-white' : esSiguiente ? 'bg-[#C1121F] text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {fase.cumplida ? <span className="material-symbols-outlined text-base">check</span> : fase.orden}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">{fase.nombre}</span>
                      </div>

                      <div className="text-xs text-slate-600">
                        {fase.cumplida ? (
                          <span>Cumplida el <strong className="text-slate-800">{formatearFechaIso(fase.fecha)}</strong></span>
                        ) : esSiguiente ? (
                          <span className="text-[#C1121F] font-medium">Fase actual · pendiente</span>
                        ) : (
                          <span className="text-slate-400">Pendiente</span>
                        )}
                      </div>

                      {/* Documento de respaldo */}
                      {fase.cumplida && (
                        fase.documento ? (
                          <div className="flex items-start gap-1.5 text-[11px] bg-white/80 border border-emerald-200 rounded-lg px-2 py-1.5">
                            <span className="material-symbols-outlined text-sm text-emerald-700">description</span>
                            <span className="min-w-0 flex-1">
                              <strong className="text-slate-800">{citarRespaldo(fase.documento)}</strong>
                              <span className="block text-slate-500 truncate" title={fase.documento.asunto}>{fase.documento.asunto}</span>
                            </span>
                            {fase.documento.tiene_archivo && (
                              <button
                                type="button"
                                onClick={() => abrirDocumentoRespaldo(fase.documento)}
                                className="text-[#0B2545] font-semibold hover:underline cursor-pointer shrink-0"
                              >
                                Ver
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Sin documento de respaldo
                          </div>
                        )
                      )}
                      {fase.cumplida && fase.observaciones && (
                        <p className="text-[11px] text-slate-500 italic leading-snug">{fase.observaciones}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto pt-1">
                        {esSiguiente && !enEdicion && (
                          <button
                            type="button"
                            onClick={() => abrirFormulario(fase)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#13315c] rounded-lg px-2.5 py-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">task_alt</span>
                            Registrar fase
                          </button>
                        )}
                        {fase.cumplida && !enEdicion && (
                          <button
                            type="button"
                            onClick={() => abrirFormulario(fase)}
                            className="text-xs font-medium text-[#0B2545] hover:underline cursor-pointer"
                          >
                            {fase.documento ? 'Editar' : 'Adjuntar respaldo'}
                          </button>
                        )}
                        {esUltima && !enEdicion && (
                          confirmarDeshacer === fase.id_fase ? (
                            <span className="flex items-center gap-2 text-xs">
                              <span className="text-slate-600">¿Deshacer?</span>
                              <button type="button" disabled={guardando} onClick={() => deshacerFase(fase)} className="font-semibold text-[#C1121F] hover:underline cursor-pointer disabled:opacity-50">Sí</button>
                              <button type="button" onClick={() => setConfirmarDeshacer(null)} className="font-medium text-slate-500 hover:underline cursor-pointer">No</button>
                            </span>
                          ) : (
                            <button type="button" onClick={() => setConfirmarDeshacer(fase.id_fase)} className="text-xs font-medium text-slate-500 hover:text-[#C1121F] hover:underline cursor-pointer">
                              Deshacer
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Formulario para registrar o corregir una fase */}
              {faseEnEdicion && (
                <form onSubmit={guardarFase} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-[#0B2545]">{faseEnEdicion.nombre}</p>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="fase-fecha" className="text-xs font-semibold text-slate-600">Fecha en que se cumplió</label>
                      <input
                        id="fase-fecha"
                        type="date"
                        required
                        value={formFase.fecha}
                        onChange={(e) => setFormFase({ ...formFase, fecha: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="fase-observaciones" className="text-xs font-semibold text-slate-600">Observaciones (opcional)</label>
                      <input
                        id="fase-observaciones"
                        type="text"
                        maxLength={500}
                        placeholder="Ej.: Aprobado en sesión del Consejo Facultativo N° 05/2026"
                        value={formFase.observaciones}
                        onChange={(e) => setFormFase({ ...formFase, observaciones: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="fase-respaldo" className="text-xs font-semibold text-slate-600">
                      Documento de respaldo (oficio expedido o recibido de {avance?.gestion ? `${avance.gestion - 1}–${avance.gestion}` : 'la gestión'})
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2">
                      <input
                        id="fase-respaldo-filtro"
                        type="search"
                        placeholder="Buscar por número o asunto..."
                        value={filtroDoc}
                        onChange={(e) => setFiltroDoc(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545]"
                      />
                      <select
                        id="fase-respaldo"
                        value={formFase.id_documento}
                        onChange={(e) => setFormFase({ ...formFase, id_documento: e.target.value })}
                        disabled={documentos === null}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] disabled:opacity-60"
                      >
                        <option value="">
                          {documentos === null ? 'Cargando documentos...' : '— Sin documento de respaldo —'}
                        </option>
                        {docElegido && !documentosFiltrados.some((d) => d.id === docElegido.id) && (
                          <option value={docElegido.id}>
                            {citarRespaldo(docElegido)} · {docElegido.asunto}
                          </option>
                        )}
                        {documentosFiltrados.map((d) => (
                          <option key={d.id} value={d.id}>
                            {citarRespaldo(d)} · {formatearFechaIso(d.fecha)} · {d.asunto}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errorDocs ? (
                      <p className="text-[11px] text-[#C1121F]">
                        No se pudo cargar la lista de oficios: {errorDocs}. Si acabas de actualizar el sistema, reinicia el backend.
                      </p>
                    ) : documentos && documentos.length === 0 && (
                      <p className="text-[11px] text-slate-500">
                        No hay oficios registrados para esas gestiones. Regístralo primero en Expedidos o Recibidos.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setFaseEnEdicion(null)} className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer">
                      Cancelar
                    </button>
                    <button type="submit" disabled={guardando} className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0B2545] rounded-lg hover:bg-[#13315c] cursor-pointer disabled:opacity-60">
                      {guardando ? 'Guardando...' : 'Guardar fase'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs sm:text-sm text-[#C1121F] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
