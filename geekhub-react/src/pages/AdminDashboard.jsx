// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    role: 'user'
  });
  const [addingUser, setAddingUser] = useState(false);
  
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
      alert('Usuario eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      alert('Error al eliminar el usuario');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    setError('');

    try {
      // Validaciones adicionales
      if (!newUser.email || !newUser.displayName) {
        throw new Error('Email y nombre son obligatorios');
      }

      // Verificar si el email ya existe
      const existingUsers = users.filter(user => user.email === newUser.email);
      if (existingUsers.length > 0) {
        throw new Error('Este email ya está registrado');
      }

      console.log('Creando usuario en Firestore...');
      
      // Crear un ID temporal para el usuario
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Agregar datos del usuario a Firestore (sin Auth por ahora)
      const userData = {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        status: 'pending' // Estado pendiente hasta que se registre
      };

      console.log('Guardando datos en Firestore...');
      await setDoc(doc(db, 'users', tempUserId), userData);
      
      console.log('Usuario creado exitosamente en Firestore');

      // Actualizar la lista local
      await loadUsers();
      
      // Limpiar formulario
      setNewUser({
        email: '',
        displayName: '',
        role: 'user'
      });
      setShowAddUser(false);
      
      alert('Usuario agregado correctamente. El usuario debe registrarse con su email para activar su cuenta.');
    } catch (err) {
      console.error('Error detallado al agregar usuario:', err);
      
      // Manejo específico de errores
      let errorMessage = 'Error al agregar el usuario';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      
      // Actualizar la lista local
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      alert('Rol actualizado correctamente');
    } catch (err) {
      console.error('Error actualizando rol:', err);
      alert('Error al actualizar el rol');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error en logout:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#dc3545' }}>Panel de Administración</h1>
            <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
              Bienvenido, {currentUser?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Botón Agregar Usuario */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showAddUser ? 'Cancelar' : 'Agregar Nuevo Usuario'}
          </button>
        </div>

        {/* Formulario Agregar Usuario */}
        {showAddUser && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3>Agregar Nuevo Usuario</h3>
            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  style={{
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                  required
                  style={{
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  style={{
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <button
                type="submit"
                disabled={addingUser}
                style={{
                  padding: '10px 20px',
                  backgroundColor: addingUser ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: addingUser ? 'not-allowed' : 'pointer'
                }}
              >
                {addingUser ? 'Agregando...' : 'Agregar Usuario'}
              </button>
            </form>
            {error && (
              <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
            )}
          </div>
        )}

        {/* Lista de Usuarios */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <h3 style={{ padding: '20px', margin: 0, borderBottom: '1px solid #dee2e6' }}>
            Usuarios Registrados ({users.length})
          </h3>
          
          {users.length === 0 ? (
            <p style={{ padding: '20px', margin: 0, textAlign: 'center', color: '#6c757d' }}>
              No hay usuarios registrados
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Nombre</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Rol</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Fecha Registro</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{user.email}</td>
                      <td style={{ padding: '12px' }}>{user.displayName || 'Sin nombre'}</td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{
                            padding: '5px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            backgroundColor: user.role === 'admin' ? '#ffe6e6' : '#e6f3ff'
                          }}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: user.status === 'active' ? '#d4edda' : '#fff3cd',
                          color: user.status === 'active' ? '#155724' : '#856404'
                        }}>
                          {user.status === 'active' ? 'Activo' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {user.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser.uid}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: user.id === currentUser.uid ? '#ccc' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: user.id === currentUser.uid ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {user.id === currentUser.uid ? 'Tú' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;