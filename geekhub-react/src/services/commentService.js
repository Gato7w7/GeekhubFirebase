// src/services/commentService.js
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Función para validar y limpiar un comentario
const validateAndCleanComment = (comment) => {
  // Verificar que sea un objeto válido
  if (!comment || typeof comment !== 'object') {
    console.warn('❌ Comentario no es un objeto válido:', comment);
    return null;
  }

  // Verificar que tenga ID
  if (!comment.id) {
    console.warn('❌ Comentario sin ID:', comment);
    return null;
  }

  // Limpiar y validar campos
  const cleanedComment = {
    id: comment.id,
    texto: typeof comment.texto === 'string' ? comment.texto.trim() : '',
    usuario: typeof comment.usuario === 'string' ? comment.usuario.trim() : 'Anónimo',
    tema: typeof comment.tema === 'string' ? comment.tema.trim() : 'General',
    fecha: comment.fecha || null
  };

  // Verificar que tenga contenido mínimo
  if (!cleanedComment.texto && !cleanedComment.usuario) {
    console.warn('❌ Comentario sin contenido:', comment);
    return null;
  }

  return cleanedComment;
};

export const getCommentsByTopic = async (tema) => {
  try {
    console.log(`🔍 Buscando comentarios para tema: "${tema}"`);
    
    const q = query(
      collection(db, 'comentarios'),
      where('tema', '==', tema),
      orderBy('fecha', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Documentos encontrados: ${snapshot.docs.length}`);
    
    // Mapear y validar cada documento
    const rawComments = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`📄 Documento ${doc.id}:`, data);
      
      return {
        id: doc.id,
        ...data,
      };
    });

    // Filtrar comentarios válidos
    const validComments = rawComments
      .map(validateAndCleanComment)
      .filter(comment => comment !== null);

    console.log(`✅ Comentarios válidos: ${validComments.length} de ${rawComments.length}`);
    console.log('📋 Comentarios finales:', validComments);

    return validComments;
    
  } catch (error) {
    console.error('❌ Error al obtener comentarios:', error);
    
    // Si el error es por falta de índice, intentar sin orderBy
    if (error.code === 'failed-precondition') {
      console.log('🔄 Reintentando sin ordenamiento...');
      try {
        const simpleQuery = query(
          collection(db, 'comentarios'),
          where('tema', '==', tema)
        );
        const snapshot = await getDocs(simpleQuery);
        
        const rawComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const validComments = rawComments
          .map(validateAndCleanComment)
          .filter(comment => comment !== null)
          .sort((a, b) => {
            // Ordenar manualmente por fecha si existe
            if (a.fecha && b.fecha) {
              return b.fecha.toDate() - a.fecha.toDate();
            }
            return 0;
          });

        console.log(`✅ Comentarios obtenidos sin índice: ${validComments.length}`);
        return validComments;
        
      } catch (secondError) {
        console.error('❌ Error en segundo intento:', secondError);
        return [];
      }
    }
    
    return [];
  }
};