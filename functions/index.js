const {setGlobalOptions} = require("firebase-functions/v2");
const {onCall} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const sharp = require("sharp");
const path = require("path");
const os = require("os");
const fs = require("fs");

// Inicializar Firebase Admin
admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Función para procesar y subir imagen de perfil
exports.uploadProfileImage = onCall(async (request) => {
  try {
    // Verificar autenticación
    if (!request.auth) {
      throw new Error('Usuario no autenticado');
    }

    const { imageData } = request.data;
    if (!imageData) {
      throw new Error('No se proporcionó imagen');
    }

    const userId = request.auth.uid;
    
    // Decodificar la imagen base64
    const buffer = Buffer.from(imageData, 'base64');
    
    // Verificar tamaño (máximo 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('La imagen es demasiado grande. Máximo 5MB');
    }

    // Procesar imagen con Sharp (redimensionar a 400x400)
    const processedBuffer = await sharp(buffer)
      .resize(400, 400, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Obtener referencia del usuario para eliminar imagen anterior
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const userData = userDoc.data();
    
    // Si hay una imagen anterior, eliminarla
    if (userData?.profileImagePath) {
      try {
        await admin.storage().bucket().file(userData.profileImagePath).delete();
      } catch (deleteError) {
        logger.warn('Error al eliminar imagen anterior:', deleteError);
      }
    }

    // Crear nombre único para la nueva imagen
    const fileName = `profile-images/${userId}/${Date.now()}.jpg`;
    
    // Subir imagen a Storage
    const file = admin.storage().bucket().file(fileName);
    await file.save(processedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          userId: userId
        }
      }
    });

    // Hacer el archivo público
    await file.makePublic();
    
    // Obtener URL pública
    const publicUrl = `https://storage.googleapis.com/${admin.storage().bucket().name}/${fileName}`;

    // Actualizar documento del usuario en Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        profileImage: publicUrl,
        profileImagePath: fileName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return {
      success: true,
      profileImage: publicUrl,
      message: 'Imagen de perfil actualizada correctamente'
    };

  } catch (error) {
    logger.error('Error en uploadProfileImage:', error);
    throw new Error(error.message || 'Error al procesar la imagen');
  }
});

// Función para eliminar imagen de perfil
exports.removeProfileImage = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Usuario no autenticado');
    }

    const userId = request.auth.uid;
    
    // Obtener datos del usuario
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    const userData = userDoc.data();
    
    // Si hay imagen, eliminarla
    if (userData?.profileImagePath) {
      try {
        await admin.storage().bucket().file(userData.profileImagePath).delete();
      } catch (deleteError) {
        logger.warn('Error al eliminar imagen:', deleteError);
      }
    }

    // Actualizar documento del usuario
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        profileImage: admin.firestore.FieldValue.delete(),
        profileImagePath: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return {
      success: true,
      message: 'Imagen de perfil eliminada correctamente'
    };

  } catch (error) {
    logger.error('Error en removeProfileImage:', error);
    throw new Error(error.message || 'Error al eliminar la imagen');
  }
});