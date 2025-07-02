// src/components/auth/RegisterModal.jsx
import React, { useEffect } from 'react';
import RegisterForm from './RegisterForm';
import '../../styles/registermodal.css';

const RegisterModal = ({ isOpen, onClose }) => {
  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Cerrar modal al hacer click en el overlay
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Crear Cuenta</h2>
          <button 
            className="modal-close-button" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <RegisterForm onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;