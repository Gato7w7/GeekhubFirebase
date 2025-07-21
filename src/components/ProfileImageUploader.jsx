import React, { useState, useRef } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import app from '../services/firebase';

const functions = getFunctions(app);

const ProfileImageUploader = ({ currentImage, onImageUpdate, disabled = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // Mantener referencia al archivo
  const fileInputRef = useRef(null);

  // Validar archivo de imagen
  const validateImage = (file) => {
    // Verificar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato no válido. Use JPG, PNG o WebP');
    }

    // Verificar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen es demasiado grande. Máximo 5MB');
    }

    return true;
  };

  // Convertir archivo a base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remover el prefijo "data:image/...;base64,"
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateImage(file);
      
      // Guardar referencia al archivo
      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      alert(error.message);
      // Limpiar todo
      setSelectedFile(null);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Subir imagen
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona una imagen');
      return;
    }

    setIsUploading(true);
    
    try {
      const base64Image = await fileToBase64(selectedFile);
      
      // Llamar a la Cloud Function
      const uploadProfileImage = httpsCallable(functions, 'uploadProfileImage');
      const result = await uploadProfileImage({ imageData: base64Image });
      
      // Notificar al componente padre
      onImageUpdate(result.data.profileImage);
      
      // Limpiar todo
      setPreviewImage(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      alert('Imagen de perfil actualizada correctamente');
      
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert(error.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar imagen
  const handleRemove = async () => {
    if (!currentImage) return;
    
    const confirm = window.confirm('¿Estás seguro de que quieres eliminar tu imagen de perfil?');
    if (!confirm) return;

    setIsUploading(true);
    
    try {
      const removeProfileImage = httpsCallable(functions, 'removeProfileImage');
      await removeProfileImage();
      
      // Notificar al componente padre
      onImageUpdate(null);
      
      alert('Imagen de perfil eliminada correctamente');
      
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      alert(error.message || 'Error al eliminar la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  // Cancelar selección
  const handleCancel = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="profile-image-uploader">
      {/* Imagen actual o placeholder */}
      <div className="profile-image-container">
        <div className="profile-image-wrapper">
          {previewImage ? (
            <img 
              src={previewImage} 
              alt="Preview" 
              className="profile-image preview"
            />
          ) : currentImage ? (
            <img 
              src={currentImage} 
              alt="Imagen de perfil" 
              className="profile-image"
            />
          ) : (
            <div className="profile-image-placeholder">
              <span>Sin imagen</span>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="profile-image-controls">
        {previewImage ? (
          // Mostrar controles cuando hay una imagen seleccionada
          <div className="preview-controls">
            <button 
              onClick={handleUpload}
              disabled={isUploading || disabled}
              className="upload-btn"
            >
              {isUploading ? 'Subiendo...' : 'Confirmar'}
            </button>
            <button 
              onClick={handleCancel}
              disabled={isUploading || disabled}
              className="cancel-btn"
            >
              Cancelar
            </button>
          </div>
        ) : (
          // Mostrar controles normales
          <div className="normal-controls">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading || disabled}
              className="file-input"
              style={{ display: 'none' }}
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || disabled}
              className="cambiar"
            >
              {currentImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
            </button>
            
            {currentImage && (
              <button 
                onClick={handleRemove}
                disabled={isUploading || disabled}
                className="eliminar"
              >
                Eliminar imagen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="upload-info">
        <small>Formatos: JPG, PNG, WebP. Máximo 5MB. Se redimensionará a 400x400px.</small>
      </div>
    </div>
  );
};

export default ProfileImageUploader;