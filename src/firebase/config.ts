import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9XAouNCD9RrkjMZ0CrFiBvf52_OLiapY",
  authDomain: "hrboost-e7611.firebaseapp.com",
  projectId: "hrboost-e7611",
  storageBucket: "hrboost-e7611.firebasestorage.app",
  messagingSenderId: "394919805719",
  appId: "1:394919805719:web:22b306df77aa1d7e65ad52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;


