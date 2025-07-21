// src/services/commentService.js
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Función para validar y limpiar un comentario
const validateAndCleanComment = (comment) => {
  if (!comment || typeof comment !== 'object') return null;
  if (!comment.id) return null;

  const cleanedComment = {
    id: comment.id,
    texto: typeof comment.texto === 'string' ? comment.texto.trim() : '',
    usuario: typeof comment.usuario === 'string' ? comment.usuario.trim() : 'Anónimo',
    tema: typeof comment.tema === 'string' ? comment.tema.trim() : 'General',
    fecha: comment.fecha || null
  };

  if (!cleanedComment.texto && !cleanedComment.usuario) return null;
  return cleanedComment;
};

export const getCommentsByTopic = async (tema) => {
  try {
    const q = query(
      collection(db, 'comentarios'),
      where('tema', '==', tema),
      orderBy('fecha', 'desc')
    );
    const snapshot = await getDocs(q);
    const rawComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const validComments = rawComments.map(validateAndCleanComment).filter(c => c);
    return validComments;
  } catch (error) {
    if (error.code === 'failed-precondition') {
      try {
        const q2 = query(collection(db, 'comentarios'), where('tema', '==', tema));
        const snapshot = await getDocs(q2);
        const rawComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const validComments = rawComments
          .map(validateAndCleanComment)
          .filter(c => c)
          .sort((a, b) => b.fecha?.toDate?.() - a.fecha?.toDate?.());
        return validComments;
      } catch (err2) {
        console.error('Error en segundo intento:', err2);
        return [];
      }
    }
    console.error('Error al obtener comentarios:', error);
    return [];
  }
};

export const addComment = async ({ texto, usuario, tema }) => {
  try {
    const docRef = await addDoc(collection(db, 'comentarios'), {
      texto,
      usuario,
      tema,
      fecha: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    throw error;
  }
};
