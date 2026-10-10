import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: 'AIzaSyCkrnu00wjPEFY795IjjI-ekZFN3umLfp4',
  authDomain: 'appp-a3f08.firebaseapp.com',
  projectId: 'appp-a3f08',
  storageBucket: 'appp-a3f08.firebasestorage.app',
  messagingSenderId: '411149472334',
  appId: '1:411149472334:web:23c59cf38e054b75e7291f'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
