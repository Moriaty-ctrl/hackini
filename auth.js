import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Add user data to Firestore
    await setDoc(doc(db, "users", user.uid), {
      displayName: displayName,
      email: email,
      createdAt: serverTimestamp(),
      score: 0,
      challenges: [],
      badges: [],
    })

    // Update profile display name
    await user.updateProfile({
      displayName: displayName,
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
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
    await signOut(auth)
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

    const userDoc = await getDoc(doc(db, "users", user.uid))
    if (userDoc.exists()) {
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
  return onAuthStateChanged(auth, callback)
}

