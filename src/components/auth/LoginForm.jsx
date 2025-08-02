// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';
import PasswordResetModal from './PasswordResetModal';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const navigate = useNavigate();
  const { checkOnlineStatus, setUserOnline } = useAuthContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userRole = 'user';
      let userStatus = 'active';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role || 'user';
        userStatus = userData.status || 'active';
      }

      if (userStatus === 'inactive') {
        await signOut(auth);
        setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
        setLoading(false);
        return;
      }

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
      }

      try {
        await setUserOnline(user.uid);
      } catch (statusError) {
        console.error('Error marcando usuario como online:', statusError);
      }

      // Redirección comentada
      // if (userRole === 'admin') {
      //   navigate('/admin');
      // } else {
      //   navigate('/home');
      // }

    } catch (err) {
      console.error('Error en login:', err);
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

  const openPasswordResetModal = () => {
    setIsPasswordResetModalOpen(true);
  };

  const closePasswordResetModal = () => {
    setIsPasswordResetModalOpen(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Iniciar sesión</h2>

        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group password-input-group">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="password-input"
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={togglePasswordVisibility}
            disabled={loading}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              // Ojo cerrado (ocultar)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              // Ojo abierto (mostrar)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        <div className="forgot-password-section">
          <span
            className="forgot-password-link"
            onClick={openPasswordResetModal}
          >
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
      </form>

      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={closePasswordResetModal}
      />
    </div>
  );
};

export default LoginForm;