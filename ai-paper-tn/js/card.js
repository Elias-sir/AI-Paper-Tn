import { supabase } from "./supabase.js";

export async function createAICard(ai) {

  /* ─────────────────────────────
     🔐 USER CONNECTÉ
  ───────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser();

  /* ─────────────────────────────
     ❤️ ÉTAT LIKE USER
  ───────────────────────────── */
  let userHasLiked = ai.userHasLiked === true;



  /* ─────────────────────────────
     🔢 NOMBRE DE LIKES (déjà calculé)
  ───────────────────────────── */
  const likes = ai.likes ?? ai.likes_count ?? 0;
  ai.likes = likes;


  /* ─────────────────────────────
     📦 CRÉATION CARD
  ───────────────────────────── */
  const card = document.createElement("section");
  card.className = "ai-card";

  const logoUrl   = ai.logo || "assets/icons/default.png";
  const name      = ai.name || "IA inconnue";
  const vibe      = ai.vibe || "Pas de description";
  const category  = ai.category || "green";
  
   const media = ai.media || ""; // media au centre

 let signals = [];
if (ai.signals) {
  if (typeof ai.signals === "string") {
    signals = ai.signals.split(",").map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(ai.signals)) {
    signals = ai.signals;
  }
}

  card.innerHTML = `
    <div class="ai-top ai-card-content">
      <div class="ai-info">
        <div class="ai-header tag-${category}">${name}</div>
        <div class="ai-vibe">${vibe}</div>
      </div>

      <div class="ai-logo">
        <img src="${logoUrl}" alt="${name}">
      </div>
    </div>

     <div class="ai-center">
      ${
        media
          ? `<img src="${media}" class="ai-main-image" alt="${name}" />`
          : `<div class="ai-placeholder">Image IA</div>`
      }
    </div>

      <div class="ai-badges">
  ${signals.map(b => `<div class="ai-badge">${b}</div>`).join("")}
</div>


      <div class="ai-btn like-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="1.5" class="icon-heart">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"/> 
            </svg>
        <span class="like-count">${likes}</span>
      </div>
    </div>
  `;

  // JS : micro effet emoji
//const punchlineEl = card.querySelector(".ai-punchline");
//punchlineEl.innerHTML += `<span class="punchlight">⚡</span>`;

 // petit éclair pour attirer l'oeil

  /* ─────────────────────────────
     🎯 DOM READY
  ───────────────────────────── */
  const likeBtn = card.querySelector(".like-btn");
  const countEl = card.querySelector(".like-count");

 


  // ❤️ état visuel initial
  if (userHasLiked) {
    likeBtn.classList.add("liked");
  }

  /* ─────────────────────────────
     ❤️ LIKE / UNLIKE
  ───────────────────────────── */
 likeBtn.addEventListener(
  "click",
  async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    likeBtn.style.pointerEvents = "none";

    
     if (!userHasLiked) {
    // ❤️ LIKE
    const { error } = await supabase
      .from("ai_likes")
      .insert({ user_id: user.id, ai_id: ai.id });

    if (!error) {
      ai.likes += 1; // UI locale seulement
      userHasLiked = true;
      likeBtn.classList.add("liked");
      countEl.textContent = ai.likes;
    }

  } else {
    // 💔 UNLIKE
    const { error } = await supabase
      .from("ai_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("ai_id", ai.id);

    if (!error) {
      ai.likes = Math.max(0, ai.likes - 1); // UI locale
      userHasLiked = false;
      likeBtn.classList.remove("liked");
      countEl.textContent = ai.likes;
    }
  }

  likeBtn.style.pointerEvents = "auto";
}, true);


  /* ─────────────────────────────
     🔗 NAVIGATION
  ───────────────────────────── */
  card.addEventListener("click", (e) => {
    if (e.target.closest(".like-btn")) return;
    window.location.href = `ai-detail.html?id=${ai.id}`;
  });



  return card;
}
