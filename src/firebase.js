import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "process.env.REACT_APP_API_URL",
  authDomain: "gamer-s-corner.firebaseapp.com",
  projectId: "gamer-s-corner",
  storageBucket: "gamer-s-corner.firebasestorage.app",
  messagingSenderId: "1043003522374",
  appId: "1:1043003522374:web:4d9112040e088dfbd5f947",
  measurementId: "G-7L6W305PXY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
