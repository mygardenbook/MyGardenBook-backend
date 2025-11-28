/*
 * AdminAddEdit.js
 * Shared logic for adding/editing Plants and Fishes
 * Auto-detects context from current page (AdminAddEditPlant.html / AdminAddEditFish.html)
 */

// ✅ Helper functions
function showMessage(msg, type = "success") {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.style.display = "block";
  el.style.color = type === "error" ? "#b22222" : "#2d6a1c";
  el.textContent = msg;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

const API_BASE = "http://localhost:5000";

// 🧠 Detect type (plant or fish)
const pageName = window.location.pathname.toLowerCase();
const isPlantPage = pageName.includes("plant");
const isFishPage = pageName.includes("fish");

const itemType = isPlantPage ? "plant" : isFishPage ? "fish" : "unknown";
const API_ENDPOINT = isPlantPage ? "plants" : "fishes";
const pageList = isPlantPage ? "AdminPlants.html" : "AdminFishes.html";

if (itemType === "unknown") {
  alert("Invalid page context: cannot determine whether this is a plant or fish page.");
}

const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");

let currentItem = null;

// 🧩 Elements
const sciName = document.getElementById("sciName");
const commonName = document.getElementById("commonName");
const category = document.getElementById("category");
const description = document.getElementById("description");
const imageUpload = document.getElementById("imageUpload");

const qrSection = document.getElementById("qrSection");
const qrImage = document.getElementById("qrImage");
const qrLink = document.getElementById("qrLink");

/* ---------------------------------------------------------
   LOAD EXISTING ITEM (EDIT MODE)
--------------------------------------------------------- */
async function loadItem() {
  if (!itemId) return;

  try {
    const res = await fetch(`${API_BASE}/api/${API_ENDPOINT}/${itemId}`);
    if (!res.ok) throw new Error("Failed to load item");

    const item = await res.json();
    currentItem = item;

    sciName.value = item.scientificName || "";
    commonName.value = item.name || "";
    category.value = item.category || "";
    description.value = item.description || "";

    // Show QR on first load (read-only)
    if (item.qrCode) {
      qrImage.src = `${API_BASE}${item.qrCode}?t=${Date.now()}`;
      qrLink.href = `${itemType === "plant" ? "PlantView.html" : "FishView.html"}?id=${item.id}`;
      qrLink.textContent = `View ${capitalize(itemType)} Page`;
      qrSection.style.display = "block";
    }
  } catch (err) {
    console.error("Error loading:", err);
    showMessage("❌ Error loading item", "error");
  }
}

/* ---------------------------------------------------------
   SAVE / UPDATE ITEM
--------------------------------------------------------- */
async function saveForm() {
  const data = {
    type: itemType,
    name: commonName.value.trim(),
    scientificName: sciName.value.trim(),
    category: category.value.trim(),
    description: description.value.trim(),
  };

  const file = imageUpload.files[0];
  const formData = new FormData();

  for (let key in data) formData.append(key, data[key]);
  if (file) formData.append("image", file);

  showMessage("⏳ Saving...");

  try {
    let endpoint, method;

    if (itemId) {
      // EDIT MODE — MUST use POST for multer to work
      endpoint = `${API_BASE}/api/edit/${itemType}/${itemId}`;
      method = "POST";
    } else {
      // CREATE MODE
      endpoint = `${API_BASE}/api/add`;
      method = "POST";
    }

    const res = await fetch(endpoint, { method, body: formData });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showMessage("❌ Failed to save item", "error");
      return;
    }

    // 🔹 If editing → redirect immediately
    if (itemId) {
      window.location.href = pageList;
      return;
    }

    // 🔹 New item → show QR on first save
    if (result.item && result.item.qrCode && !saveForm.hasShownQR) {
      currentItem = result.item;

      qrImage.src = `${API_BASE}${currentItem.qrCode}?t=${Date.now()}`;
      qrLink.href = `${itemType === "plant" ? "PlantView.html" : "FishView.html"}?id=${currentItem.id}`;
      qrLink.textContent = `View ${capitalize(itemType)} Page`;

      qrSection.style.display = "block";
      saveForm.hasShownQR = true;

      showMessage("📸 QR generated! Click Save again to continue.", "success");
      return;
    }

    // 🔹 Second save → redirect
    if (saveForm.hasShownQR) {
      window.location.href = pageList;
    }

  } catch (err) {
    console.error("Save error:", err);
    showMessage("❌ Server error while saving.", "error");
  }
}

/* ---------------------------------------------------------
   CLEAR FORM
--------------------------------------------------------- */
function clearForm() {
  document.querySelectorAll("input, textarea, select").forEach(
    el => (el.value = "")
  );
  document.getElementById("statusMsg").style.display = "none";
  qrSection.style.display = "none";
  currentItem = null;
}

/* ---------------------------------------------------------
   DOWNLOAD QR
--------------------------------------------------------- */
function downloadQR() {
  if (!currentItem) return;
  const qrName = `${currentItem.name.replace(/\s+/g, "_")}_QR.png`;

  const link = document.createElement("a");
  link.href = `${API_BASE}${currentItem.qrCode}`;
  link.download = qrName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ---------------------------------------------------------
   UNIVERSAL AI CHAT (delegated to chat.js)
--------------------------------------------------------- */
// The HTML button calls: handleUniversalAI()

// ---------------------------------------------------------
loadItem();

// Expose globally
window.saveForm = saveForm;
window.clearForm = clearForm;
window.downloadQR = downloadQR;
