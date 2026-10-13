import React, { createContext, useContext, useState, useEffect } from 'react';

const GestionContext = createContext();

export const GestionProvider = ({ children }) => {
  const [gestion, setGestionState] = useState(() => {
    return parseInt(localStorage.getItem('gestion_seleccionada')) || 2026;
  });

  const setGestion = (year) => {
    const val = parseInt(year);
    setGestionState(val);
    localStorage.setItem('gestion_seleccionada', val);
  };

  return (
    <GestionContext.Provider value={{ gestion, setGestion }}>
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
