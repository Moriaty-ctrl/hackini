// main.js
import { auth, db } from "./firebase.js"
import { registerUser, loginUser, logoutUser, getCurrentUserData, setupAuthListener } from "./auth.js"
import { getLeaderboard, joinChallenge, setupChallengeListeners } from "./database.js"
import { doc, updateDoc } from "firebase/firestore"

// Debug information
console.log("Main.js loaded");

// DOM Elements
const loginBtn = document.getElementById("loginBtn")
const ctaLoginBtn = document.getElementById("ctaLoginBtn")
const loginModal = document.getElementById("loginModal")
const closeModal = document.querySelector(".close")
const loginSubmit = document.getElementById("loginSubmit")
const registerBtn = document.getElementById("registerBtn")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const regEmailInput = document.getElementById("reg-email")
const regPasswordInput = document.getElementById("reg-password")
const regConfirmPasswordInput = document.getElementById("reg-confirm-password")
const termsCheckbox = document.getElementById("terms")
const authStatus = document.getElementById("auth-status")
const userProfile = document.getElementById("userProfile")
const userName = document.getElementById("userName")
const userAvatar = document.getElementById("userAvatar")
const leaderboardContent = document.getElementById("leaderboard-content")
const joinButtons = document.querySelectorAll(".join-challenge")
const logoutBtn = document.getElementById("logoutBtn")
const tabBtns = document.querySelectorAll(".tab-btn")
const tabContents = document.querySelectorAll(".tab-content")

// Tab switching
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.getAttribute("data-tab")
    
    // Update active tab button
    tabBtns.forEach(b => b.classList.remove("active"))
    btn.classList.add("active")
    
    // Show selected tab content
    tabContents.forEach(content => {
      content.style.display = "none"
    })
    document.getElementById(`${tabId}-tab`).style.display = "block"
  })
})

// Show login modal
const showLoginModal = () => {
  loginModal.style.display = "block"
  // Reset to login tab
  tabBtns[0].click()
}

loginBtn?.addEventListener("click", (e) => {
  e.preventDefault()
  showLoginModal()
})

ctaLoginBtn?.addEventListener("click", (e) => {
  e.preventDefault()
  showLoginModal()
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
loginSubmit?.addEventListener('click', async function() {
  const email = emailInput?.value;
  const password = passwordInput?.value;
  
  if (!email || !password) {
    showAuthStatus('Please enter both email and password', false);
    return;
  }
  
  try {
    const result = await loginUser(email, password);
    
    if (result.success) {
      showAuthStatus('Login successful!', true);
      setTimeout(() => {
        loginModal.style.display = 'none';
      }, 1000);
    } else {
      showAuthStatus('Login failed: ' + result.error, false);
    }
  } catch (error) {
    console.error("Login error:", error);
    showAuthStatus('Login failed: ' + (error.message || 'Unknown error'), false);
  }
});

// Register functionality
registerBtn?.addEventListener("click", async () => {
  const email = regEmailInput.value
  const password = regPasswordInput.value
  const confirmPassword = regConfirmPasswordInput.value
  const termsAccepted = termsCheckbox.checked
  
  // Validation
  if (!email || !password || !confirmPassword) {
    showAuthStatus("Please fill in all fields", false)
    return
  }
  
  if (password !== confirmPassword) {
    showAuthStatus("Passwords do not match", false)
    return
  }
  
  if (!termsAccepted) {
    showAuthStatus("Please accept the terms and conditions", false)
    return
  }

  try {
    const result = await registerUser(email, password)

    if (result.success) {
      showAuthStatus("Registration successful!", true)
      setTimeout(() => {
        loginModal.style.display = "none"
      }, 1000)
    } else {
      showAuthStatus("Registration failed: " + result.error, false)
    }
  } catch (error) {
    console.error("Registration error:", error)
    showAuthStatus("Registration failed: " + (error.message || "Unknown error"), false)
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

  try {
    const leaderboardData = await getLeaderboard()

    if (leaderboardData.length === 0) {
      const item = document.createElement("div")
      item.className = "leaderboard-item"
      item.innerHTML = "<span colspan='4'>No data available yet</span>"
      leaderboardContent.appendChild(item)
    } else {
      // Clear existing content
      leaderboardContent.innerHTML = ""
      
      leaderboardData.forEach((userData, index) => {
        const position = index + 1
        const item = document.createElement("div")
        item.className = "leaderboard-item"
        
        const initials = userData.displayName
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 2)
        
        item.innerHTML = `
          <span class="rank">${position}</span>
          <div class="hacker-info">
            <div class="hacker-avatar">${initials}</div>
            <span class="hacker-name">${userData.displayName}</span>
          </div>
          <span class="score">${userData.score} pts</span>
          <span class="challenges-count">${userData.challenges?.length || 0}</span>
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
      showLoginModal()
      return
    }

    // Add user to challenge
    const result = await joinChallenge(user.uid, challengeId)

    if (result.success) {
      // Change button text and style
      this.textContent = "Joined"
      this.disabled = true
      this.classList.add("btn-outline")
      this.classList.remove("btn-primary")
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

// Typing animation for terminal
document.addEventListener("DOMContentLoaded", () => {
  // Load leaderboard
  loadLeaderboard()
  
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn')
  const navLinks = document.querySelector('.nav-links')
  
  mobileMenuBtn?.addEventListener('click', () => {
    navLinks.classList.toggle('show')
  })
})

