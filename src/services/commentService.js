// src/services/commentService.js
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Función para censurar texto usando la API
const censureBadWords = async (text) => {
  try {
    const response = await fetch('https://shelver.vercel.app/api/badwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) {
      throw new Error('Error en la API de censura');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error censurando texto:', error);
    // Si falla la API, devolver el texto original sin censura
    return { 
      censored: text, 
      hasProfanity: false, 
      error: true 
    };
  }
};

// Función para mostrar confirmación si hay groserías
const confirmProfanitySubmission = () => {
  return window.confirm(
    '⚠️ Tu comentario contiene palabras inapropiadas.\n\n' +
    'Si continúas, el comentario se publicará pero las palabras ofensivas serán censuradas con asteriscos (*).\n\n' +
    '¿Deseas continuar?'
  );
};

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

// Nueva función para agregar comentarios con censura
export const addComment = async ({ texto, usuario, tema }) => {
  try {
    // 1. Verificar si el texto contiene groserías
    const censorResult = await censureBadWords(texto);
    
    // 2. Si hay groserías y no hay error de API
    if (censorResult.hasProfanity && !censorResult.error) {
      // Mostrar confirmación al usuario
      const userConfirmed = confirmProfanitySubmission();
      
      // Si el usuario cancela, no enviar el comentario
      if (!userConfirmed) {
        throw new Error('CANCELLED_BY_USER'); // Error especial para manejar cancelación
      }
    }
    
    // 3. Usar el texto censurado (o original si no hay groserías o hay error)
    const finalText = censorResult.error ? texto : (censorResult.censored || texto);
    
    // 4. Guardar el comentario en Firebase
    const docRef = await addDoc(collection(db, 'comentarios'), {
      texto: finalText,
      usuario,
      tema,
      fecha: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    // Re-lanzar el error para que el componente lo maneje
    throw error;
  }
};