// src/components/auth/PasswordResetModal.jsx
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

const PasswordResetModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      setError('');
    } catch (err) {
      console.error('Error enviando email de recuperación:', err);
      
      let errorMessage = 'Error enviando el correo de recuperación';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiadas solicitudes. Intenta más tarde';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setEmailSent(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Recuperar contraseña</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          {!emailSent ? (
            <form onSubmit={handlePasswordReset}>
              <p className="modal-description">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="modal-input"
                />
              </div>
              
              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}
              
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading || !email}
                >
                  {loading ? 'Enviando...' : 'Enviar correo'}
                </button>
              </div>
            </form>
          ) : (
            <div className="success-content">
              <div className="success-icon">✓</div>
              <h3>¡Correo enviado!</h3>
              <p className="success-message">
                Se ha enviado un correo de recuperación a <strong>{email}</strong>.
                <br />
                Revisa tu bandeja de entrada y la carpeta de spam.
              </p>
              <button
                className="close-button"
                onClick={handleClose}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;