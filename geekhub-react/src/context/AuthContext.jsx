// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase'; // Asegúrate de que la ruta sea correcta

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener el rol del usuario desde Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || 'user'); // Por defecto 'user'
          } else {
            // Si no existe el documento del usuario, crear uno por defecto
            setUserRole('user');
          }
        } catch (error) {
          console.error('Error obteniendo rol del usuario:', error);
          setUserRole('user'); // Rol por defecto en caso de error
        }
      } else {
        setUserRole(null);
      }
      
      setUser(firebaseUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userRole,
    loading,
    setUser,
    setUserRole,
    isAdmin: userRole === 'admin',
    isUser: userRole === 'user'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);