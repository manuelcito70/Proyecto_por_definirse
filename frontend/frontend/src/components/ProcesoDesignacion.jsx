import React from 'react';
import { abrirDocumentoRespaldo } from '../services/api';
import { formatearFechaIso, citarRespaldo } from '../utils/documentoOficial';

/**
 * Muestra, dentro del expediente de un auxiliar, las fases de la convocatoria
 * por la que fue designado: fecha de cada una y el oficio que la respalda.
 */
export default function ProcesoDesignacion({ avance, cargando, error }) {
  if (cargando && !avance) {
    return <p className="text-xs text-slate-500 px-1">Cargando proceso de la convocatoria...</p>;
  }
  if (error) {
    return <p className="text-xs text-[#C1121F] bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>;
  }
  if (!avance) {
    return (
      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
        Este auxiliar no está vinculado a una convocatoria registrada.
      </p>
    );
  }

  const cumplidas = avance.fases.filter((f) => f.cumplida).length;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700">
          Proceso de designación · {avance.nro_convocatoria}
        </span>
        <span className={`font-semibold ${cumplidas === avance.fases.length ? 'text-emerald-700' : 'text-amber-700'}`}>
          {cumplidas}/{avance.fases.length} fases
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {avance.fases.map((f) => (
          <li key={f.id_fase} className="flex items-start gap-2.5 text-xs">
            <span
              className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                f.cumplida ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {f.cumplida ? <span className="material-symbols-outlined text-xs">check</span> : f.orden}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className={`font-semibold ${f.cumplida ? 'text-slate-800' : 'text-slate-400'}`}>{f.nombre}</span>
                <span className={f.cumplida ? 'text-slate-600' : 'text-slate-400'}>
                  {f.cumplida ? formatearFechaIso(f.fecha) : 'Pendiente'}
                </span>
              </div>
              {f.cumplida && (
                f.documento ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
                    <span className="material-symbols-outlined text-xs text-emerald-700">description</span>
                    <span className="truncate" title={f.documento.asunto}>
                      {citarRespaldo(f.documento)} · {f.documento.asunto}
                    </span>
                    {f.documento.tiene_archivo && (
                      <button
                        type="button"
                        onClick={() => abrirDocumentoRespaldo(f.documento)}
                        className="text-[#0B2545] font-semibold hover:underline cursor-pointer shrink-0"
                      >
                        Ver
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-amber-700">Sin documento de respaldo</span>
                )
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
