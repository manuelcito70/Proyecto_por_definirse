import React from 'react';
import LordIcon from './LordIcon';

/**
 * LoadingState - Componente institucional de carga con animación interactiva.
 * Usado mientras se obtienen datos del backend o se procesa una solicitud.
 */
export default function LoadingState({
  message = "Sincronizando registros con servidor FINI...",
  submessage = "Facultad Integral del Ichilo · Universidad Autónoma Gabriel René Moreno",
  size = 56
}) {
  return (
    <div className="flex flex-col items-center justify-center p-space-2xl text-center bg-white/70 rounded-xl border border-slate-200/80 shadow-2xs my-space-md">
      <div className="p-2.5 bg-gradient-to-br from-blue-50 to-amber-50/50 rounded-2xl border border-[#c5a059]/30 shadow-sm mb-space-sm">
        <LordIcon
          src="https://cdn.lordicon.com/uwinmnkh.json"
          trigger="loop"
          colors="primary:#0b2545,secondary:#c1121f"
          size={size}
          fallback={<span className="material-symbols-outlined text-4xl text-[#0b2545] animate-spin">sync</span>}
        />
      </div>

      <p className="font-institutional-serif text-base font-bold text-[#0b2545] tracking-tight">
        {message}
      </p>

      {submessage && (
        <span className="font-label-code text-[11px] text-on-surface-variant font-medium mt-1">
          {submessage}
        </span>
      )}
    </div>
  );
}
