import React, { useState } from 'react';
import './AuthPage.css';

function AuthPage({ onLoginSuccess }) {
  const [isActive, setIsActive] = useState(false); // false = Sign In, true = Sign Up
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    nombre: '',
    username: '',
    password: '',
    cargo: 'Directora'
  });

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password || !registerData.nombre) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        username: registerData.username,
        password: registerData.password,
        nombre: registerData.nombre,
        cargo: registerData.cargo
      };

      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'Error al registrar usuario');
      alert(data.mensaje || 'Cuenta creada exitosamente. Ya puedes iniciar sesión.');
      setIsActive(false); // Cambiar a inicio de sesión
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-sliding-container ${isActive ? 'active' : ''}`} id="container">
        
        {/* FORMULARIO DE REGISTRO (Sign Up) */}
        <div className="form-container sign-up">
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-brand">
              <img src="/logo-ichilo.png?v=2" alt="Logo FINI" className="brand-logo" />
              <h2>Crear Cuenta</h2>
              <p className="brand-subtitle">SIGAD - Dirección de Carrera</p>
            </div>

            <div className="form-scrollable">
              <div className="input-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej. Juan Pérez"
                  value={registerData.nombre}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Usuario</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Ej: directora"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Cargo / Función</label>
                <input
                  type="text"
                  name="cargo"
                  placeholder="Opcional, por defecto: Directora"
                  value={registerData.cargo}
                  onChange={handleRegisterChange}
                />
              </div>

              <div className="input-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  minLength="6"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </button>

            <div className="mobile-toggle">
              <span>¿Ya tienes cuenta?</span>
              <button type="button" onClick={() => setIsActive(false)}>Iniciar Sesión</button>
            </div>
          </form>
        </div>

        {/* FORMULARIO DE INICIO DE SESIÓN (Sign In) */}
        <div className="form-container sign-in">
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-brand">
              <img src="/logo-ichilo.png?v=2" alt="Logo FINI" className="brand-logo" />
              <h2>SIGAD FINI</h2>
              <p className="brand-subtitle">Dirección de Carrera - UAGRM</p>
            </div>

            <div className="input-group">
              <label>Usuario</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="text"
                  name="username"
                  placeholder="Ej: directora"
                  value={loginData.username}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="forgot-password">
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Por favor contacta al administrador del sistema para restablecer tu clave.'); }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>

            <div className="mobile-toggle">
              <span>¿No tienes una cuenta?</span>
              <button type="button" onClick={() => setIsActive(true)}>Registrarse</button>
            </div>
          </form>
        </div>

        {/* CONTENEDOR DESLIZANTE DE TRANSICIÓN */}
        <div className="toggle-container">
          <div className="toggle">
            
            {/* PANEL IZQUIERDO */}
            <div className="toggle-panel toggle-left">
              <div className="toggle-icon-badge">
                <img src="/logo-uagrm.png" alt="UAGRM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h1>¡Bienvenido de Nuevo!</h1>
              <p>
                Si ya posees un usuario registrado en el Sistema de Gestión Documental FINI, ingresa tus credenciales para continuar.
              </p>
              <button className="toggle-action-btn" id="login" onClick={() => setIsActive(false)}>
                Iniciar Sesión
              </button>
            </div>

            {/* PANEL DERECHO */}
            <div className="toggle-panel toggle-right">
              <div className="toggle-icon-badge">
                <img src="/logo-uagrm.png" alt="UAGRM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h1>¡Hola, Bienvenido!</h1>
              <p>
                Regístrate con tus datos para acceder a SIGAD - Dirección de Carrera de la Facultad Integral de Ichilo.
              </p>
              <button className="toggle-action-btn" id="register" onClick={() => setIsActive(true)}>
                Registrarse
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Pie de Página Institucional */}
      <footer className="auth-footer-bottom">
        <p>© 2026 Universidad Autónoma Gabriel René Moreno — Facultad Integral de Ichilo</p>
      </footer>
    </div>
  );
}

export default AuthPage;