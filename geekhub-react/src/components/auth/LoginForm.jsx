import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Firebase Auth se encarga de todo automáticamente
      await signInWithEmailAndPassword(auth, email, password);
      
      // El AuthContext se actualizará automáticamente gracias a onAuthStateChanged
      // y PrivateRoute permitirá el acceso a /home
      navigate('/home');
    } catch (err) {
      console.error('Error en login:', err);
      setError('Credenciales inválidas o error en el login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      padding: '20px', 
      borderRadius: '8px',
      maxWidth: '300px',
      margin: '0 auto'
    }}>
      <form onSubmit={handleLogin}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Iniciar sesión</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            disabled={loading}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
        
        {error && (
          <p style={{ 
            color: 'red', 
            marginTop: '15px', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginForm;