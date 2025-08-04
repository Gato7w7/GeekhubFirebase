import React from 'react';
import '../styles/UserAvatar.css';

const UserAvatar = ({ 
  profileImage, 
  displayName, 
  email, 
  size = 40, 
  className = '',
  showTooltip = true 
}) => {
  // Generar iniciales del nombre
  const getInitials = (name, userEmail) => {
    if (name && name.trim()) {
      return name
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2) // Máximo 2 iniciales
        .join('');
    }
    
    // Si no hay nombre, usar las primeras 2 letras del email
    if (userEmail) {
      return userEmail.charAt(0).toUpperCase() + (userEmail.charAt(1) || '').toUpperCase();
    }
    
    return '?';
  };

  // Generar color de fondo basado en el email para consistencia
  const getBackgroundColor = (userEmail) => {
    if (!userEmail) return '#6b7280';
    
    // Crear un hash simple del email para generar un color consistente
    let hash = 0;
    for (let i = 0; i < userEmail.length; i++) {
      const char = userEmail.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    
    // Generar un color HSL con buena saturación y luminosidad
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  };

  const initials = getInitials(displayName, email);
  const backgroundColor = getBackgroundColor(email);
  const tooltipText = displayName || email || 'Usuario';

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.4}px`, // Tamaño de fuente proporcional
    backgroundColor: profileImage ? 'transparent' : backgroundColor,
  };

  return (
    <div 
      className={`user-avatar ${className}`}
      style={avatarStyle}
      title={showTooltip ? tooltipText : undefined}
    >
      {profileImage ? (
        <img 
          src={profileImage} 
          alt={`Avatar de ${displayName || email}`}
          className="user-avatar-image"
          onError={(e) => {
            // Si la imagen falla al cargar, mostrar iniciales
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      <div 
        className="user-avatar-initials"
        style={{ 
          display: profileImage ? 'none' : 'flex',
          backgroundColor: backgroundColor
        }}
      >
        {initials}
      </div>
    </div>
  );
};

export default UserAvatar;