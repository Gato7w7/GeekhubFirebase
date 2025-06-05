// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Páginas temporales para prueba
const LoginPage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>🔐 Página de Login</h1>
    <p>Esta será tu página de login (index.html migrado)</p>
    <button onClick={() => window.location.href = '/home'}>
      Ir a Home (temporal)
    </button>
  </div>
);

const HomePage = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>🏠 Página Principal</h1>
    <p>Esta será tu página principal (home.html migrado)</p>
    <button onClick={() => window.location.href = '/login'}>
      Volver a Login (temporal)
    </button>
  </div>
);

const NotFound = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h1>404 - Página no encontrada</h1>
    <button onClick={() => window.location.href = '/'}>
      Ir al inicio
    </button>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navegación temporal para pruebas */}
        <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', textAlign: 'center' }}>
          <strong>GeekHub React - Prueba de Rutas</strong>
        </nav>
        
        <Routes>
          {/* Ruta por defecto redirige a login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Ruta de login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Ruta de home */}
          <Route path="/home" element={<HomePage />} />
          
          {/* Ruta para páginas no encontradas */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;