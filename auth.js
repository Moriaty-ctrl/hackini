import { auth, db } from "./firebase.js"
import firebase from "firebase/app"
import "firebase/firestore"

// Register a new user
export const registerUser = async (email, password) => {
  try {
    // Create user with email and password
    const userCredential = await auth.createUserWithEmailAndPassword(email, password)
    const user = userCredential.user

    // Add user data to Firestore
    await db
      .collection("users")
      .doc(user.uid)
      .set({
        displayName: email.split("@")[0], // Default display name from email
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        score: 0,
        challenges: [],
        badges: [],
      })

    return { success: true, user }
  } catch (error) {
    console.error("Registration error:", error.code, error.message)
    return { success: false, error: error.message }
  }
}

// Login user
export const loginUser = async (email, password) => {
  console.log("Login attempt with:", email)
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password)
    console.log("Login successful:", userCredential.user.uid)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error("Login error in auth.js:", error.code, error.message)
    return { success: false, error: error.message }
  }
}

// Logout user
export const logoutUser = async () => {
  try {
    await auth.signOut()
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error.code, error.message)
    return { success: false, error: error.message }
  }
}

// Get current user data from Firestore
export const getCurrentUserData = async () => {
  try {
    const user = auth.currentUser
    if (!user) return null

    const userDoc = await db.collection("users").doc(user.uid).get()
    if (userDoc.exists) {
      return { uid: user.uid, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

// Setup auth state listener
export const setupAuthListener = (callback) => {
  return auth.onAuthStateChanged(callback)
}

