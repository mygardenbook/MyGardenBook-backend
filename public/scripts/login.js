// ✅ login.js — MyGardenBook (Final Stable Build)
const API_BASE = "http://localhost:5000"; // ensure backend is running here

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ login.js loaded and DOM ready");

  const loginBtn = document.getElementById("loginBtn");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("errorMsg");
  const togglePassword = document.getElementById("togglePassword");

  if (!loginBtn || !usernameInput || !passwordInput) {
    console.error("❌ Missing required DOM elements (check your HTML IDs).");
    return;
  }

  // ✅ Handle Login
  async function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    errorMsg.textContent = "";

    if (!username || !password) {
      errorMsg.textContent = "Please enter both username and password.";
      return;
    }

    try {
      console.log("➡️ Sending login request to:", `${API_BASE}/api/login`);
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      console.log("✅ Server response:", result);

      if (response.ok && result.success) {
        localStorage.setItem("role", result.role);
        localStorage.setItem("username", username);

        if (result.role === "admin") {
          window.location.href = "Admin.html";
        } else if (result.role === "user") {
          window.location.href = "User.html";
        } else {
          errorMsg.textContent = "Unknown user role.";
        }
      } else {
        errorMsg.textContent = result.message || "Invalid username or password.";
      }
    } catch (error) {
      console.error("❌ Error during login:", error);
      errorMsg.textContent = "⚠️ Server connection failed. Please try again.";
    }
  }

  // ✅ Attach handler
  loginBtn.addEventListener("click", login);

  // ✅ Password Toggle Logic
  if (togglePassword) {
    let isVisible = false;
    togglePassword.addEventListener("click", () => {
      isVisible = !isVisible;
      passwordInput.type = isVisible ? "text" : "password";
      togglePassword.innerHTML = isVisible
        ? `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3" fill="none" stroke="#4A771C" stroke-width="2"></circle>
          <line x1="4" y1="4" x2="20" y2="20" stroke="#4A771C" stroke-width="2"></line>
        `
        : `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `;
    });
  }

  console.log("✨ Login script initialized successfully");
});
