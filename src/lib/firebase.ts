import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCkrnu00wjPEFY795IjjI-ekZFN3umLfp4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'appp-a3f08.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'appp-a3f08',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'appp-a3f08.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '411149472334',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:411149472334:web:23c59cf38e054b75e7291f'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
