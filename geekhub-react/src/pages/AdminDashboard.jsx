// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
//import { createUserWithEmailAndPassword } from 'firebase/auth';
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

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de que quieres ${action} este usuario?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      });

      // Actualizar la lista local
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      alert(`Usuario ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`);
    } catch (err) {
      console.error('Error actualizando status del usuario:', err);
      alert('Error al actualizar el estado del usuario');
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
        height: '100vh',
        backgroundColor: '#1e2125',
        color: '#ffffff'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '24px',
          backgroundColor: '#2a2d33',
          borderRadius: '8px',
          border: '1px solid #3a3e45'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #13aa52',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ margin: 0, fontSize: '16px' }}>Cargando panel de administración...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1e2125',
      padding: '16px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#2a2d33',
          borderRadius: '8px',
          border: '1px solid #3a3e45',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              margin: 0, 
              color: '#13aa52',
              fontSize: window.innerWidth <= 768 ? '24px' : '28px',
              fontWeight: '600'
            }}>
              Panel de Administración
            </h1>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              Bienvenido, {currentUser?.email}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
          }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#3a3e45',
                color: '#ffffff',
                border: '1px solid #4a4e55',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minWidth: '100px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#4a4e55';
                e.target.style.borderColor = '#5a5e65';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3a3e45';
                e.target.style.borderColor = '#4a4e55';
              }}
              onClick={() => navigate('/home')}
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: '#ffffff',
                border: '1px solid #dc3545',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minWidth: '100px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#c82333';
                e.target.style.borderColor = '#c82333';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#dc3545';
                e.target.style.borderColor = '#dc3545';
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Botón Agregar Usuario */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#13aa52',
              color: '#ffffff',
              border: '1px solid #13aa52',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              width: window.innerWidth <= 480 ? '100%' : 'auto'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#0e8a42';
              e.target.style.borderColor = '#0e8a42';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#13aa52';
              e.target.style.borderColor = '#13aa52';
            }}
          >
            {showAddUser ? 'Cancelar' : 'Agregar Nuevo Usuario'}
          </button>
        </div>

        {/* Formulario Agregar Usuario */}
        {showAddUser && (
          <div style={{
            backgroundColor: '#2a2d33',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #3a3e45',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ 
              color: '#ffffff', 
              marginBottom: '20px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Agregar Nuevo Usuario
            </h3>
            <form onSubmit={handleAddUser}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '16px', 
                marginBottom: '20px' 
              }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{
                    padding: '12px',
                    border: '1px solid #4a4e55',
                    borderRadius: '6px',
                    backgroundColor: '#1e2125',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  required
                  style={{
                    padding: '12px',
                    border: '1px solid #4a4e55',
                    borderRadius: '6px',
                    backgroundColor: '#1e2125',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #4a4e55',
                    borderRadius: '6px',
                    backgroundColor: '#1e2125',
                    color: '#ffffff',
                    fontSize: '14px'
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
                  padding: '12px 24px',
                  backgroundColor: addingUser ? '#6c757d' : '#007bff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: addingUser ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  width: window.innerWidth <= 480 ? '100%' : 'auto'
                }}
              >
                {addingUser ? 'Agregando...' : 'Agregar Usuario'}
              </button>
            </form>
            {error && (
              <p style={{ 
                color: '#dc3545', 
                marginTop: '12px',
                padding: '12px',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                fontSize: '14px'
              }}>
                {error}
              </p>
            )}
          </div>
        )}

        {/* Lista de Usuarios */}
        <div style={{
          backgroundColor: '#2a2d33',
          borderRadius: '8px',
          border: '1px solid #3a3e45',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <h3 style={{ 
            padding: '20px', 
            margin: 0, 
            borderBottom: '1px solid #3a3e45',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Usuarios Registrados ({users.length})
          </h3>

          {users.length === 0 ? (
            <p style={{ 
              padding: '40px 20px', 
              margin: 0, 
              textAlign: 'center', 
              color: '#9ca3af',
              fontSize: '16px'
            }}>
              No hay usuarios registrados
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {window.innerWidth <= 768 ? (
                // Vista móvil - Cards
                <div style={{ padding: '16px' }}>
                  {users.map((user) => (
                    <div key={user.id} style={{
                      backgroundColor: '#1e2125',
                      border: '1px solid #3a3e45',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#13aa52', fontSize: '16px' }}>
                          {user.email}
                        </strong>
                      </div>
                      <div style={{ marginBottom: '8px', color: '#ffffff' }}>
                        <strong>Nombre:</strong> {user.displayName || 'Sin nombre'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong style={{ color: '#ffffff' }}>Rol:</strong>
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{
                            marginLeft: '8px',
                            padding: '4px 8px',
                            border: '1px solid #4a4e55',
                            borderRadius: '4px',
                            backgroundColor: user.role === 'admin' ? '#13aa52' : '#007bff',
                            color: '#ffffff',
                            fontSize: '12px'
                          }}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: user.status === 'active' ? '#13aa52' : '#ffc107',
                          color: '#ffffff'
                        }}>
                          {user.status === 'active' ? 'Activo' : 'Pendiente'}
                        </span>
                      </div>
                      <div style={{ marginBottom: '12px', color: '#9ca3af', fontSize: '14px' }}>
                        <strong>Registro:</strong> {user.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}
                      </div>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                        disabled={user.id === currentUser.uid}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: user.id === currentUser.uid ? '#6c757d' :
                            user.status === 'active' ? '#ffc107' : '#13aa52',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: user.id === currentUser.uid ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          width: '100%'
                        }}
                      >
                        {user.id === currentUser.uid ? 'Usuario Actual' :
                          user.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Vista desktop - Tabla
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e2125' }}>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #3a3e45',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Email
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #3a3e45',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Nombre
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #3a3e45',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Rol
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #3a3e45',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Estado
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #3a3e45',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Fecha Registro
                      </th>
                      <th style={{ 
                        padding: '16px 12px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #3a3e45',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ 
                        borderBottom: '1px solid #3a3e45',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e2125'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ 
                          padding: '12px', 
                          color: '#13aa52',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {user.email}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          color: '#ffffff',
                          fontSize: '14px'
                        }}>
                          {user.displayName || 'Sin nombre'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #4a4e55',
                              borderRadius: '4px',
                              backgroundColor: user.role === 'admin' ? '#13aa52' : '#007bff',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: '500'
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
                            backgroundColor: user.status === 'active' ? '#13aa52' : '#ffc107',
                            color: '#ffffff'
                          }}>
                            {user.status === 'active' ? 'Activo' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          color: '#9ca3af',
                          fontSize: '14px'
                        }}>
                          {user.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.status)}
                            disabled={user.id === currentUser.uid}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: user.id === currentUser.uid ? '#6c757d' :
                                user.status === 'active' ? '#ffc107' : '#13aa52',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: user.id === currentUser.uid ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              if (user.id !== currentUser.uid) {
                                e.target.style.opacity = '0.8';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.target.style.opacity = '1';
                            }}
                          >
                            {user.id === currentUser.uid ? 'Tú' :
                              user.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;