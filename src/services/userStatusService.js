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
      //console.log('Usuario marcado como online');
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
      //console.log('Usuario marcado como offline');
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

  // Listener para cambios en el estado del usuario (SIN AUTO-LOGOUT)
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
    const handleBeforeUnload = async () => {
      try {
        // Usar navigator.sendBeacon si está disponible
        if (navigator.sendBeacon) {
          const data = JSON.stringify({ userId, action: 'offline' });
          navigator.sendBeacon('/api/user-offline', data);
        }
        
        // Fallback: actualización directa
        await userStatusService.setUserOffline(userId);
      } catch (error) {
        console.error('Error en beforeunload:', error);
      }
    };

    // Eventos para detectar cierre/salida
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    
    // Eventos para detectar pérdida de visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        userStatusService.setUserOffline(userId).catch(console.error);
      } else if (document.visibilityState === 'visible') {
        userStatusService.setUserOnline(userId).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Retornar función para limpiar los listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  },

  // Configurar heartbeat para mantener el estado online
  setupHeartbeat: (userId) => {
    const updateHeartbeat = async () => {
      try {
        // Solo actualizar si la página está visible
        if (document.visibilityState === 'visible') {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            lastSeen: serverTimestamp(),
            isOnline: true // Asegurar que sigue online
          });
        }
      } catch (error) {
        console.error('Error updating heartbeat:', error);
      }
    };

    // Actualizar cada 30 segundos
    const intervalId = setInterval(updateHeartbeat, 30000);
    
    // Actualizar inmediatamente al configurar
    updateHeartbeat();
    
    // Retornar función para limpiar el intervalo
    return () => {
      clearInterval(intervalId);
    };
  },

  // Nueva función: Configurar manejo completo de estado de usuario
  setupUserPresence: (userId) => {
    // Marcar como online inmediatamente
    userStatusService.setUserOnline(userId).catch(console.error);

    // Configurar heartbeat
    const cleanupHeartbeat = userStatusService.setupHeartbeat(userId);
    
    // Configurar listeners de cierre
    const cleanupBeforeUnload = userStatusService.setupBeforeUnloadListener(userId);

    // Función de limpieza completa
    return () => {
      cleanupHeartbeat();
      cleanupBeforeUnload();
      // Marcar como offline al limpiar
      userStatusService.setUserOffline(userId).catch(console.error);
    };
  }
};