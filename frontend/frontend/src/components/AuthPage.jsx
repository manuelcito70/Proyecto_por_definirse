import React, { useState, useEffect } from 'react';
import { login, resendVerification } from '../services/auth';
import './AuthPage.css';

const FALLBACK_CARRERAS = [
  'Administración de Empresas',
  'Ciencias de la Educación',
  'Contaduría Pública',
  'Enfermería',
  'Ingeniería Agropecuaria',
  'Ingeniería Comercial',
  'Ingeniería de Sistemas',
  'Ingeniería en Redes y Telecomunicaciones',
  'Ingeniería Financiera',
  'Ingeniería Industrial',
  'Ingeniería Informática',
  'Medicina Veterinaria y Zootecnia'
];

function AuthPage({ onLoginSuccess }) {
  const [isActive, setIsActive] = useState(false); // false = Sign In, true = Sign Up
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendPrompt, setShowResendPrompt] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState({ text: '', type: '' });
  const [registerMessage, setRegisterMessage] = useState({ text: '', type: '' });
  const [carreras, setCarreras] = useState(FALLBACK_CARRERAS);

  useEffect(() => {
    fetch('/api/carreras')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCarreras(data.map((c) => c.nombre));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-limpiar mensajes despues de 6 segundos
  useEffect(() => {
    if (loginMessage.text) {
      const timer = setTimeout(() => setLoginMessage({ text: '', type: '' }), 6000);
      return () => clearTimeout(timer);
    }
  }, [loginMessage]);

  useEffect(() => {
    if (registerMessage.text) {
      const timer = setTimeout(() => setRegisterMessage({ text: '', type: '' }), 6000);
      return () => clearTimeout(timer);
    }
  }, [registerMessage]);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    nombre: '',
    email: '',
    password: '',
    cargo: '',
    carrera: ''
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

  const handleResendVerification = async (targetEmail) => {
    const emailToSend = (targetEmail || resendEmail || loginData.email || '').trim();
    if (!emailToSend) {
      setLoginMessage({ text: 'Por favor ingresa tu correo electrónico para reenviar el enlace.', type: 'error' });
      return;
    }

    try {
      setIsResending(true);
      const res = await resendVerification(emailToSend);
      setLoginMessage({
        text: res.mensaje || '¡Enlace reenviado! Revisa tu bandeja de entrada o spam.',
        type: 'success'
      });
      setShowResendPrompt(false);
    } catch (err) {
      setLoginMessage({
        text: err.message || 'Error al reenviar enlace de verificación.',
        type: 'error'
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage({ text: '', type: '' });

    if (!loginData.email || !loginData.password) {
      setLoginMessage({ text: 'Por favor completa todos los campos', type: 'error' });
      return;
    }

    try {
      setIsLoading(true);
      const data = await login(loginData.email, loginData.password);
      onLoginSuccess(data.user);
    } catch (error) {
      console.error(error);
      if (error.no_verificado) {
        setShowResendPrompt(true);
        setResendEmail(loginData.email);
      }
      setLoginMessage({ text: error.message || 'Error al iniciar sesion', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage({ text: '', type: '' });

    if (!registerData.email || !registerData.password || !registerData.nombre) {
      setRegisterMessage({ text: 'Por favor completa todos los campos requeridos', type: 'error' });
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterMessage({ text: 'La contrasena debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        email: registerData.email.trim(),
        password: registerData.password,
        nombre: registerData.nombre.trim(),
        cargo: registerData.cargo,
        carrera: registerData.carrera || undefined
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'Error al registrar usuario');

      // Limpiar formulario y mostrar mensaje de verificacion
      setRegisterData({ nombre: '', email: '', password: '', cargo: '', carrera: '' });
      setRegisterMessage({ text: data.mensaje || 'Revisa tu correo electronico para confirmar tu cuenta.', type: 'success' });

      // Pasar al login despues de 3 segundos
      setTimeout(() => {
        setLoginData({ email: payload.email, password: '' });
        setLoginMessage({ text: 'Revisa tu bandeja de entrada y confirma tu correo antes de iniciar sesion.', type: 'success' });
        setIsActive(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      setRegisterMessage({ text: error.message || 'Error al registrar usuario', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-sliding-container ${isActive ? 'active' : ''}`} id="container">
        
        {/* FORMULARIO DE REGISTRO (Sign Up) */}
        <div className="form-container sign-up">
          <form className="auth-form" onSubmit={handleRegisterSubmit} autoComplete="off">
            <div className="form-brand">
              <img src="/logo-ichilo.png?v=2" alt="Logo FINI" className="brand-logo" />
              <h2>Crear Cuenta</h2>
              <p className="brand-subtitle">SIGAD - Direccion de Carrera</p>
            </div>

            {registerMessage.text && (
              <div className={`auth-message ${registerMessage.type}`}>
                {registerMessage.type === 'error' ? '\u26A0\uFE0F' : '\u2709\uFE0F'} {registerMessage.text}
              </div>
            )}

            <div className="form-scrollable">
              <div className="input-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej. Juan Perez"
                  value={registerData.nombre}
                  onChange={handleRegisterChange}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="input-group">
                <label>Cargo / Funcion</label>
                <input
                  type="text"
                  name="cargo"
                  placeholder="Ej: Directora, Secretaria"
                  value={registerData.cargo}
                  onChange={handleRegisterChange}
                  autoComplete="off"
                />
              </div>

              <div className="input-group">
                <label>Direccion de Carrera</label>
                <input
                  type="text"
                  name="carrera"
                  list="carreras-list"
                  placeholder="Ej: Ingeniería en..."
                  value={registerData.carrera}
                  onChange={handleRegisterChange}
                  autoComplete="off"
                  required
                />
                <datalist id="carreras-list">
                  {carreras.map((nombre) => (
                    <option key={nombre} value={nombre} />
                  ))}
                </datalist>
              </div>

              <div className="input-group">
                <label>Correo Electronico</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Ej: nombre@gmail.com"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  autoComplete="off"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  required
                />
              </div>

              <div className="input-group">
                <label>Contrasena</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Ej: Minimo 6 caracteres"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  autoComplete="new-password"
                  readOnly
                  onFocus={(e) => e.target.removeAttribute('readonly')}
                  minLength="6"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Registrarse'}
            </button>

            <div className="mobile-toggle">
              <span>Ya tienes cuenta?</span>
              <button type="button" onClick={() => setIsActive(false)}>Iniciar Sesion</button>
            </div>
          </form>
        </div>

        {/* FORMULARIO DE INICIO DE SESION (Sign In) */}
        <div className="form-container sign-in">
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-brand">
              <img src="/logo-ichilo.png?v=2" alt="Logo FINI" className="brand-logo" />
              <h2>SIGAD FINI</h2>
              <p className="brand-subtitle">Direccion de Carrera - UAGRM</p>
            </div>

            {loginMessage.text && (
              <div className={`auth-message ${loginMessage.type}`}>
                {loginMessage.type === 'error' ? '\u26A0\uFE0F' : '\u2709\uFE0F'} {loginMessage.text}
              </div>
            )}

            {showResendPrompt && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '14px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1d4ed8', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                  <span>✉️</span>
                  <span>¿No recibiste el enlace de activación?</span>
                </div>
                <p style={{ color: '#1e40af', fontSize: '12px', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  Podemos enviarte un nuevo enlace a tu correo:
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="email"
                    placeholder="tu-correo@ejemplo.com"
                    value={resendEmail || loginData.email}
                    onChange={(e) => setResendEmail(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      background: '#ffffff',
                      color: '#0f172a'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleResendVerification(resendEmail || loginData.email)}
                    disabled={isResending}
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isResending ? 'Enviando...' : 'Reenviar enlace'}
                  </button>
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Correo Electronico</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  name="email"
                  placeholder="Ej: nombre@gmail.com"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Contrasena</label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  name="password"
                  placeholder="Ej: Tu contrasena"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  required
                />
              </div>
            </div>

            <div className="forgot-password" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); setLoginMessage({ text: 'Por favor contacta al administrador del sistema para restablecer tu clave.', type: 'error' }); }}>
                Olvidaste tu contrasena?
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowResendPrompt(!showResendPrompt);
                  setResendEmail(loginData.email);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Reenviar activación
              </button>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Iniciando Sesion...' : 'Iniciar Sesion'}
            </button>

            <div className="mobile-toggle">
              <span>No tienes una cuenta?</span>
              <button type="button" onClick={() => setIsActive(true)}>Registrarse</button>
            </div>
          </form>
        </div>

        {/* CONTENEDOR DESLIZANTE DE TRANSICION */}
        <div className="toggle-container">
          <div className="toggle">
            
            {/* PANEL IZQUIERDO */}
            <div className="toggle-panel toggle-left">
              <div className="toggle-icon-badge">
                <img src="/logo-uagrm.png" alt="UAGRM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h1>Bienvenido de Nuevo!</h1>
              <p>
                Si ya posees una cuenta registrada en el Sistema de Gestion Documental FINI, ingresa tus credenciales para continuar.
              </p>
              <button className="toggle-action-btn" id="login" onClick={() => setIsActive(false)}>
                Iniciar Sesion
              </button>
            </div>

            {/* PANEL DERECHO */}
            <div className="toggle-panel toggle-right">
              <div className="toggle-icon-badge">
                <img src="/logo-uagrm.png" alt="UAGRM Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h1>Hola, Bienvenido!</h1>
              <p>
                Registrate con tus datos para acceder a SIGAD - Direccion de Carrera de la Facultad Integral de Ichilo.
              </p>
              <button className="toggle-action-btn" id="register" onClick={() => setIsActive(true)}>
                Registrarse
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Pie de Pagina Institucional */}
      <footer className="auth-footer-bottom">
        <p>&copy; 2026 Universidad Autonoma Gabriel Rene Moreno &mdash; Facultad Integral de Ichilo</p>
      </footer>
    </div>
  );
}

export default AuthPage;