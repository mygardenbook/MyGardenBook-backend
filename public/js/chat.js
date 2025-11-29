/* ============================================================
   public/js/chat.js — Universal AI Chat (Groq-optimized)
   Works on every page (Admin + User + PlantView + FishView)
   Automatically adds context based on page + ?id= item
============================================================ */

(function () {

  // Auto-detect API base (website origin)
   const API_BASE = "https://mygardenbook-backend.onrender.com";

  /* -----------------------------------------------------------
     Build contextual details for Groq (plant/fish details)
  ------------------------------------------------------------ */
  async function buildAIContext() {
    let ctx = "";

    // Page name (PlantView, UserPlant, AdminAdd, etc.)
    const page = window.location.pathname.split("/").pop().replace(".html", "");
    ctx += `User is on page "${page}".`;

    // Check for ?id=
    const params = new URLSearchParams(window.location.search);
    const itemId = params.get("id");
    if (!itemId) return ctx;

    // Determine if plant or fish (based on filename)
    const pageLower = page.toLowerCase();
    const isFish = pageLower.includes("fish");
    const type = isFish ? "fish" : "plant";

    try {
      const res = await fetch(`${API_BASE}/api/${type}s/${itemId}`);
      if (res.ok) {
        const data = await res.json();

        if (data?.name) ctx += ` ${type} name: "${data.name}".`;
        if (data?.scientificName) ctx += ` Scientific name: "${data.scientificName}".`;
        if (data?.category) ctx += ` Category: ${data.category}.`;
        if (data?.description) ctx += ` Description: ${data.description}.`;
      }
    } catch (err) {
      console.warn("⚠️ Context fetch failed:", err);
    }

    return ctx;
  }

  /* -----------------------------------------------------------
     Send message to backend Groq AI endpoint
  ------------------------------------------------------------ */
  async function sendToAI(questionText) {
    try {
      const context = await buildAIContext();

      const res = await fetch(`${API_BASE}/api/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText, context })
      });

      if (!res.ok) {
        console.error("AI backend error:", res.status);
        return `⚠️ Server error (${res.status})`;
      }

      const data = await res.json();
      return data.answer || "⚠️ No response from AI.";
    } catch (err) {
      console.error("AI Error:", err);
      return "⚠️ Could not reach AI service.";
    }
  }

  /* -----------------------------------------------------------
     Bubble UI generator for chat
  ------------------------------------------------------------ */
  function createBubble(containerId, sender, text) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    // Container wrapper (ensures proper vertical flow)
    const wrapper = document.createElement("div");
    wrapper.style.clear = "both";

    // Bubble
    const bubble = document.createElement("div");
    bubble.style.padding = "8px 12px";
    bubble.style.margin = "6px 0";
    bubble.style.borderRadius = "12px";
    bubble.style.maxWidth = "85%";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.style.display = "inline-block";
    bubble.style.fontSize = "0.95rem";

    if (sender === "user") {
      bubble.style.background = "#d4f3d2";
      bubble.style.fontWeight = "bold";
      bubble.textContent = `You: ${text}`;
      bubble.style.float = "right";
    } else {
      bubble.style.background = "#ececec";
      bubble.textContent = `AI: ${text}`;
      bubble.style.float = "left";
    }

    wrapper.appendChild(bubble);
    container.appendChild(wrapper);

    container.scrollTop = container.scrollHeight;
    return wrapper;
  }

  /* -----------------------------------------------------------
     MAIN HANDLER FUNCTION (called from buttons)
     Example usage: <button onclick="handleUniversalAI()">Ask</button>
  ------------------------------------------------------------ */
  async function handleUniversalAI(inputId = "aiQuestion", outputId = "aiResponse") {
    const inputEl = document.getElementById(inputId);
    const chatBox = document.getElementById(outputId);

    if (!inputEl || !chatBox) {
      console.warn("AI elements missing:", inputId, outputId);
      return;
    }

    const question = inputEl.value.trim();
    if (!question) return;

    // Add user bubble
    createBubble(outputId, "user", question);

    // Temporary bubble AI: Thinking...
    const tempBubble = createBubble(outputId, "ai", "⏳ Thinking...");

    // Fetch AI response from Groq
    const reply = await sendToAI(question);

    // Replace placeholder bubble text
    if (tempBubble && tempBubble.firstChild) {
      tempBubble.firstChild.textContent = `AI: ${reply}`;
    }

    inputEl.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  /* -----------------------------------------------------------
     Expose function globally
  ------------------------------------------------------------ */
  window.handleUniversalAI = handleUniversalAI;

})();
