// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWKIaM24doYqehFV-JHRrBqQDpkXuB1KM",
  authDomain: "myvault-f3f99.firebaseapp.com",
  projectId: "myvault-f3f99",
  storageBucket: "myvault-f3f99.firebasestorage.app",
  messagingSenderId: "219371541860",
  appId: "1:219371541860:web:a1d93f7f23194c5c39d671",
  measurementId: "G-955NQEREDE5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const messaging = getMessaging(app);

// Storage utilities
export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  type: string;
}

export async function uploadFile(file: File, folder: string = 'documents'): Promise<UploadResult> {
  try {
    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_SIZE) {
      throw new Error(`File size exceeds 10MB limit. Current size: ${formatFileSize(file.size)}`);
    }

    // Clean filename and create storage path
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}_${cleanFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log(`Uploading file to ${fileName}...`);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('File uploaded, getting download URL...');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Upload complete:', downloadURL);
    
    return {
      url: downloadURL,
      fileName: fileName,
      size: file.size,
      type: file.type
    };
  } catch (error: any) {
    console.error('Failed to upload file:', error);
    
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Firebase Storage: Unauthorized. Please check your Firebase configuration and permissions.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Firebase Storage: Upload canceled by user or browser.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Firebase Storage: Unknown error occurred. Please try again.');
    } else if (error.message) {
      throw new Error(`Firebase Storage: ${error.message}`);
    } else {
      throw new Error('Failed to upload file. Please try again.');
    }
  }
}

export async function deleteFile(fileName: string): Promise<void> {
  try {
    const storageRef = ref(storage, fileName);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

// Push notification utilities
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BCBiXNHeJE7Vz39JMTUV7BhmA9xnpbIehHFTdu7QBi3CP8CCiR62aUZlEJeLDKUmGIvEi0EWOqp2sogPK4HdbTc'
      });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

export function onMessageListener() {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
}

// Utility functions for different file types
export function getFileTypeFromMime(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { app, analytics, storage, messaging };
