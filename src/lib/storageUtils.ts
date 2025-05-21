// src/lib/storageUtils.ts
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage where the file should be stored (e.g., 'product-images').
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export async function uploadFileToFirebase(file: File, path: string = 'images'): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }
  // Generate a unique filename including the original extension
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}${fileExtension ? '.' + fileExtension : ''}`;
  
  const storageRef = ref(storage, `${path}/${uniqueFileName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    // Consider more specific error handling or re-throwing a custom error
    throw new Error('File upload failed. Please try again.');
  }
}
