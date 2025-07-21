// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import ReactivateAccountPage from './pages/ReactivateAccountPage';

// Componente para manejar la redirección de la ruta raíz
const RootRedirect = () => {
  const { user, userRole, loading } = useAuthContext();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  // Si está autenticado, redirigir según el rol
  if (user) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/home" replace />;
    }
  }

  // Si no está autenticado, ir a login
  return <Navigate to="/login" replace />;
};

// Páginas y componentes
const FirebaseTest = () => {
  const [status, setStatus] = React.useState('Conectando...');
  const [comments, setComments] = React.useState([]);

  React.useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'comentarios'));
      const commentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setComments(commentsData);
      setStatus('✅ Firebase conectado correctamente');
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const testAddComment = async () => {
    try {
      await addDoc(collection(db, 'comentarios'), {
        texto: 'Comentario de prueba desde React',
        usuario: 'Usuario de prueba',
        tema: 'General',
        fecha: new Date()
      });
      setStatus('✅ Comentario agregado - Recargando...');
      testFirebaseConnection();
    } catch (error) {
      setStatus(`❌ Error al agregar: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔥 Prueba de Conexión Firebase</h1>
      <div style={{
        padding: '15px',
        backgroundColor: status.includes('✅') ? '#d4edda' : '#f8d7da',
        border: '1px solid ' + (status.includes('✅') ? '#c3e6cb' : '#f5c6cb'),
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <strong>Estado:</strong> {status}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={testAddComment} style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Agregar comentario de prueba
        </button>
      </div>

      <h3>📝 Comentarios en Firestore ({comments.length}):</h3>
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #ddd',
        padding: '10px',
        borderRadius: '5px'
      }}>
        {comments.length === 0 ? (
          <p>No hay comentarios aún. ¡Agrega uno de prueba!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} style={{
              marginBottom: '10px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px'
            }}>
              <strong>{comment.usuario || 'Anónimo'}:</strong> {comment.texto || '(Sin contenido)'}<br />
              <small>
                Tema: {comment.tema || 'General'} <br />
                {comment.fecha?.toDate?.()?.toLocaleString?.() || 'Sin fecha'}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Ruta raíz que redirige según el estado de autenticación */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Ruta de login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Ruta protegida de home para usuarios normales */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            
            {/* Ruta protegida de admin solo para administradores */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            
            {/* Ruta de test (puedes protegerla también si quieres) */}
            <Route path="/test" element={<FirebaseTest />} />

            {/* Ruta de perfil */}
            <Route path="/profile" element={<Profile />} />

            {/* Ruta de reactivar cuenta */}
            <Route path="/reactivate-account" element={<ReactivateAccountPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;