// src/hooks/useComments.js
import { useEffect, useState, useCallback } from 'react';
import { getCommentsByTopic } from '../services/commentService';

export const useComments = (tema) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!tema) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Obteniendo comentarios para tema: ${tema}`);
      const fetched = await getCommentsByTopic(tema);

      const validComments = Array.isArray(fetched)
        ? fetched.filter(comment => {
            const isValid =
              comment &&
              typeof comment === 'object' &&
              comment.id &&
              (comment.texto || comment.usuario);

            if (!isValid) {
              console.warn('⚠️ Comentario inválido encontrado:', comment);
            }

            return isValid;
          })
        : [];

      console.log(`✅ Comentarios válidos obtenidos: ${validComments.length}`);
      console.log('📄 Datos de comentarios:', validComments);

      setComments(validComments);
    } catch (err) {
      console.error('❌ Error al obtener comentarios:', err);
      setError(err.message || 'Error al cargar comentarios');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [tema]);

  // Ejecutar al cargar o cambiar el tema
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Retornar también la función refetch
  return { comments, loading, error, refetch: fetchComments };
};
