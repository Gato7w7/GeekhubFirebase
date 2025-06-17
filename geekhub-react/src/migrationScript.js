// src/utils/migrationScript.js
// Script para migrar la estructura de base de datos
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './services/firebase'; // Asegúrate de que la ruta sea correcta

// Función para migrar usuarios desde comentarios a colección users
export const migrateUsersFromComments = async () => {
  try {
    console.log('🔄 Iniciando migración de usuarios...');
    
    // 1. Obtener todos los comentarios
    const commentsSnapshot = await getDocs(collection(db, 'comentarios'));
    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 2. Extraer usuarios únicos de los comentarios
    const uniqueUsers = new Set();
    comments.forEach(comment => {
      if (comment.usuario) {
        uniqueUsers.add(comment.usuario);
      }
    });
    
    console.log(`📧 Encontrados ${uniqueUsers.size} usuarios únicos:`, Array.from(uniqueUsers));
    
    // 3. Para cada usuario único, crear un documento en la colección users
    // NOTA: Esto asume que el campo 'usuario' contiene emails
    const migratedUsers = [];
    
    for (const userEmail of uniqueUsers) {
      // Generar un ID único para el usuario (puedes usar el email como ID)
      const userId = userEmail.replace(/[@.]/g, '_'); // Convertir email a ID válido
      
      const userData = {
        email: userEmail,
        displayName: userEmail.split('@')[0], // Usar parte antes del @ como nombre
        role: 'user', // Por defecto todos son usuarios normales
        createdAt: new Date(),
        migratedFrom: 'comentarios', // Marca para saber que fue migrado
        // Agregar estadísticas del usuario
        totalComments: comments.filter(c => c.usuario === userEmail).length
      };
      
      try {
        await setDoc(doc(db, 'users', userId), userData);
        migratedUsers.push({ id: userId, ...userData });
        console.log(`✅ Usuario migrado: ${userEmail}`);
      } catch (error) {
        console.error(`❌ Error migrando usuario ${userEmail}:`, error);
      }
    }
    
    console.log(`🎉 Migración completada. ${migratedUsers.length} usuarios migrados.`);
    return migratedUsers;
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
};

// Función para actualizar comentarios con IDs de usuario
export const updateCommentsWithUserIds = async () => {
  try {
    console.log('🔄 Actualizando comentarios con IDs de usuario...');
    
    // 1. Obtener todos los usuarios
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = {};
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      users[userData.email] = doc.id; // Mapear email -> userId
    });
    
    // 2. Obtener todos los comentarios
    const commentsSnapshot = await getDocs(collection(db, 'comentarios'));
    
    // 3. Actualizar cada comentario
    const updatePromises = [];
    commentsSnapshot.docs.forEach(doc => {
      const commentData = doc.data();
      const userEmail = commentData.usuario;
      const userId = users[userEmail];
      
      if (userId) {
        // Actualizar comentario con userId
        updatePromises.push(
          updateDoc(doc.ref, {
            userId: userId, // Agregar campo userId
            usuarioOriginal: userEmail // Mantener email original por compatibilidad
          })
        );
      }
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ ${updatePromises.length} comentarios actualizados con IDs de usuario`);
    
  } catch (error) {
    console.error('❌ Error actualizando comentarios:', error);
    throw error;
  }
};

// Función para crear un usuario administrador específico
export const createAdminUser = async (email, password, displayName = 'Administrador') => {
  try {
    // Nota: Esta función requiere que primero crees el usuario en Firebase Auth
    // manualmente o usando createUserWithEmailAndPassword
    
    const userId = email.replace(/[@.]/g, '_');
    
    const adminData = {
      email: email,
      displayName: displayName,
      role: 'admin',
      createdAt: new Date(),
      isAdmin: true
    };
    
    await setDoc(doc(db, 'users', userId), adminData);
    console.log(`👑 Usuario administrador creado: ${email}`);
    
    return { id: userId, ...adminData };
    
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    throw error;
  }
};

// Función completa de migración
export const runCompleteMigration = async () => {
  try {
    console.log('🚀 Iniciando migración completa...');
    
    // Paso 1: Migrar usuarios
    const migratedUsers = await migrateUsersFromComments();
    
    // Paso 2: Actualizar comentarios
    await updateCommentsWithUserIds();
    
    // Paso 3: Mostrar instrucciones para crear admin
    console.log('📋 SIGUIENTE PASO:');
    console.log('Para crear tu primer administrador, ejecuta:');
    console.log('createAdminUser("tu-email@gmail.com", "tu-password", "Tu Nombre")');
    
    return {
      success: true,
      migratedUsers: migratedUsers.length,
      message: 'Migración completada exitosamente'
    };
    
  } catch (error) {
    console.error('💥 Error en migración completa:', error);
    return {
      success: false,
      error: error.message
    };
  }
};