// src/hooks/useUserProfiles.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useUserProfiles = () => {
  const [profileCache, setProfileCache] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const loadingRequestsRef = useRef(new Set()); // Para evitar requests duplicados

  // Obtener un perfil individual por email
  const getUserProfile = useCallback(async (email) => {
    if (!email) return null;

    // Si ya está en caché, devolverlo inmediatamente
    if (profileCache.has(email)) {
      return profileCache.get(email);
    }

    // Si ya está cargando, esperar un poco y revisar de nuevo
    if (loadingRequestsRef.current.has(email)) {
      return new Promise((resolve) => {
        const checkCache = () => {
          if (profileCache.has(email)) {
            resolve(profileCache.get(email));
          } else if (!loadingRequestsRef.current.has(email)) {
            // Ya no está cargando, probablemente falló
            resolve(null);
          } else {
            // Sigue cargando, esperar más
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    try {
      loadingRequestsRef.current.add(email);
      setLoading(true);

      // Buscar usuario por email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      let userData = null;
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userData = {
          uid: userDoc.id,
          email: userDoc.data().email,
          displayName: userDoc.data().displayName || null,
          profileImage: userDoc.data().profileImage || null,
          role: userDoc.data().role || 'user',
          status: userDoc.data().status || 'active'
        };
      } else {
        // Usuario no encontrado, crear entrada básica
        userData = {
          uid: null,
          email: email,
          displayName: null,
          profileImage: null,
          role: 'user',
          status: 'unknown'
        };
      }

      // Guardar en caché
      setProfileCache(prev => new Map(prev).set(email, userData));
      return userData;

    } catch (err) {
      console.error(`Error al obtener perfil para ${email}:`, err);
      setError(err.message);
      return null;
    } finally {
      loadingRequestsRef.current.delete(email);
      setLoading(false);
    }
  }, [profileCache]);

  // Obtener múltiples perfiles de una vez
  const getUserProfiles = useCallback(async (emails) => {
    if (!emails || emails.length === 0) return [];

    const uniqueEmails = [...new Set(emails)]; // Remover duplicados
    const profiles = [];

    // Separar emails que ya están en caché de los que necesitan cargarse
    const emailsToFetch = [];
    const cachedProfiles = [];

    uniqueEmails.forEach(email => {
      if (profileCache.has(email)) {
        cachedProfiles.push(profileCache.get(email));
      } else {
        emailsToFetch.push(email);
      }
    });

    // Si todos están en caché, devolverlos inmediatamente
    if (emailsToFetch.length === 0) {
      return cachedProfiles;
    }

    try {
      setLoading(true);

      // Marcar emails como "cargando"
      emailsToFetch.forEach(email => loadingRequestsRef.current.add(email));

      // Cargar perfiles no cacheados en lotes
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', 'in', emailsToFetch));
      const querySnapshot = await getDocs(q);

      const fetchedProfiles = new Map();
      
      // Procesar usuarios encontrados
      querySnapshot.docs.forEach(doc => {
        const userData = {
          uid: doc.id,
          email: doc.data().email,
          displayName: doc.data().displayName || null,
          profileImage: doc.data().profileImage || null,
          role: doc.data().role || 'user',
          status: doc.data().status || 'active'
        };
        fetchedProfiles.set(userData.email, userData);
      });

      // Crear entradas básicas para usuarios no encontrados
      emailsToFetch.forEach(email => {
        if (!fetchedProfiles.has(email)) {
          fetchedProfiles.set(email, {
            uid: null,
            email: email,
            displayName: null,
            profileImage: null,
            role: 'user',
            status: 'unknown'
          });
        }
      });

      // Actualizar caché
      setProfileCache(prev => {
        const newCache = new Map(prev);
        fetchedProfiles.forEach((profile, email) => {
          newCache.set(email, profile);
        });
        return newCache;
      });

      // Combinar perfiles cacheados y recién obtenidos
      const allProfiles = [
        ...cachedProfiles,
        ...Array.from(fetchedProfiles.values())
      ];

      return allProfiles;

    } catch (err) {
      console.error('Error al obtener perfiles:', err);
      setError(err.message);
      return cachedProfiles; // Devolver al menos los cacheados
    } finally {
      // Limpiar marcadores de "cargando"
      emailsToFetch.forEach(email => loadingRequestsRef.current.delete(email));
      setLoading(false);
    }
  }, [profileCache]);

  // Limpiar caché
  const clearCache = useCallback(() => {
    setProfileCache(new Map());
    loadingRequestsRef.current.clear();
  }, []);

  // Obtener perfil del caché sin hacer request
  const getCachedProfile = useCallback((email) => {
    return profileCache.get(email) || null;
  }, [profileCache]);

  // Estadísticas del caché (útil para debugging)
  const getCacheStats = useCallback(() => {
    return {
      size: profileCache.size,
      loadingRequests: loadingRequestsRef.current.size,
      emails: Array.from(profileCache.keys())
    };
  }, [profileCache]);

  return {
    getUserProfile,
    getUserProfiles,
    getCachedProfile,
    clearCache,
    getCacheStats,
    loading,
    error,
    cacheSize: profileCache.size
  };
};