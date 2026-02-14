import { supabase } from "./supabase.js";
import { createAICard } from "./card.js";

const feedCards = document.getElementById("feed-cards");

/* ─────────────────────────────
   🔹 Mélange un tableau (Fisher-Yates)
───────────────────────────── */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─────────────────────────────
   🔹 Fetch IA et sponsors + rendu feed
───────────────────────────── */
async function fetchFeed() {
  const { data: { user } } = await supabase.auth.getUser();

  // 1️⃣ Fetch IA normales
  const { data: aisData, error: aisError } = await supabase
    .from("ai_tools")
    .select(`
      id,
      name,
      description,
      logo_url,
      category,
      punchline,
      signals,
      use_cases,
      likes_count,
      ai_likes(user_id),
      created_at
    `)
    .order("created_at", { ascending: false });

  if (aisError) {
    console.error("Erreur fetch IA:", aisError);
    return;
  }

  aisData.sort((a, b) => b.ai_likes.length - a.ai_likes.length);

  // 2️⃣ Fetch cartes sponsor
  // 2️⃣ Fetch cartes sponsor
const { data: sponsorData, error: sponsorError } = await supabase
  .from("sponsor_cards")
  .select("*")
  .order("created_at", { ascending: false });

if (sponsorError) console.error("Erreur fetch sponsor cards:", sponsorError);

// ⚡ Mélange pour ne pas répéter le même sponsor
let shuffledSponsors = sponsorData ? shuffleArray(sponsorData) : [];
let usedSponsorIndexes = new Set(); // pour éviter répétition immédiate
let sponsorIndex = 0;


  // 3️⃣ Boucle sur les IA pour afficher feed + sponsors
  for (let i = 0; i < aisData.length; i++) {
    const ai = aisData[i];
    const likes = ai.ai_likes.length;
    const userHasLiked = user
      ? ai.ai_likes.some(like => like.user_id === user.id)
      : false;

    const aiCardData = {
      id: ai.id,
      name: ai.name,
      vibe: ai.description || "",
      logo: ai.logo_url || "",
      category: ai.category || "green",
      punchline: ai.punchline || "",
      signals: ai.signals || [],
      likes,
      userHasLiked,
      use_cases: ai.use_cases || [],
      created_at: ai.created_at
    };

    // ⚡ Ajouter IA normale
    const aiCard = await createAICard(aiCardData);
    feedCards.appendChild(aiCard);

    // ⚡ Insérer sponsor toutes les 2 IA
   if ((i + 1) % 2 === 0 && shuffledSponsors.length > 0) {
  // ⚡ Sélection sponsor non utilisé récemment
  let attempts = 0;
  while (usedSponsorIndexes.has(sponsorIndex) && attempts < shuffledSponsors.length) {
    sponsorIndex = (sponsorIndex + 1) % shuffledSponsors.length;
    attempts++;
  }
  const sponsor = shuffledSponsors[sponsorIndex];

  const sponsorCard = document.createElement("section");
  sponsorCard.className = "ai-card sponsor-card";

  const mediaHtml = sponsor.media_type === "video"
    ? `<video src="${sponsor.media_url}" autoplay muted loop playsinline class="ai-logo-img"></video>`
    : `<img src="${sponsor.media_url}" alt="${sponsor.title}" class="ai-logo-img">`;

  const badges = (sponsor.signals || []).map(s => `<div class="ai-badge">${s}</div>`).join("");

  sponsorCard.innerHTML = `
    <div class="ai-top ai-card-content">
      <div class="ai-info">
        <div class="ai-header tag-red">${sponsor.title} <span class="ai-badge">Sponsor</span></div>
      </div>
      <div class="ai-logo">${mediaHtml}</div>
    </div>
    <div class="ai-badges">${badges}</div>
  `;

  if (sponsor.link) {
    sponsorCard.addEventListener("click", () => window.open(sponsor.link, "_blank"));
  }

  feedCards.appendChild(sponsorCard);

  // ⚡ Ajouter à la liste des sponsors utilisés récemment
  usedSponsorIndexes.add(sponsorIndex);

  // passe au sponsor suivant pour la prochaine insertion
  sponsorIndex = (sponsorIndex + 1) % shuffledSponsors.length;
}

  }
}

// 🔹 Fetch au chargement
fetchFeed();
