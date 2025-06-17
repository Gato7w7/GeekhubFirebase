// src/components/admin/MigrationTool.jsx
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { 
  migrateUsersFromComments, 
  updateCommentsWithUserIds, 
  runCompleteMigration 
} from './migrationScript';

const MigrationTool = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const handleMigration = async () => {
    setLoading(true);
    setStatus('🔄 Iniciando migración...');
    
    try {
      const result = await runCompleteMigration();
      
      if (result.success) {
        setStatus(`✅ Migración completada! ${result.migratedUsers} usuarios migrados.`);
        setMigrationComplete(true);
      } else {
        setStatus(`❌ Error en migración: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      setStatus('🔄 Creando usuario administrador...');
      
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );
      
      // 2. Crear documento en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: adminData.email,
        displayName: adminData.displayName || 'Administrador',
        role: 'admin',
        createdAt: new Date(),
        isFirstAdmin: true
      });
      
      setStatus(`👑 ¡Administrador creado exitosamente! Email: ${adminData.email}`);
      
      // Limpiar formulario
      setAdminData({ email: '', password: '', displayName: '' });
      
    } catch (error) {
      console.error('Error creando admin:', error);
      setStatus(`❌ Error creando administrador: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
        🔧 Herramienta de Migración de Base de Datos
      </h2>
      
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>⚠️ Importante:</h4>
        <p style={{ margin: 0, color: '#856404' }}>
          Esta herramienta migrará tu estructura actual de base de datos para soportar el sistema de roles.
          Se creará una colección 'users' basada en los emails de tus comentarios existentes.
        </p>
      </div>

      {/* Paso 1: Migración */}
      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3>Paso 1: Migrar Estructura de Base de Datos</h3>
        <p>Esto creará la colección 'users' basada en los emails de tus comentarios existentes.</p>
        
        <button
          onClick={handleMigration}
          disabled={loading || migrationComplete}
          style={{
            padding: '12px 24px',
            backgroundColor: migrationComplete ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '🔄 Migrando...' : migrationComplete ? '✅ Migración Completada' : '🚀 Iniciar Migración'}
        </button>
      </div>

      {/* Paso 2: Crear Admin */}
      {migrationComplete && (
        <div style={{
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3>Paso 2: Crear Usuario Administrador</h3>
          <p>Crea tu primer usuario con rol de administrador.</p>
          
          <form onSubmit={handleCreateAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Email del administrador"
                value={adminData.email}
                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                required
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={adminData.password}
                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                required
                minLength="6"
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Nombre completo (opcional)"
                value={adminData.displayName}
                onChange={(e) => setAdminData({...adminData, displayName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? '👑 Creando Admin...' : '👑 Crear Administrador'}
            </button>
          </form>
        </div>
      )}

      {/* Estado */}
      {status && (
        <div style={{
          padding: '15px',
          backgroundColor: status.includes('❌') ? '#f8d7da' : 
                          status.includes('✅') ? '#d4edda' : '#d1ecf1',
          border: '1px solid ' + (status.includes('❌') ? '#f5c6cb' : 
                                 status.includes('✅') ? '#c3e6cb' : '#bee5eb'),
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {status}
          </pre>
        </div>
      )}

      {/* Instrucciones finales */}
      <div style={{
        backgroundColor: '#e7f3ff',
        border: '1px solid #b8daff',
        borderRadius: '4px',
        padding: '15px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>📋 Después de la migración:</h4>
        <ol style={{ margin: 0, color: '#004085' }}>
          <li>Implementa los componentes de administrador que te proporcioné</li>
          <li>Actualiza tu AuthContext y LoginForm</li>
          <li>Agrega las rutas de admin a tu App.js</li>
          <li>¡Inicia sesión con tu cuenta de administrador!</li>
        </ol>
      </div>
    </div>
  );
};

export default MigrationTool;