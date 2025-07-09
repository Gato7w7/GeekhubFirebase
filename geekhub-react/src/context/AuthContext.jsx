// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const status = userData.status || 'active';
            const role = userData.role || 'user';
            
            // Verificar si estamos en la página de reactivación
            const isOnReactivatePage = window.location.pathname === '/reactivate-account';
            
            // Si el usuario está inactivo y NO está en la página de reactivación, cerrar sesión
            if (status === 'inactive' && !isOnReactivatePage) {
              console.log('Usuario inactivo detectado, cerrando sesión...');
              await signOut(auth);
              setUser(null);
              setUserRole(null);
              setUserStatus(null);
              setLoading(false);
              return;
            }
            
            setUserRole(role);
            setUserStatus(status);
          } else {
            // Si no existe en Firestore, asumir activo y usuario normal
            setUserRole('user');
            setUserStatus('active');
          }
        } catch (error) {
          console.error('Error obteniendo datos del usuario:', error);
          setUserRole('user');
          setUserStatus('active');
        }
      } else {
        setUserRole(null);
        setUserStatus(null);
      }
      
      setUser(firebaseUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Función para verificar si el usuario sigue activo
  const checkUserStatus = async () => {
    if (!user) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const status = userData.status || 'active';
        
        // Solo cerrar sesión si no estamos en la página de reactivación
        const isOnReactivatePage = window.location.pathname === '/reactivate-account';
        
        if (status === 'inactive' && !isOnReactivatePage) {
          await signOut(auth);
          return false;
        }
        
        setUserStatus(status);
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error verificando status del usuario:', error);
      return true; // En caso de error, permitir continuar
    }
  };

  // Función para actualizar el status del usuario desde componentes
  const updateUserStatus = (newStatus) => {
    setUserStatus(newStatus);
  };

  const value = {
    user,
    userRole,
    userStatus,
    loading,
    setUser,
    setUserRole,
    setUserStatus,
    updateUserStatus,
    checkUserStatus,
    isAdmin: userRole === 'admin',
    isUser: userRole === 'user',
    isActive: userStatus === 'active'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);