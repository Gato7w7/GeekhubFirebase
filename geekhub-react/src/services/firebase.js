// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Tu configuración actual de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYcjLjsi7jNH1XYv0aQPhmh96vnG8Kp6A",
  authDomain: "geekhub-3f5e9.firebaseapp.com",
  projectId: "geekhub-3f5e9",
  storageBucket: "geekhub-3f5e9.appspot.com",
  messagingSenderId: "554775961647",
  appId: "1:554775961647:web:90f117efaecd8dd25326da"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);

// Exportar app por si la necesitamos
export default app;