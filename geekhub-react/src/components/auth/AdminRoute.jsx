// src/components/auth/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, userRole, loading } = useAuthContext();

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
            borderTop: '4px solid #dc3545',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6c757d' }}>Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, redirigir a home
  if (userRole !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  // Si es admin autenticado, mostrar el contenido
  return children;
};

export default AdminRoute;