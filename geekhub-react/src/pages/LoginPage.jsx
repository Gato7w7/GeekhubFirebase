import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const LoginPage = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🔐 Login y Registro</h1>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '30px' }}>
        <LoginForm />
        <RegisterForm />
      </div>
    </div>
  );
};

export default LoginPage;