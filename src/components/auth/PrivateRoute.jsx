// src/components/auth/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuthContext();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado: mostrar el contenido
  return children;
};

export default PrivateRoute;