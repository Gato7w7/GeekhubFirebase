// src/hooks/useComments.js
import { useEffect, useState } from 'react';
import { getCommentsByTopic } from '../services/commentService';

export const useComments = (tema) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComments = async () => {
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
        
        // Validar y limpiar los datos
        const validComments = Array.isArray(fetched) 
          ? fetched.filter(comment => {
              // Verificar que el comentario tenga estructura mínima
              const isValid = comment && 
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
    };

    fetchComments();
  }, [tema]);

  return { comments, loading, error };
};