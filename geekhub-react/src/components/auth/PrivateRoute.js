import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Usuario no autenticado: redirigir a login
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado: mostrar el contenido
  return children;
};

export default PrivateRoute;
