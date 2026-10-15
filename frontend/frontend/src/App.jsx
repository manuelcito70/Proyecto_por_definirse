import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import Layout from './components/Layout';
import PanelControl from './components/PanelControl';
import Recibidos from './components/Recibidos';
import Expedidos from './components/Expedidos';
import Actas from './components/Actas';
import Auxiliares from './components/Auxiliares';
import Docentes from './components/Docentes';
import IntroAnimation from './components/IntroAnimation';
import { GestionProvider } from './context/GestionContext';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showIntro, setShowIntro] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setShowIntro(true);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const MainContent = () => {
    if (!isAuthenticated) {
      return <AuthPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/panel" replace />} />
          <Route path="/panel" element={<PanelControl />} />
          <Route path="/recibidos" element={<Recibidos />} />
          <Route path="/expedidos" element={<Expedidos />} />
          <Route path="/actas" element={<Actas />} />
          <Route path="/auxiliares" element={<Auxiliares />} />
          <Route path="/docentes" element={<Docentes />} />
          <Route path="*" element={<Navigate to="/panel" replace />} />
        </Routes>
      </Layout>
    );
  };

  return (
    <GestionProvider>
      <Routes>
        <Route path="/*" element={<MainContent />} />
      </Routes>
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
    </GestionProvider>
  );
}

export default App;