// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for SettleExpense project
const firebaseConfig = {
  apiKey: "AIzaSyDUz3hASJB_r8CUK9hJy4V7_GsYE3KLaaw",
  authDomain: "settleexpense-f099a.firebaseapp.com",
  projectId: "settleexpense-f099a",
  storageBucket: "settleexpense-f099a.firebasestorage.app",
  messagingSenderId: "131457267255",
  appId: "1:131457267255:web:f7d64218adbf5336ca71b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;