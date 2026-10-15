import React, { createContext, useContext, useState, useEffect } from 'react';

const GestionContext = createContext();

export const GestionProvider = ({ children }) => {
  const currentSystemYear = new Date().getFullYear();

  const [gestion, setGestionState] = useState(() => {
    // Si el usuario seleccionó manualmente una gestión histórica en esta sesión, respetarla.
    const isManualArchive = sessionStorage.getItem('gestion_es_archivo') === 'true';
    const saved = sessionStorage.getItem('gestion_seleccionada') || localStorage.getItem('gestion_seleccionada');
    if (saved && isManualArchive) {
      return parseInt(saved);
    }
    // Por defecto toma automáticamente el año real actual de la computadora (ej. 2027)
    return currentSystemYear;
  });

  const setGestion = (year) => {
    const val = parseInt(year);
    setGestionState(val);
    localStorage.setItem('gestion_seleccionada', val);
    sessionStorage.setItem('gestion_seleccionada', val);
    if (val !== currentSystemYear) {
      sessionStorage.setItem('gestion_es_archivo', 'true');
    } else {
      sessionStorage.removeItem('gestion_es_archivo');
    }
  };

  return (
    <GestionContext.Provider value={{ gestion, setGestion, currentSystemYear }}>
      {children}
    </GestionContext.Provider>
  );
};

export const useGestion = () => {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error('useGestion debe usarse dentro de GestionProvider');
  }
  return context;
};
