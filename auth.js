// auth.js
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
  } from "firebase/auth";
  import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
  import { auth, db } from "./firebase.js";
  
  // Register new user
  export const registerUser = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        displayName: email.split('@')[0],
        score: 0,
        joined: serverTimestamp(),
        challenges: []
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Login user
  export const loginUser = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Logout user
  export const logoutUser = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Get current user data
  export const getCurrentUserData = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  };
  
  // Auth state listener setup
  export const setupAuthListener = (callback) => {
    return onAuthStateChanged(auth, callback);
  };