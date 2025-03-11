// main.js
import { auth, db } from "./firebase.js"
import { registerUser, loginUser, logoutUser, getCurrentUserData, setupAuthListener } from "./auth.js"
import { getLeaderboard, joinChallenge, setupChallengeListeners } from "./database.js"
import { doc, updateDoc } from "firebase/firestore"

// DOM Elements
const loginBtn = document.getElementById("loginBtn")
const loginModal = document.getElementById("loginModal")
const closeModal = document.querySelector(".close")
const loginSubmit = document.getElementById("loginSubmit")
const registerBtn = document.getElementById("registerBtn")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const authStatus = document.getElementById("auth-status")
const userProfile = document.getElementById("userProfile")
const userName = document.getElementById("userName")
const userAvatar = document.getElementById("userAvatar")
const leaderboardContent = document.getElementById("leaderboard-content")
const joinButtons = document.querySelectorAll(".join-challenge")
const logoutBtn = document.getElementById("logoutBtn")

// Show login modal
loginBtn?.addEventListener("click", (e) => {
  e.preventDefault()
  loginModal.style.display = "block"
})

// Close login modal
closeModal?.addEventListener("click", () => {
  loginModal.style.display = "none"
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target == loginModal) {
    loginModal.style.display = "none"
  }
})

// Login functionality
loginSubmit?.addEventListener("click", async () => {
  const email = emailInput.value
  const password = passwordInput.value

  const result = await loginUser(email, password)

  if (result.success) {
    showAuthStatus("Login successful!", true)
    setTimeout(() => {
      loginModal.style.display = "none"
    }, 1000)
  } else {
    showAuthStatus("Login failed: " + result.error, false)
  }
})

// Register functionality
registerBtn?.addEventListener("click", async () => {
  const email = emailInput.value
  const password = passwordInput.value

  const result = await registerUser(email, password)

  if (result.success) {
    showAuthStatus("Registration successful!", true)
    setTimeout(() => {
      loginModal.style.display = "none"
    }, 1000)
  } else {
    showAuthStatus("Registration failed: " + result.error, false)
  }
})

// Logout functionality
logoutBtn?.addEventListener("click", async () => {
  const result = await logoutUser()
  if (result.success) {
    showAuthStatus("Logged out successfully", true)
  }
})

// Show auth status message
function showAuthStatus(message, isSuccess) {
  authStatus.textContent = message
  authStatus.style.display = "block"

  if (isSuccess) {
    authStatus.className = "auth-success"
  } else {
    authStatus.className = "auth-error"
  }

  // Hide message after 3 seconds
  setTimeout(() => {
    authStatus.style.display = "none"
  }, 3000)
}

// Update UI based on auth state
setupAuthListener(async (user) => {
  if (user) {
    // User is signed in
    if (loginBtn) loginBtn.style.display = "none"
    if (userProfile) userProfile.style.display = "flex"

    // Get user profile data from Firestore
    const userData = await getCurrentUserData()
    if (userData) {
      if (userName) userName.textContent = userData.displayName
      if (userAvatar) userAvatar.textContent = userData.displayName.charAt(0).toUpperCase()
    }
  } else {
    // User is signed out
    if (loginBtn) loginBtn.style.display = "block"
    if (userProfile) userProfile.style.display = "none"
  }
})

// Load leaderboard data from Firestore
async function loadLeaderboard() {
  if (!leaderboardContent) return

  leaderboardContent.innerHTML = ""

  try {
    const leaderboardData = await getLeaderboard()

    if (leaderboardData.length === 0) {
      const item = document.createElement("div")
      item.className = "leaderboard-item"
      item.innerHTML = "<span>No data available yet</span><span></span>"
      leaderboardContent.appendChild(item)
    } else {
      leaderboardData.forEach((userData, index) => {
        const position = index + 1
        const item = document.createElement("div")
        item.className = "leaderboard-item"
        item.innerHTML = `
            <span>${position}. ${userData.displayName}</span>
            <span>${userData.score} pts</span>
          `
        leaderboardContent.appendChild(item)
      })
    }
  } catch (error) {
    console.error("Error loading leaderboard: ", error)
  }
}

// Join challenge functionality
joinButtons.forEach((button) => {
  button.addEventListener("click", async function (e) {
    const challengeId = this.getAttribute("data-challenge")

    // Check if user is logged in
    const user = auth.currentUser
    if (!user) {
      loginModal.style.display = "block"
      return
    }

    // Add user to challenge
    const result = await joinChallenge(user.uid, challengeId)

    if (result.success) {
      // Change button text
      this.textContent = "Joined"
      this.disabled = true
    } else {
      console.error("Error joining challenge: ", result.error)
    }
  })
})

// Set up real-time challenge listeners
setupChallengeListeners((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "modified" || change.type === "added") {
      const data = change.doc.data()
      const challengeId = change.doc.id
      const counterElement = document.getElementById(`${challengeId}-hackers`)

      if (counterElement) {
        counterElement.textContent = data.participantCount
      }
    }
  })
})

// Load data when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard()
})

// Load profile data
async function loadProfile() {
  const user = auth.currentUser
  if (!user) {
    window.location.href = "index.html" // Redirect to login if not authenticated
    return
  }

  const userData = await getCurrentUserData()
  if (userData) {
    document.getElementById("profile-email").textContent = userData.email
    document.getElementById("profile-displayName").textContent = userData.displayName
    document.getElementById("profile-score").textContent = userData.score
    document.getElementById("profile-challenges").textContent = userData.challenges?.join(", ") || "None"

    // Set the value of the edit form
    const displayNameInput = document.getElementById("edit-displayName")
    if (displayNameInput) {
      displayNameInput.value = userData.displayName
    }
  }
}

// Load profile data when the page loads
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on the profile page
  if (document.getElementById("profile-email")) {
    loadProfile()
  }
})

// Update profile data
const editProfileForm = document.getElementById("edit-profile-form")
if (editProfileForm) {
  editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const user = auth.currentUser
    if (!user) {
      showAuthStatus("You must be logged in to update your profile.", false)
      return
    }

    const newDisplayName = document.getElementById("edit-displayName").value

    try {
      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: newDisplayName,
      })

      // Update UI
      document.getElementById("profile-displayName").textContent = newDisplayName
      showAuthStatus("Profile updated successfully!", true)
    } catch (error) {
      showAuthStatus("Error updating profile: " + error.message, false)
    }
  })
}

