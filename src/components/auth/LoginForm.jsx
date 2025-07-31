// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { checkOnlineStatus, setUserOnline } = useAuthContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verificar datos del usuario en Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userRole = 'user';
      let userStatus = 'active';
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role || 'user';
        userStatus = userData.status || 'active';
      }

      // Verificar si el usuario está activo
      if (userStatus === 'inactive') {
        await signOut(auth);
        setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Verificar si el usuario ya está online (sesión activa)
      try {
        const onlineStatus = await checkOnlineStatus(user.uid);
        if (onlineStatus.isOnline) {
          await signOut(auth);
          setError('Esta cuenta ya tiene una sesión activa. Cierra la otra sesión primero.');
          setLoading(false);
          return;
        }
      } catch (statusError) {
        console.error('Error verificando estado online:', statusError);
        // Continuar con el login si hay error verificando el estado
      }

      // Marcar usuario como online
      try {
        await setUserOnline(user.uid);
      } catch (statusError) {
        console.error('Error marcando usuario como online:', statusError);
        // Continuar con el login aunque falle marcar como online
      }

      // Redirigir según el rol
      // if (userRole === 'admin') {
      //   navigate('/admin');
      // } else {
      //   navigate('/home');
      // }
      
    } catch (err) {
      console.error('Error en login:', err);
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error en el login';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'Esta cuenta ha sido deshabilitada';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
      } else {
        errorMessage = 'Credenciales inválidas o error en el login';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Por favor ingresa tu email primero');
      return;
    }

    setResetLoading(true);
    setError('');
    setResetEmailSent(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
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
      setResetLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Iniciar sesión</h2>
        
        <div>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={loading}
          />
        </div>
        
        <div>
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
        
        {/* Botón para recuperar contraseña */}
        <button 
          type="button" 
          className="forgot-password-button"
          onClick={handlePasswordReset}
          disabled={resetLoading || !email}
        >
          {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
        </button>
        
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        
        {resetEmailSent && (
          <p className="success-message">
            Se ha enviado un correo de recuperación a {email}. 
            Revisa tu bandeja de entrada y spam.
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginForm;