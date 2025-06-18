// src/components/CommentForm.jsx
import React, { useState } from 'react';
import { addComment } from '../services/commentService';
import { useAuthContext } from '../context/AuthContext';

const CommentForm = ({ temaSeleccionado, onCommentAdded }) => {
  const { user } = useAuthContext();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = texto.trim();
    if (!trimmed) {
      setError('El comentario no puede estar vacío.');
      return;
    }

    if (!user) {
      setError('Debes iniciar sesión para comentar.');
      return;
    }

    setEnviando(true);
    try {
      await addComment({
        texto: trimmed,
        tema: temaSeleccionado,
        usuario: user.displayName || user.email || 'Anónimo',
        uid: user.uid
      });

      setTexto('');
      if (onCommentAdded) onCommentAdded(); // recargar comentarios
    } catch (err) {
      setError('No se pudo enviar el comentario.');
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Agregar comentario</h2>
      <textarea
        className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring focus:border-green-500"
        rows="4"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escribe tu comentario aquí..."
        disabled={enviando}
      ></textarea>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:bg-green-300"
      >
        {enviando ? 'Enviando...' : 'Comentar'}
      </button>
    </form>
  );
};

export default CommentForm;
