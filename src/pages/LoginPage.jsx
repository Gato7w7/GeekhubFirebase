// src/pages/LoginPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterModal from '../components/auth/RegisterModal';
import '../styles/stylelogin.css';

const LoginPage = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  const openRegisterModal = () => {
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleReactivateAccount = () => {
    navigate('/reactivate-account');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        <div className="login-container">
          <LoginForm />
          <div className="register-section">
            <p className="register-text">¿No tienes una cuenta?</p>
            <button 
              type="button" 
              className="register-button"
              onClick={openRegisterModal}
            >
              Registrarse
            </button>
          </div>
          
          <div className="reactivate-section">
            <p className="reactivate-text">¿Desactivaste tu cuenta?</p>
            <button 
              type="button" 
              className="reactivate-link"
              onClick={handleReactivateAccount}
            >
              Reactivar cuenta
            </button>
          </div>
        </div>
      </div>

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={closeRegisterModal} 
      />
    </div>
  );
};

export default LoginPage;