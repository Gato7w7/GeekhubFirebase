// src/pages/LoginPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import '../styles/stylelogin.css'; // Import your styles

const LoginPage = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="login-loading-container">
        <div className="login-loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="login-page-container">
      <div className="login-page-content">
        {/* <h1 className="login-page-title">Bienvenido</h1>
        <p className="login-page-subtitle">Inicia sesión o regístrate para continuar</p> */}

        <div className="login-forms-wrapper">
          <LoginForm />
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
