import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AuthPage.css';

function VerifyEmail({ onResetSession }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState(null);
  const hasVerified = useRef(false);

  const handleGoToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onResetSession) onResetSession();
    navigate('/');
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendFeedback({ type: 'error', text: 'Por favor escribe tu correo electrónico.' });
      return;
    }
    try {
      setIsResending(true);
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al reenviar');
      setResendFeedback({
        type: 'success',
        text: data.mensaje || '¡Enlace reenviado con éxito! Revisa tu bandeja de entrada o spam.'
      });
    } catch (err) {
      setResendFeedback({ type: 'error', text: err.message || 'Error al reenviar enlace' });
    } finally {
      setIsResending(false);
    }
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
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{message}</p>

            {/* Formulario para reenviar enlace de verificación */}
            <form onSubmit={handleResend} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px 20px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 6px 0' }}>
                ¿El enlace expiró o no funciona? Solicita uno nuevo:
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                Ingresa tu correo para recibir un nuevo enlace de activación:
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="tu-correo@ejemplo.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={isResending}
                  style={{
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isResending ? 'Enviando...' : 'Reenviar'}
                </button>
              </div>
              {resendFeedback && (
                <p style={{
                  fontSize: '12px',
                  marginTop: '10px',
                  marginBottom: '0',
                  color: resendFeedback.type === 'success' ? '#166534' : '#dc2626',
                  fontWeight: '600'
                }}>
                  {resendFeedback.text}
                </p>
              )}
            </form>

            <button
              onClick={handleGoToLogin}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                padding: '12px 28px',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer'
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
