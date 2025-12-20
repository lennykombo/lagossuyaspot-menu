// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwir9ioMwlXZKeFRQYhz_wRfJG9sQ69SQ",
  authDomain: "lagossuya-bbd8b.firebaseapp.com",
  projectId: "lagossuya-bbd8b",
  storageBucket: "lagossuya-bbd8b.firebasestorage.app",
  messagingSenderId: "671315596312",
  appId: "1:671315596312:web:e271b1eb28205a751e1f6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth();
export const db=getFirestore();
export default app;