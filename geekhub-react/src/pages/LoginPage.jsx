import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const LoginPage = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya hay un usuario autenticado, redirigir a home
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e3e3e3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6c757d' }}>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar la página de login
  if (user) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          marginBottom: '10px',
          color: '#343a40'
        }}>
          🔐 Bienvenido
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#6c757d',
          marginBottom: '40px'
        }}>
          Inicia sesión o regístrate para continuar
        </p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '40px',
          flexWrap: 'wrap'
        }}>
          <LoginForm />
          <RegisterForm />
        </div>
      </div>
      
      {/* CSS para la animación de loading */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;