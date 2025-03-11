// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCy8Me6lEYmaeKfNkOr16BJ17_XOhp2GJc",
    authDomain: "hackini-394d1.firebaseapp.com",
    projectId: "hackini-394d1",
    storageBucket: "hackini-394d1.firebasestorage.app",
    messagingSenderId: "749500241115",
    appId: "1:749500241115:web:25ffd9499223be923a68fe",
    measurementId: "G-7VZS03ZGN5"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };