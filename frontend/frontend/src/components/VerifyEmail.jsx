import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AuthPage.css';

function VerifyEmail({ onResetSession }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  const handleGoToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onResetSession) onResetSession();
    navigate('/');
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No se encontro un token de verificacion en el enlace.');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_URL}/verify-email?token=${token}`);
        const data = await response.json();

        if (data.ok) {
          setStatus('success');
          setMessage(data.mensaje || 'Correo verificado exitosamente!');
        } else {
          setStatus('error');
          setMessage(data.mensaje || 'No se pudo verificar el correo.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Error de conexion al servidor.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderRadius: '28px',
        boxShadow: '0 30px 70px rgba(0, 0, 0, 0.55)',
        padding: '50px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center'
      }}>
        <img src="/logo-ichilo.png?v=2" alt="Logo FINI" style={{ maxHeight: '70px', marginBottom: '20px' }} />
        
        {status === 'loading' && (
          <>
            <h2 style={{ color: '#0f172a', marginBottom: '12px' }}>Verificando tu correo...</h2>
            <p style={{ color: '#64748b' }}>Por favor espera un momento.</p>
            <div style={{ margin: '30px auto', width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>&#x2705;</div>
            <h2 style={{ color: '#166534', marginBottom: '12px' }}>Correo Verificado!</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>{message}</p>
            <button
              onClick={handleGoToLogin}
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                color: 'white',
                padding: '14px 36px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(29, 78, 216, 0.35)'
              }}
            >
              Ir a Iniciar Sesion
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>&#x26A0;&#xFE0F;</div>
            <h2 style={{ color: '#991b1b', marginBottom: '12px' }}>Error de Verificacion</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>{message}</p>
            <button
              onClick={handleGoToLogin}
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                color: 'white',
                padding: '14px 36px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(29, 78, 216, 0.35)'
              }}
            >
              Volver al Inicio
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <footer className="auth-footer-bottom">
        <p>&copy; 2026 Universidad Autonoma Gabriel Rene Moreno</p>
      </footer>
    </div>
  );
}

export default VerifyEmail;
