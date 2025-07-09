import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import '../styles/stylehome.css'; // Reutilizando los estilos del home

export default function Profile() {
  const { user, userRole } = useAuthContext();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);

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

  const handleDesactivateAccount = async () => {
    // Mostrar confirmación antes de desactivar
    const confirmDeactivate = window.confirm(
      '¿Estás seguro de que quieres desactivar tu cuenta? Esta acción cambiará tu estado a inactivo. Puedes reactivar tu cuenta en cualquier momento desde la pagina de inicio de sesión.'
    );
    
    if (!confirmDeactivate) return;

    setDeactivating(true);
    
    try {
      // Actualizar el campo status a "inactive" en Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        status: 'inactive',
        deactivatedAt: new Date().toISOString() // Opcional: guardar fecha de desactivación
      });

      // Actualizar el estado local
      setUserProfile(prev => ({
        ...prev,
        status: 'inactive'
      }));

      alert('Cuenta desactivada exitosamente. Serás redirigido al login.');
      
      // Cerrar sesión automáticamente después de desactivar
      await signOut(auth);
      navigate('/login');
      
    } catch (error) {
      console.error('Error al desactivar cuenta:', error);
      alert('Error al desactivar la cuenta. Por favor, intenta de nuevo.');
    } finally {
      setDeactivating(false);
    }
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

                    <div className="profile-field">
                      <label>Estado:</label>
                      <span className="profile-value">
                        {userProfile?.status || 'active'}
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
                      disabled={deactivating || userProfile?.status === 'inactive'}
                    >
                      {deactivating ? 'Desactivando...' : 
                       userProfile?.status === 'inactive' ? 'Cuenta Desactivada' : 'Desactivar cuenta'}
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