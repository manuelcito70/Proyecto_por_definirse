import React from 'react';

/**
 * LordIcon - Componente reutilizable para iconos animados de Lordicon.
 * Soporta colores personalizados, variables CSS (--lord-icon-primary) y currentColor automático.
 */
export default function LordIcon({
  src,
  trigger = 'hover',
  colors,
  currentColor = false,
  size = 28,
  target,
  state,
  stroke = 'regular',
  className = '',
  style = {},
  fallback = null
}) {
  if (!src) return fallback;

  const cssVars = {};
  if (colors) {
    colors.split(',').forEach(part => {
      const [k, v] = part.split(':');
      if (k && v) {
        cssVars[`--lord-icon-${k.trim()}`] = v.trim();
      }
    });
  }

  return (
    <lord-icon
      src={src}
      trigger={trigger}
      colors={colors}
      current-color={currentColor ? "" : undefined}
      stroke={stroke}
      target={target}
      state={state}
      class={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...cssVars,
        ...style
      }}
    >
      {fallback}
    </lord-icon>
  );
}
