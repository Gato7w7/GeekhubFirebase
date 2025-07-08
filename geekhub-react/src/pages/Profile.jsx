import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import '../styles/stylehome.css'; // Reutilizando los estilos del home

export default function Profile() {
  const { user, userRole } = useAuthContext();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Obtener datos del usuario desde Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error al obtener perfil del usuario:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      setLoggingOut(false);
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleEditProfile = () => {
    // Funcionalidad para editar perfil - por implementar
    console.log('Editar perfil - funcionalidad por implementar');
  };

  const handleDesactivateAccount = () => {
    // Funcionalidad para desactivar cuenta - por implementar
    console.log('Desactivar cuenta - funcionalidad por implementar');
  };

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-left">
          <h1 className="app-title">GeekHub - Perfil</h1>
        </div>
        <div className="header-right">
          <span className="user-email">{user?.email || 'Sin email'}</span>
          {userRole === 'admin' && (
            <button
              className="logout-btn"
              onClick={() => navigate('/admin')}
            >
              Panel Admin
            </button>
          )}
          <button
            className="logout-btn"
            onClick={handleGoHome}
          >
            Inicio
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="logout-btn"
          >
            {loggingOut ? 'Cerrando sesión' : 'Cerrar sesión'}
          </button>
        </div>
      </header>

      <div className="main-container">
        <main className="main-content">
          <section className="comentarios">
            <h2>Mi Perfil</h2>
            
            <div className="profile-container">
              {loading ? (
                <div className="cargando">
                  <div className="spinner"></div>
                  <p>Cargando perfil...</p>
                </div>
              ) : (
                <div className="profile-card">
                  <div className="profile-info">
                    <div className="profile-field">
                      <label>Nombre de Usuario:</label>
                      <span className="profile-value">
                        {userProfile?.displayName || user?.displayName || 'No establecido'}
                      </span>
                    </div>
                    
                    <div className="profile-field">
                      <label>Correo Electrónico:</label>
                      <span className="profile-value">
                        {user?.email || 'No disponible'}
                      </span>
                    </div>
                    
                    <div className="profile-field">
                      <label>Rol:</label>
                      <span className="profile-value">
                        {userRole || 'Usuario'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="">
                    <button 
                      className="logout-btn"
                      onClick={handleEditProfile}
                    >
                      Editar Perfil
                    </button>
                    <button 
                      className="logout-btn"
                      onClick={handleDesactivateAccount}
                    >
                      Desactivar cuenta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}