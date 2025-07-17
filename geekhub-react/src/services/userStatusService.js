// src/services/userStatusService.js
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const userStatusService = {
  // Marcar usuario como online
  setUserOnline: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        sessionStart: serverTimestamp()
      });
      console.log('Usuario marcado como online');
    } catch (error) {
      console.error('Error al marcar usuario como online:', error);
      throw error;
    }
  },

  // Marcar usuario como offline
  setUserOffline: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        sessionEnd: serverTimestamp()
      });
      console.log('Usuario marcado como offline');
    } catch (error) {
      console.error('Error al marcar usuario como offline:', error);
      throw error;
    }
  },

  // Verificar si el usuario está online
  checkUserOnlineStatus: (userId) => {
    return new Promise((resolve, reject) => {
      const userRef = doc(db, 'users', userId);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          resolve({
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen,
            sessionStart: userData.sessionStart
          });
        } else {
          resolve({ isOnline: false });
        }
        unsubscribe();
      }, (error) => {
        reject(error);
      });
    });
  },

  // Listener para cambios en el estado del usuario
  subscribeToUserStatus: (userId, callback) => {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        callback({
          isOnline: userData.isOnline || false,
          lastSeen: userData.lastSeen,
          sessionStart: userData.sessionStart
        });
      }
    });
  },

  // Configurar listener para detectar cuando el usuario cierra la ventana/pestaña
  setupBeforeUnloadListener: (userId) => {
    const handleBeforeUnload = () => {
      // Usar sendBeacon para enviar la petición de forma asíncrona
      // antes de que se cierre la ventana
      navigator.sendBeacon('/api/user-offline', JSON.stringify({ userId }));
      
      // También intentar la actualización directa (puede no completarse)
      userStatusService.setUserOffline(userId).catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Retornar función para limpiar el listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  },

  // Configurar heartbeat para mantener el estado online
  setupHeartbeat: (userId) => {
    const updateHeartbeat = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          lastSeen: serverTimestamp()
        });
      } catch (error) {
        console.error('Error updating heartbeat:', error);
      }
    };

    // Actualizar cada 30 segundos
    const intervalId = setInterval(updateHeartbeat, 30000);
    
    // Retornar función para limpiar el intervalo
    return () => {
      clearInterval(intervalId);
    };
  }
};