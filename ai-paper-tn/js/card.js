import { supabase } from "./supabase.js";

export async function createAICard(ai) {

  function getVisitorId() {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
}

// card.js - en haut du fichier
function formatUsers(count) {
  if (!count) return "0";
  if (count >= 1_000_000) return Math.round(count / 1_000_000) + "M";
  if (count >= 1_000) return Math.round(count / 1_000) + "k";
  return count.toString();
}

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
  const usersCount = ai.usersCount;
  
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

    <div class="ai-users-wrapper" title="Utilisateurs dans le monde" >
  <i class="ph ph-users"></i>
  <span class="ai-users-count">${formatUsers(usersCount)}</span>
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

<!-- Footer -->
  <div class="ai-footer">
      <div class="ai-btn like-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke="currentColor"
          stroke-width="1.5" class="icon-heart">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"/> 
            </svg>
        <span class="like-count">${likes}</span>
      </div>

        <!-- COMPTEUR CLICS -->
    <div class="clicks-display" title="Visiteurs">
      <i class="ph ph-eye"></i>
      <span class="clicks-count">${ai.clicks_count || 0}</span>
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
 /* ─────────────────────────────
   🔢 TRACK CLICK AI CARD (ILLIMITÉ)
───────────────────────────── */
/* ─────────────────────────────
   🔢 TRACK CLICK AI CARD (ILLIMITÉ)
───────────────────────────── */
card.addEventListener("click", async (e) => {
  // Ignorer le clic sur le bouton like
  if (e.target.closest(".like-btn")) return;

  console.log("CLICK détecté sur la card");
  console.log("ai.id:", ai.id);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Utilisateur connecté → click illimité
      const result = await supabase.rpc('increment_ai_clicks', { 
        ai_id: ai.id, 
        user_id: user.id  // juste pour info, on peut utiliser si historique
      });
      console.log("RPC result (user):", result);

    } else {
      // Visiteur non-connecté → click illimité
      const visitorId = getVisitorId();
      const result = await supabase.rpc('increment_ai_clicks_public', { 
        ai_id: ai.id, 
        visitor_id: visitorId 
      });
      console.log("RPC result (visitor):", result);
    }

    // 🔹 Mise à jour locale du compteur pour UI immédiate
    ai.clicks_count = (ai.clicks_count || 0) + 1;

    // (Optionnel) Affichage compteur quelque part si tu veux
    const clicksEl = card.querySelector(".clicks-count");
    if (clicksEl) clicksEl.textContent = ai.clicks_count;

    // 🔹 Navigation vers détail
    window.location.href = `ai-detail.html?id=${ai.id}`;

  } catch (err) {
    console.error("Erreur incrément click AI :", err.message, err);
  }
});

  return card;
}
