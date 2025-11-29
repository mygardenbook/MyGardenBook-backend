/*
 * utils.js
 * Shared helper functions across the MyGardenBook admin interface
 */
export const API_BASE = "https://mygardenbook-backend.onrender.com";

// 💬 Simple message handler for consistent status updates
export function showMessage(msg, type = "info", targetId = "statusMsg") {
  const el = document.getElementById(targetId);
  if (!el) return;

  el.textContent = msg;
  el.style.display = "block";

  if (type === "error") el.style.color = "#b22222";
  else if (type === "success") el.style.color = "#2d6a1c";
  else el.style.color = "#333";

  setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}

// 🌐 Unified fetch wrapper with error handling
export async function apiRequest(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
    return await res.json();
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

// 🪄 Capitalize helper
export function capitalize(str = "") {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

// 🕐 Debounce (useful for search bars)
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
