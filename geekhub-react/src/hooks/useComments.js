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
      const fetched = await getCommentsByTopic(tema);

      const validComments = Array.isArray(fetched)
        ? fetched.filter(comment => {
            const isValid =
              comment &&
              typeof comment === 'object' &&
              comment.id &&
              (comment.texto || comment.usuario);

            return isValid;
          })
        : [];

      setComments(validComments);
    } catch (err) {
      setError(err.message || 'Error al cargar comentarios');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [tema]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, loading, error, refetch: fetchComments };
};
