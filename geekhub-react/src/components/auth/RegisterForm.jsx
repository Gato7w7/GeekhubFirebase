import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const mostrarMensaje = (tipo, mensaje) => {
    // Solo muestra el error por ahora
    if (tipo === 'error') {
      setError(mensaje);
    }
  };

  const validarEntrada = (email, password) => {
    if (!email || !password) {
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

    if (!validarEntrada(email, password)) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      localStorage.setItem('token', await user.getIdToken());
      setUser(user);
      navigate('/home');
    } catch (err) {
      setError('Error al registrar. Intenta con otro email.');
    }
  };

  return (
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
      <button type="submit">Registrar</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default RegisterForm;