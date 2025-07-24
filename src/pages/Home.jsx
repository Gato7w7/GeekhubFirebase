import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import { auth } from '../services/firebase'; // REMOVIDO - no se usa
import { useAuthContext } from '../context/AuthContext';
import { useComments } from '../hooks/useComments';
import { userStatusService } from '../services/userStatusService';
import CommentForm from '../components/CommentForm';
import '../styles/stylehome.css';

const temasDisponibles = ['General', 'Juegos', 'Tecnologia', 'Off-topic'];

export default function Home() {
  const [temaSeleccionado, setTemaSeleccionado] = useState('General');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { comments, loading, error, refetch } = useComments(temaSeleccionado);
  const { user, userRole, handleSignOut } = useAuthContext();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Referencias para limpiar listeners y heartbeat
  const cleanupFunctionsRef = useRef([]);

  // Función handleLogout envuelta en useCallback para evitar warnings
  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      cleanupFunctionsRef.current.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      cleanupFunctionsRef.current = [];

      await handleSignOut();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      setLoggingOut(false);
    }
  }, [loggingOut, handleSignOut, navigate]);

  // Configurar presencia de usuario (SIN el listener problemático)
  useEffect(() => {
    if (user?.uid) {
      // Usar la nueva función que maneja todo sin auto-logout
      const cleanupPresence = userStatusService.setupUserPresence(user.uid);
      cleanupFunctionsRef.current.push(cleanupPresence);

      // REMOVIDO: El listener problemático que causaba el auto-logout
      // const unsubscribeStatus = userStatusService.subscribeToUserStatus(user.uid, (status) => {
      //   if (!status.isOnline) {
      //     handleLogout(); // ¡ESTO CAUSABA EL PROBLEMA!
      //   }
      // });

      return () => {
        cleanupFunctionsRef.current.forEach(cleanup => {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        });
        cleanupFunctionsRef.current = [];
      };
    }
  }, [user?.uid]); // handleLogout ya no es necesario en las dependencias

  const handleTemaChange = (tema) => {
    setTemaSeleccionado(tema);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar dropdown con ESC
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-left">
          <h1 className="app-title">GeekHub</h1>
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
            onClick={() => navigate('/profile')}
          >
            Perfil
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
        {/* Nuevo selector de temas desplegable */}
        <div className="tema-selector-container">
          <div className="tema-selector" ref={dropdownRef}>
            <button
              className="tema-selector-btn"
              onClick={toggleDropdown}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
            >
              <span>Tema: {temaSeleccionado}</span>
              <span className={`tema-selector-arrow ${dropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>

            <div className={`tema-dropdown ${!dropdownOpen ? 'hidden' : ''}`} role="listbox">
              {temasDisponibles.map((tema) => (
                <div
                  key={tema}
                  className={`tema-option ${tema === temaSeleccionado ? 'selected' : ''}`}
                  onClick={() => handleTemaChange(tema)}
                  role="option"
                  aria-selected={tema === temaSeleccionado}
                >
                  {tema}
                </div>
              ))}
            </div>
          </div>
        </div>

        <main className="main-content">
          <section className="comentarios">
            <h2>Comentarios - {temaSeleccionado}</h2>

            {error ? (
              <div className="error">
                <p>Error al cargar comentarios</p>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Reintentar</button>
              </div>
            ) : loading ? (
              <div className="cargando">
                <div className="spinner"></div>
                <p>Cargando comentarios...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="no-comentarios">
                <p>No hay comentarios para este tema.</p>
                <p>¡Sé el primero en comentar!</p>
              </div>
            ) : (
              <div className="lista-comentarios">
                {comments.map((comment) => {
                  const texto = comment?.texto || '';
                  const usuario = comment?.usuario || 'Anónimo';
                  const fecha = comment?.fecha?.toDate?.()?.toLocaleString() || 'Fecha no disponible';
                  return (
                    <div key={comment.id} className="comentario">
                      <div className="comentario-header">
                        <span className="usuario">{usuario}</span>
                        <span className="fecha"><em>{fecha}</em></span>
                      </div>
                      <div className="comentario-contenido">
                        <p>{texto}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <CommentForm
              temaSeleccionado={temaSeleccionado}
              onCommentAdded={refetch}
            />
          </section>
        </main>
      </div>
    </div>
  );
}