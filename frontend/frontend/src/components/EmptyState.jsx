import React from 'react';
import LordIcon from './LordIcon';

/**
 * EmptyState - Componente institucional de estado vacío con animación de búsqueda.
 * Usado cuando una tabla o módulo no contiene registros o no coincide con los filtros.
 */
export default function EmptyState({
  title = "No se encontraron registros",
  message = "No existen registros que coincidan con los criterios de búsqueda o para la gestión seleccionada.",
  actionText,
  onAction,
  iconSize = 64
}) {
  return (
    <div className="flex flex-col items-center justify-center p-space-2xl text-center bg-white/60 rounded-xl border border-dashed border-slate-300 my-space-md">
      <div className="p-3 bg-gradient-to-br from-slate-50 to-amber-50/40 rounded-full border border-slate-200/80 shadow-2xs mb-space-md">
        <LordIcon
          src="https://cdn.lordicon.com/msoeawqm.json"
          trigger="loop"
          colors="primary:#0b2545,secondary:#c5a059"
          size={iconSize}
          fallback={<span className="material-symbols-outlined text-4xl text-[#0b2545]">search_off</span>}
        />
      </div>

      <h4 className="font-institutional-serif text-lg font-bold text-[#0b2545] tracking-tight">
        {title}
      </h4>

      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1 leading-relaxed">
        {message}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-space-md inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-[#0b2545] text-white hover:bg-[#c1121f] text-caption font-label-code font-bold transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
