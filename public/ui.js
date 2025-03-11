document.addEventListener("DOMContentLoaded", () => {
    // Theme toggle
    const themeToggle = document.getElementById("themeToggle")
    const body = document.body
  
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-mode")
      updateThemeIcon()
    })
  
    function updateThemeIcon() {
      const icon = themeToggle.querySelector("i")
      if (body.classList.contains("dark-mode")) {
        icon.className = "ph-moon"
      } else {
        icon.className = "ph-sun"
      }
    }
  
    // Mobile menu
    const mobileMenuBtn = document.getElementById("mobileMenuBtn")
    const mobileMenu = document.getElementById("mobileMenu")
  
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("active")
      const icon = mobileMenuBtn.querySelector("i")
      if (mobileMenu.classList.contains("active")) {
        icon.className = "ph-x"
      } else {
        icon.className = "ph-list"
      }
    })
  
    // Modal tabs
    const tabBtns = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")
  
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        const tabId = this.getAttribute("data-tab")
  
        // Remove active class from all buttons and hide all contents
        tabBtns.forEach((btn) => btn.classList.remove("active"))
        tabContents.forEach((content) => content.classList.add("hidden"))
  
        // Add active class to clicked button and show corresponding content
        this.classList.add("active")
        document.getElementById(`${tabId}-tab`).classList.remove("hidden")
      })
    })
  
    // Mobile login button
    const mobileLoginBtn = document.getElementById("mobileLoginBtn")
    const loginModal = document.getElementById("loginModal")
  
    if (mobileLoginBtn && loginModal) {
      mobileLoginBtn.addEventListener("click", (e) => {
        e.preventDefault()
        loginModal.style.display = "block"
        mobileMenu.classList.remove("active")
        mobileMenuBtn.querySelector("i").className = "ph-list"
      })
    }
  
    // Filter buttons
    const filterBtns = document.querySelectorAll(".filter-btn")
  
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        filterBtns.forEach((btn) => btn.classList.remove("active"))
        this.classList.add("active")
      })
    })
  
    // Time filter buttons
    const timeBtns = document.querySelectorAll(".time-btn")
  
    timeBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        timeBtns.forEach((btn) => btn.classList.remove("active"))
        this.classList.add("active")
      })
    })
  
    // Initialize Phosphor Icons
    if (typeof PhosphorIcons === "undefined") {
      // Assuming PhosphorIcons is available globally after including the script
      // If not, you might need to import it or define it here.
      // Example:
      // import * as PhosphorIcons from 'phosphor-icons'; // If using modules
      window.PhosphorIcons = window.PhosphorIcons || {} // Ensure it exists
    }
    if (typeof PhosphorIcons !== "undefined") {
      PhosphorIcons.replace()
    }
  
    // Animate terminal text
    const terminalLines = document.querySelectorAll(".terminal-line:not(.blink)")
    let delay = 0
  
    terminalLines.forEach((line, index) => {
      line.style.opacity = "0"
      setTimeout(() => {
        line.style.transition = "opacity 0.5s ease"
        line.style.opacity = "1"
      }, delay)
      delay += 700
    })
  })
  
  