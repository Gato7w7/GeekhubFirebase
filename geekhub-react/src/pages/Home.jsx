// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuthContext } from '../context/AuthContext';
import { useComments } from '../hooks/useComments';

const temasDisponibles = ['General', 'Juegos', 'Tecnologia', 'Off-topic'];

export default function Home() {
  const [temaSeleccionado, setTemaSeleccionado] = useState('General');
  const { comments, loading, error } = useComments(temaSeleccionado);
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
    <div className="flex min-h-screen">
      {/* Menú lateral */}
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col">
        {/* Información del usuario */}
        <div className="bg-gray-800 p-3 rounded-lg mb-4">
          <div className="flex items-center mb-2">
            <div className="bg-green-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold truncate">
                {user?.displayName || 'Usuario'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || 'Sin email'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm py-2 px-3 rounded transition-colors"
          >
            {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>

        {/* Navegación de temas */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Temas</h2>
          <ul className="space-y-1">
            {temasDisponibles.map((tema) => (
              <li key={tema}>
                <button
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    tema === temaSeleccionado 
                      ? 'bg-green-800 text-white' 
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                  onClick={() => setTemaSeleccionado(tema)}
                >
                  {tema}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Debug info (puedes remover esto después) */}
        <div className="mt-4 p-2 bg-gray-800 rounded text-xs">
          <p className="text-gray-400">Debug:</p>
          <p className="text-green-400">✓ Usuario autenticado</p>
          <p className="text-gray-300">UID: {user?.uid?.slice(0, 8)}...</p>
        </div>
      </aside>

      {/* Contenido de comentarios */}
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Comentarios: {temaSeleccionado}
            </h1>
            <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full shadow">
              {comments.length} comentario{comments.length !== 1 ? 's' : ''}
            </div>
          </div>

          {error ? (
            <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 text-lg font-semibold">Error al cargar comentarios</p>
              <p className="text-red-500 text-sm mt-2">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando comentarios...</p>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg">No hay comentarios para este tema.</p>
              <p className="text-gray-400 text-sm mt-2">¡Sé el primero en comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                // Validación defensiva de datos
                const commentText = comment?.texto || '';
                const commentUser = comment?.usuario || 'Anónimo';
                const commentDate = comment?.fecha?.toDate?.()?.toLocaleString() || 'Fecha no disponible';
                const userInitial = commentUser.charAt(0)?.toUpperCase() || 'A';
                
                return (
                  <div key={comment.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-800 text-lg leading-relaxed mb-3">
                      {commentText}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold text-blue-800 mr-2">
                          {userInitial}
                        </div>
                        <span className="font-semibold text-gray-700">
                          {commentUser}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {commentDate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}