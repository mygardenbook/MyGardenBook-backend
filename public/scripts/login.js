// ✅ login.js — MyGardenBook (Final Backend-Compatible Build)

const API_BASE = "https://mygardenbook-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ login.js loaded and DOM ready");

  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("username");  // field name stays same
  const passwordInput = document.getElementById("password");
  const errorMsg = document.getElementById("errorMsg");

  // 🟢 Login Function
  async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    errorMsg.textContent = "";

    if (!email || !password) {
      errorMsg.textContent = "Please enter both email and password.";
      return;
    }

    try {
      console.log("➡️ Sending login request to:", `${API_BASE}/api/admin/login`);

      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log("🔍 Server response:", result);

      if (response.ok && result.token) {
        // Save session data
        localStorage.setItem("token", result.token);
        localStorage.setItem("admin_email", email);

        // Redirect to admin dashboard
        window.location.href = "AdminPlants.html";
      } else {
        errorMsg.textContent = result.error || "Invalid email or password.";
      }
    } catch (error) {
      console.error("❌ Error during login:", error);
      errorMsg.textContent = "⚠️ Could not connect to the server.";
    }
  }

  loginBtn.addEventListener("click", login);

  console.log("✨ Login script initialized successfully");
});
