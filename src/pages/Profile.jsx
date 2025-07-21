import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { userStatusService } from '../services/userStatusService';
import ProfileImageUploader from '../components/ProfileImageUploader';
import '../styles/profile.css'; // Reutilizando los estilos del home

export default function Profile() {
  const { user, userRole, handleSignOut } = useAuthContext();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);

  // Referencias para limpiar listeners y heartbeat
  const cleanupFunctionsRef = useRef([]);

  // Configurar listeners de estado online y heartbeat
  useEffect(() => {
    if (user?.uid) {
      // Configurar heartbeat
      const cleanupHeartbeat = userStatusService.setupHeartbeat(user.uid);
      cleanupFunctionsRef.current.push(cleanupHeartbeat);

      // Configurar listener para beforeunload
      const cleanupBeforeUnload = userStatusService.setupBeforeUnloadListener(user.uid);
      cleanupFunctionsRef.current.push(cleanupBeforeUnload);

      // Listener para detectar si el usuario se vuelve offline desde otra pestaña
      const unsubscribeStatus = userStatusService.subscribeToUserStatus(user.uid, (status) => {
        if (!status.isOnline) {
          // Si el usuario se marcó como offline, cerrar sesión
          handleLogout();
        }
      });
      cleanupFunctionsRef.current.push(unsubscribeStatus);

      // Limpiar todo al desmontar el componente
      return () => {
        cleanupFunctionsRef.current.forEach(cleanup => {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        });
        cleanupFunctionsRef.current = [];
      };
    }
  }, [user?.uid]);

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

  // Manejar actualización de imagen de perfil
  const handleImageUpdate = (newImageUrl) => {
    setUserProfile(prev => ({
      ...prev,
      profileImage: newImageUrl
    }));
  };

  const handleLogout = async () => {
    if (loggingOut) return; // Evitar múltiples llamadas

    setLoggingOut(true);
    try {
      // Limpiar listeners antes de cerrar sesión
      cleanupFunctionsRef.current.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      cleanupFunctionsRef.current = [];

      // Usar la función del contexto que ya maneja el estado offline
      await handleSignOut();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      setLoggingOut(false);
    }
  };

  const handleGoHome = () => {
    navigate('/home');
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
      await handleLogout();

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
            <div className="profile-actions">
              <button
                className="logout-btn"
                onClick={handleDesactivateAccount}
                disabled={deactivating || userProfile?.status === 'inactive'}
              >
                {deactivating ? 'Desactivando...' :
                  userProfile?.status === 'inactive' ? 'Cuenta Desactivada' : 'Desactivar cuenta'}
              </button>
            </div>
            <div className="profile-container">
              {loading ? (
                <div className="cargando">
                  <div className="spinner"></div>
                  <p>Cargando perfil...</p>
                </div>
              ) : (
                <div className="profile-content">
                  <div className="profile-image-section">
                    <h3>Imagen de perfil</h3>
                    <ProfileImageUploader
                      currentImage={userProfile?.profileImage}
                      onImageUpdate={handleImageUpdate}
                      disabled={userProfile?.status === 'inactive'}
                    />
                  </div>
                  <div className="profile-info">
                    <h3>Información del perfil</h3>
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
                </div>

              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}