import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';
import { useComments } from '../hooks/useComments';
import CommentForm from '../components/CommentForm';
import '../styles/stylehome.css'; // Import your styles

const temasDisponibles = ['General', 'Juegos', 'Tecnologia', 'Off-topic'];

export default function Home() {
  const [temaSeleccionado, setTemaSeleccionado] = useState('General');
  const { comments, loading, error, refetch } = useComments(temaSeleccionado);
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="home-container">
      {/* Header superior */}
      <header className="header">
        <div className="header-left">
          <h1 className="app-title">GeekHub</h1>
        </div>
        <div className="header-right">
          <span className="user-email">{user?.email || 'Sin email'}</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="logout-btn"
          >
            {loggingOut ? 'Cerrando sesión' : 'Cerrar sesión'}
          </button>
        </div>
      </header>

      {/* Contenedor principal */}
      <div className="main-container">
        {/* Sidebar de temas */}
        <aside className="sidebar">
          <div className="temas">
            <h2>Temas</h2>
            <ul>
              {temasDisponibles.map((tema) => (
                <li key={tema}>
                  <button
                    className={`tema-btn ${
                      tema === temaSeleccionado ? 'activo' : ''
                    }`}
                    onClick={() => setTemaSeleccionado(tema)}
                  >
                    {tema}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="main-content">
          <div className="content-header">
            <h1 className="content-title">Comentarios - {temaSeleccionado}</h1>
          </div>

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
                      <span className="fecha">{fecha}</span>
                    </div>
                    <p className="comentario-texto">{texto}</p>
                  </div>
                );
              })}
            </div>
          )}

          <CommentForm
            temaSeleccionado={temaSeleccionado}
            onCommentAdded={refetch}
          />
        </main>
      </div>
    </div>
  );
}