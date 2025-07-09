// src/pages/ReactivateAccountPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import '../styles/stylelogin.css'; // Reutilizando estilos del login

const ReactivateAccountPage = () => {
  const navigate = useNavigate();
  const { updateUserStatus } = useAuthContext();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes cuando el usuario empiece a escribir
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Intentar iniciar sesión para verificar credenciales
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;

      // Verificar si el usuario existe en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setError('Usuario no encontrado en la base de datos.');
        await signOut(auth); // Cerrar sesión si no existe en Firestore
        return;
      }

      const userData = userDoc.data();

      // Verificar si la cuenta está desactivada
      if (userData.status !== 'inactive') {
        setError('Esta cuenta no está desactivada. Puedes iniciar sesión normalmente.');
        await signOut(auth); // Cerrar sesión
        return;
      }

      // Reactivar la cuenta
      await updateDoc(userDocRef, {
        status: 'active',
        reactivatedAt: new Date().toISOString()
      });

      // Actualizar el estado en el contexto
      updateUserStatus('active');

      setSuccess('¡Cuenta reactivada exitosamente! Serás redirigido al inicio...');
      
      // Redirigir al home después de un breve delay
      setTimeout(() => {
        navigate('/home');
      }, 2000);

    } catch (error) {
      console.error('Error al reactivar cuenta:', error);
      
      // Manejar diferentes tipos de errores
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No se encontró ningún usuario con este correo electrónico.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta.');
          break;
        case 'auth/invalid-email':
          setError('Correo electrónico no válido.');
          break;
        case 'auth/user-disabled':
          setError('Esta cuenta ha sido deshabilitada.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Intenta más tarde.');
          break;
        default:
          setError('Error al reactivar la cuenta. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        <div className="login-container">
          <h2 className="login-title">Reactivar Cuenta</h2>
          <p className="reactivate-description">
            Ingresa tu correo electrónico y contraseña para reactivar tu cuenta.
          </p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="tu@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="form-input"
                placeholder="Tu contraseña"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Reactivando...' : 'Reactivar Cuenta'}
            </button>
          </form>

          <div className="back-to-login">
            <button 
              type="button"
              className="reactivate-link"
              onClick={handleBackToLogin}
            >
            Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactivateAccountPage;