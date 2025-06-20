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
    <form className="form-comentario" onSubmit={handleSubmit}>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escribe tu comentario..."
        disabled={enviando}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={enviando || !texto.trim()}>
        {enviando ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
};

export default CommentForm;
