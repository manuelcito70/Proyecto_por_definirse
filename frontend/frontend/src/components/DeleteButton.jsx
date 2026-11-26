import React, { useId } from 'react';
import './DeleteButton.css';

export default function DeleteButton({ onClick, title = 'Eliminar', className = '' }) {
  const maskId = useId();

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`bin-button ${className}`}
    >
      <svg className="bin-top" viewBox="0 0 39 7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line y1={5} x2={39} y2={5} stroke="white" strokeWidth={4} />
        <line x1={12} y1="1.5" x2="26.0357" y2="1.5" stroke="white" strokeWidth={3} />
      </svg>
      <svg className="bin-bottom" viewBox="0 0 33 39" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id={maskId} fill="white">
          <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
        </mask>
        <path
          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
          fill="white"
          mask={`url(#${maskId})`}
        />
        <path d="M12 6L12 29" stroke="white" strokeWidth={4} />
        <path d="M21 6V29" stroke="white" strokeWidth={4} />
      </svg>
    </button>
  );
}
