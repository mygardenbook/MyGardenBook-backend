/* =============================================================
   AdminAddEdit.js (FINAL VERSION)
   Works for BOTH Plants and Fish with new backend
   Backend: https://mygardenbook-backend.onrender.com
============================================================= */

const API_BASE = "https://mygardenbook-backend.onrender.com";

// Detect page type from filename
const page = window.location.pathname.toLowerCase();
const isPlantPage = page.includes("plant");
const isFishPage = page.includes("fish");

const type = isPlantPage ? "plant" : "fish";
const endpoint = isPlantPage ? "plants" : "fish";
const redirectPage = isPlantPage ? "AdminPlants.html" : "AdminFishes.html";

// DOM elements
const sciName = document.getElementById("sciName");
const commonName = document.getElementById("commonName");
const category = document.getElementById("category");
const description = document.getElementById("description");
const imageUpload = document.getElementById("imageUpload");

const qrSection = document.getElementById("qrSection");
const qrImage = document.getElementById("qrImage");
const qrLink = document.getElementById("qrLink");
const statusMsg = document.getElementById("statusMsg");

// Extract ?id=
const params = new URLSearchParams(window.location.search);
const itemId = params.get("id");
let currentItem = null;

/* ------------------ STATUS MESSAGE ------------------ */
function showMessage(msg, type = "success") {
  statusMsg.style.display = "block";
  statusMsg.style.color = type === "error" ? "#b22222" : "#2d6a1c";
  statusMsg.textContent = msg;
}

/* ------------------ LOAD EXISTING ITEM ------------------ */
async function loadItem() {
  if (!itemId) return;

  try {
    const res = await fetch(`${API_BASE}/api/${endpoint}/${itemId}`);
    const item = await res.json();

    currentItem = item;

    sciName.value = item.scientific_name || "";
    commonName.value = item.name || "";
    category.value = item.category || "";
    description.value = item.description || "";

    if (item.qr_code_url) {
      qrImage.src = item.qr_code_url;
      qrLink.href = `${isPlantPage ? "PlantView.html" : "FishView.html"}?id=${item.id}`;
      qrLink.textContent = `View ${type} page`;
      qrSection.style.display = "block";
    }
  } catch (err) {
    console.error("Error loading item:", err);
    showMessage("Error loading item", "error");
  }
}

/* ------------------ SAVE / UPDATE ITEM ------------------ */
async function saveForm() {
  const formData = new FormData();

  formData.append("name", commonName.value.trim());
  formData.append("scientific_name", sciName.value.trim());
  formData.append("category", category.value.trim());
  formData.append("description", description.value.trim());
  formData.append("type", type);

  if (imageUpload.files.length > 0) {
    formData.append("image", imageUpload.files[0]);
  }

  let url = "";
  let method = "POST";

  // Add or edit?
  if (itemId) {
    url = `${API_BASE}/api/edit/${type}/${itemId}`;
  } else {
    url = `${API_BASE}/api/add`;
  }

  showMessage("Saving...");

  try {
    const res = await fetch(url, { method, body: formData });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showMessage("Failed to save item", "error");
      return;
    }

    // First save → show QR
    if (!itemId) {
      currentItem = data.item;

      qrImage.src = currentItem.qr_code_url;
      qrLink.href = `${isPlantPage ? "PlantView.html" : "FishView.html"}?id=${currentItem.id}`;
      qrLink.textContent = `View ${type} page`;

      qrSection.style.display = "block";
      showMessage("QR generated! Save again to continue.", "success");

      itemId = currentItem.id; // Update ID for second click
      return;
    }

    // Second save → redirect
    window.location.href = redirectPage;

  } catch (err) {
    console.error("Save error:", err);
    showMessage("Server error while saving.", "error");
  }
}

/* ------------------ CLEAR FORM ------------------ */
function clearForm() {
  sciName.value = "";
  commonName.value = "";
  category.value = "";
  description.value = "";
  imageUpload.value = "";
  statusMsg.style.display = "none";
  qrSection.style.display = "none";
}

/* ------------------ DOWNLOAD QR ------------------ */
function downloadQR() {
  if (!currentItem) return;

  const link = document.createElement("a");
  link.href = currentItem.qr_code_url;
  link.download = `${currentItem.name.replace(/\s+/g, "_")}_QR.png`;
  link.click();
}

/* ------------------ INIT ------------------ */
loadItem();

// Global expose
window.saveForm = saveForm;
window.clearForm = clearForm;
window.downloadQR = downloadQR;
