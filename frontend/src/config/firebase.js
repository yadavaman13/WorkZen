import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_5zd5M8Mc0G_qJ_ys67QxQt8jH_dn8jQ",
  authDomain: "auth-38efa.firebaseapp.com",
  projectId: "auth-38efa",
  storageBucket: "auth-38efa.firebasestorage.app",
  messagingSenderId: "474843809472",
  appId: "1:474843809472:web:3ef5f69f562ef3213fcf25",
  measurementId: "G-RHKWV724L9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
