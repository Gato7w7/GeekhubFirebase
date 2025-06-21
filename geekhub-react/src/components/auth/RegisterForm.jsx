import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp, getDocs, collection, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const mostrarMensaje = (tipo, mensaje) => {
    if (tipo === 'error') {
      setError(mensaje);
    }
  };

  const validarEntrada = (email, password, displayName) => {
    if (!email || !password || !displayName) {
      mostrarMensaje("error", "Por favor, completa todos los campos");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mostrarMensaje("error", "Por favor, ingresa un correo electrónico válido");
      return false;
    }

    if (password.length < 6) {
      mostrarMensaje("error", "La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    const mayusculaRegex = /[A-Z]/;
    const minusculaRegex = /[a-z]/;
    const caracterEspecialRegex = /[^A-Za-z0-9]/;

    if (!mayusculaRegex.test(password)) {
      mostrarMensaje("error", "La contraseña debe contener al menos una letra mayúscula");
      return false;
    }

    if (!minusculaRegex.test(password)) {
      mostrarMensaje("error", "La contraseña debe contener al menos una letra minúscula");
      return false;
    }

    if (!caracterEspecialRegex.test(password)) {
      mostrarMensaje("error", "La contraseña debe contener al menos un carácter especial");
      return false;
    }

    const consecutivos = password.match(/\d+/g);
    if (consecutivos) {
      for (let secuencia of consecutivos) {
        for (let i = 0; i < secuencia.length - 1; i++) {
          const actual = parseInt(secuencia[i]);
          const siguiente = parseInt(secuencia[i + 1]);
          if (siguiente === actual + 1 || siguiente === actual) {
            mostrarMensaje("error", "La contraseña no debe contener números consecutivos o repetidos");
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarEntrada(email, password, displayName)) return;

    try {
      // Verificar si ya existe un usuario pendiente creado por admin
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const pendingUser = userSnapshot.docs.find(doc => 
        doc.data().email === email && doc.data().status === 'pending'
      );

      if (pendingUser) {
        // Usuario creado por admin - activar cuenta
        console.log('Activando cuenta de usuario creado por admin');
        
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Actualizar el documento existente con el UID real y activar
        await updateDoc(doc(db, 'users', pendingUser.id), {
          uid: user.uid,
          status: 'active',
          password: password, // Actualizar con la contraseña real
          updatedAt: serverTimestamp()
        });

        // Eliminar el documento temporal y crear uno nuevo con el UID correcto
        await deleteDoc(doc(db, 'users', pendingUser.id));
        
        // Crear nuevo documento con el UID real
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: displayName,
          role: pendingUser.data().role,
          createdAt: pendingUser.data().createdAt,
          createdBy: pendingUser.data().createdBy,
          status: 'active',
          updatedAt: serverTimestamp()
        });

        localStorage.setItem('token', await user.getIdToken());
        setUser(user);
        navigate('/home');
        return;
      }

      // Usuario normal - crear nueva cuenta
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'user',
        createdAt: serverTimestamp(),
        isFirstAdmin: false,
        displayName: displayName,
        status: 'active'
      });

      localStorage.setItem('token', await user.getIdToken());
      setUser(user);
      navigate('/home');
    } catch (err) {
      console.error('Error en registro:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else {
        setError('Error al registrar. Intenta con otro email.');
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleRegister}>
        <h2>Registrarse</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Nombre"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <button type="submit">Registrar</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default RegisterForm;
