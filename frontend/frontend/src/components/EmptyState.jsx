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
    <div className="flex flex-col items-center justify-center p-space-2xl text-center bg-white/60 dark:bg-slate-900/35 dark:backdrop-blur-md rounded-xl border border-dashed border-slate-300 dark:border-slate-500/35 my-space-md">
      <div className="p-3 bg-gradient-to-br from-slate-50 to-amber-50/40 dark:from-slate-800/50 dark:to-slate-900/50 rounded-full border border-slate-200/80 dark:border-slate-500/30 shadow-2xs mb-space-md">
        <LordIcon
          src="https://cdn.lordicon.com/msoeawqm.json"
          trigger="loop"
          colors="primary:#0b2545,secondary:#c5a059"
          size={iconSize}
          fallback={<span className="material-symbols-outlined text-4xl text-[#0b2545] dark:text-slate-200">search_off</span>}
        />
      </div>

      <h4 className="font-institutional-serif text-lg font-bold text-[#0b2545] dark:text-slate-100 tracking-tight">
        {title}
      </h4>

      <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300 max-w-md mt-1 leading-relaxed">
        {message}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-space-md inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-lg bg-[#0b2545] dark:bg-[#1e3a8a]/80 text-white hover:bg-[#c1121f] dark:hover:bg-[#c1121f] text-caption font-label-code font-bold transition-all shadow-sm cursor-pointer border border-transparent dark:border-white/15"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
