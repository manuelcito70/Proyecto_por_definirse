import React from 'react';
import './SuccessModal.css';

/**
 * SuccessModal - Modal de confirmación institucional con animación interactiva Typewriter.
 * Se muestra cuando se crea, actualiza o guarda un registro exitosamente.
 */
export default function SuccessModal({
  isOpen,
  onClose,
  title = "¡Operación Exitosa!",
  badge,
  message = "El registro ha sido procesado y guardado correctamente en el sistema institucional.",
  actionText = "Aceptar y Continuar",
  onAction,
  secondaryActionText,
  onSecondaryAction
}) {
  if (!isOpen) return null;

  const handlePrimaryClick = () => {
    if (onAction) {
      onAction();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#c5a059]/40 transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0b2545] via-[#c5a059] to-[#c1121f]"></div>

        <div className="p-6 sm:p-7 flex flex-col items-center text-center">
          {/* Animated Typewriter (Máquina de Escribir Oficial) */}
          <div className="typewriter-wrap mb-2">
            <div className="typewriter-glow"></div>
            <div className="typewriter">
              <div className="slide"><i></i></div>
              <div className="paper"></div>
              <div className="keyboard"></div>
            </div>
          </div>

          {/* Badge (Optional: Correlativo or Code) */}
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-label-code text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {badge}
            </span>
          )}

          {/* Title */}
          <h3 className="font-institutional-serif text-xl sm:text-2xl font-bold text-[#0b2545] tracking-tight">
            {title}
          </h3>

          {/* Message */}
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-2 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-2.5 mt-6 pt-4 border-t border-slate-100">
            {secondaryActionText && (
              <button
                type="button"
                onClick={onSecondaryAction || onClose}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 bg-surface-container-low hover:bg-surface-container text-[#0b2545] font-body-sm text-body-sm font-semibold transition-colors cursor-pointer"
              >
                {secondaryActionText}
              </button>
            )}
            <button
              type="button"
              onClick={handlePrimaryClick}
              className={`w-full ${secondaryActionText ? 'sm:w-1/2' : ''} py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0b2545] to-[#15418c] hover:opacity-95 text-white font-body-sm text-body-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2`}
            >
              <span>{actionText}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Institutional Footer Seal */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-500 text-[11px] font-label-code">
          <span className="material-symbols-outlined text-xs text-[#c5a059]">verified_user</span>
          <span>DIRECCIÓN DE CARRERA · SISTEMAS FINI UAGRM</span>
        </div>
      </div>
    </div>
  );
}
