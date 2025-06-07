// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './services/firebase';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/auth/PrivateRoute';

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

const HomePage = () => {
  const { user, loading, setUser } = useAuthContext();
  const navigate = useNavigate();

  if (loading) return <p>Cargando...</p>;
  if (!user) return <Navigate to="/login" />;

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🏠 Página Principal</h1>
      <p>Bienvenido, {user.email}</p>
      <button onClick={() => window.location.href = '/test'}>
        Probar Firebase
      </button>
      <br />
      <button onClick={handleLogout} style={{ marginTop: '20px' }}>
        Cerrar sesión
      </button>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/test" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />
            <Route path="/test" element={<FirebaseTest />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
