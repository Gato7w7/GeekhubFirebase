import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuthContext } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp, getDocs, collection, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const RegisterForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
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

    if (!acceptedPrivacy) {
      mostrarMensaje("error", "Debes aceptar el aviso de privacidad para continuar");
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
    setIsLoading(true);

    if (!validarEntrada(email, password, displayName)) {
      setIsLoading(false);
      return;
    }

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
        
        // Cerrar modal si existe la función onSuccess
        if (onSuccess) {
          onSuccess();
        }
        
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
      
      // Cerrar modal si existe la función onSuccess
      if (onSuccess) {
        onSuccess();
      }
      
      navigate('/home');
    } catch (err) {
      console.error('Error en registro:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else {
        setError('Error al registrar. Intenta con otro email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyLinkClick = () => {
    setShowPrivacyModal(true);
  };

  const closePrivacyModal = () => {
    setShowPrivacyModal(false);
  };

  return (
    <>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Nombre"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={isLoading}
        />
        
        <div className="privacy-checkbox-container">
          <label className="privacy-checkbox-label">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              disabled={isLoading}
              className="privacy-checkbox"
            />
            <span className="privacy-text">
              Acepto el{' '}
              <span 
                className="privacy-link" 
                onClick={handlePrivacyLinkClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePrivacyLinkClick();
                  }
                }}
              >
                Aviso de Privacidad
              </span>
            </span>
          </label>
        </div>

        <button type="submit" disabled={isLoading || !acceptedPrivacy}>
          {isLoading ? 'Registrando...' : 'Registrar'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>

      {/* Modal del Aviso de Privacidad */}
      {showPrivacyModal && (
        <div className="privacy-modal-overlay" onClick={closePrivacyModal}>
          <div className="privacy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="privacy-modal-header">
              <h3>🛡️ Aviso de Privacidad</h3>
              <button 
                className="privacy-modal-close"
                onClick={closePrivacyModal}
                aria-label="Cerrar aviso de privacidad"
              >
                ×
              </button>
            </div>
            <div className="privacy-modal-body">
              <p><strong>GeekHub - Foro Geek</strong></p>
              <p><strong>Responsable:</strong> Johany Carrillo Martínez</p>
              <p><strong>Correo de contacto:</strong> ameliaseacc@gmail.com</p>
              
              <p>Con fundamento en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), informamos a nuestros usuarios lo siguiente:</p>
              
              <h4>1. Finalidad del tratamiento de datos personales</h4>
              <p>Los datos personales que recopilamos (nombre, correo electrónico y contraseña), así como los mensajes o publicaciones realizadas en el foro GeekHub, serán utilizados exclusivamente para las siguientes finalidades:</p>
              <ul>
                <li>Crear una cuenta de usuario en la plataforma.</li>
                <li>Permitir al usuario participar en el foro, publicar comentarios y contenido.</li>
                <li>Mantener la funcionalidad básica del sitio.</li>
              </ul>
              <p>No se utilizan para fines de mercadotecnia, publicidad, ni se elaboran perfiles automatizados.</p>
              
              <h4>2. Datos que se recaban</h4>
              <p>Recopilamos los siguientes datos personales de los usuarios:</p>
              <ul>
                <li>Nombre</li>
                <li>Correo electrónico</li>
                <li>Contraseña (almacenada de forma segura y cifrada)</li>
                <li>Comentarios o publicaciones dentro del foro</li>
              </ul>
              
              <h4>3. Almacenamiento de los datos</h4>
              <p>Toda la información se almacena en bases de datos administradas mediante <strong>Firebase (Google Cloud Platform)</strong>, específicamente en <strong>Firestore</strong>. Firebase cumple con los más altos estándares de seguridad y protección de datos.</p>
              <p>No compartimos los datos personales con terceros ajenos a Firebase.</p>
              
              <h4>4. Transferencia de datos</h4>
              <p>No realizamos transferencias de datos a terceros, nacionales ni internacionales, sin su consentimiento previo, salvo aquellas necesarias para el cumplimiento de obligaciones legales o requeridas por autoridad competente.</p>
              
              <h4>5. Ejercicio de derechos ARCO</h4>
              <p>Usted tiene derecho a acceder, rectificar y cancelar sus datos personales, así como a oponerse al tratamiento de los mismos o revocar el consentimiento otorgado, mediante una solicitud enviada al correo electrónico:</p>
              <p><strong>📧 ameliaseacc@gmail.com</strong></p>
              <p>La solicitud deberá incluir su nombre completo, una descripción clara del derecho que desea ejercer, y de ser posible, una identificación oficial.</p>
              
              <h4>6. Cambios al aviso de privacidad</h4>
              <p>GeekHub se reserva el derecho de modificar el presente aviso de privacidad en cualquier momento. Cualquier cambio será publicado en esta misma sección o dentro de la aplicación.</p>
              
              <p><strong>Fecha de última actualización:</strong> Julio 2025</p>
            </div>
            <div className="privacy-modal-footer">
              <button 
                className="privacy-modal-accept"
                onClick={() => {
                  setAcceptedPrivacy(true);
                  closePrivacyModal();
                }}
              >
                Aceptar
              </button>
              <button 
                className="privacy-modal-decline"
                onClick={closePrivacyModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterForm;