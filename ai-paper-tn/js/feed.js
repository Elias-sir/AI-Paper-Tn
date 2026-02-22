import { supabase } from "./supabase.js";
import { createAICard } from "./card.js";

const feedCards = document.getElementById("feed-cards");

function getVisitorId() {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
}

// 🔹 Shuffle tableau Fisher-Yates
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Fetch IA + sponsors + rendu feed
export async function fetchFeed() {
  const { data: { user } } = await supabase.auth.getUser();
console.log("Current user:", user);
  // 1️⃣ Fetch IA normales
  const { data: aisData, error: aisError } = await supabase
    .from("ai_tools")
    .select(`
      id,
      name,
      description,
      logo_url,
      category,
      media_url,
      signals,
      use_cases,
      likes_count,
      clicks_count,
      ai_likes(user_id),
      users,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (aisError) {
    console.error("Erreur fetch IA:", aisError);
    return;
  }

  aisData.sort((a, b) => b.ai_likes.length - a.ai_likes.length);

  // 2️⃣ Fetch cartes sponsor actives
  const { data: sponsorData, error: sponsorError } = await supabase
    .from("sponsor_cards")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (sponsorError) console.error("Erreur fetch sponsor cards:", sponsorError);

  // Trie et shuffle sponsors par priorité
  let sponsorsByPriority = {};
  (sponsorData || []).forEach(s => {
    const p = s.priority || 0;
    if (!sponsorsByPriority[p]) sponsorsByPriority[p] = [];
    sponsorsByPriority[p].push(s);
  });

  let sortedPriorities = Object.keys(sponsorsByPriority)
    .map(Number)
    .sort((a, b) => b - a);

  let sortedSponsors = [];
  sortedPriorities.forEach(p => {
    sortedSponsors.push(...shuffleArray(sponsorsByPriority[p]));
  });

  let usedSponsorIndexes = new Set();
  let sponsorIndex = 0;

  // 3️⃣ Boucle IA + insertion sponsor toutes les 2 IA
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
      media: ai.media_url || "",
      signals: ai.signals || [],
      likes,
      userHasLiked,
      use_cases: ai.use_cases || [],
      created_at: ai.created_at,
      clicks_count: ai.clicks_count || 0,  
      usersCount: ai.users || "0"
    };

    const aiCard = await createAICard(aiCardData);
    feedCards.appendChild(aiCard);

    // Insertion sponsor toutes les 2 IA
    if ((i + 1) % 2 === 0 && sortedSponsors.length > 0) {
      let attempts = 0;
      while (usedSponsorIndexes.has(sponsorIndex) && attempts < sortedSponsors.length) {
        sponsorIndex = (sponsorIndex + 1) % sortedSponsors.length;
        attempts++;
      }

      const sponsor = sortedSponsors[sponsorIndex];

      // 🔹 Création du logo, image et badges
      const logoEl = sponsor.logo_url
        ? `<div class="ai-logo-img"><img src="${sponsor.logo_url}" alt="${sponsor.title} logo"></div>`
        : "";

    const mediaHtml = sponsor.media_url
  ? `
    <div class="sponsor-media">
      <img src="${sponsor.media_url}" alt="${sponsor.title}">
    </div>
  `
  : "";


      const badges = (sponsor.signals || [])
        .map(s => `<div class="badge-feed">${s}</div>`)
        .join("");

      // 🔹 Carte sponsor
      const sponsorCard = document.createElement("section");
      sponsorCard.className = "ai-card sponsor-card";

      sponsorCard.innerHTML = `
        <div class="ai-top">
          <div class="ai-info">
            <div class="ai-header tag-amber">
              ${sponsor.title}
              <span class="header-badge-wrapper">
                
              </span>
            </div>
            <div class="ai-vibe">${sponsor.description || "Pas de description"}</div>

          </div>
          ${logoEl}
        </div>

        <div class="ai-center sponsor-center">
          ${mediaHtml}
        </div>

        <div class="ai-badges">
          ${badges}
        </div>
      `;

      //========== Click ouvre lien   ========  //
if (sponsor.link) {
  sponsorCard.addEventListener("click", async () => {

    // 🔹 ouvrir immédiatement
    window.open(sponsor.link, "_blank");

    try {

     if (user) {
  await supabase.rpc("increment_sponsor_click", {
    sponsor_id: sponsor.id,
    user_id: user.id
  });

      } else {
        const visitorId = getVisitorId();

        await supabase.rpc("increment_sponsor_click_public", {
          sponsor_id: sponsor.id,
          visitor_id: visitorId
        });
      }

    } catch (err) {
      console.error("Erreur incrément clic sponsor :", err);
    }

  });
}


      // ======== Tracking vues sponsor ========  ////
  // 🔹 Tracking vues sponsor
const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const sponsorCard = entry.target;

    (async () => {
      try {
        if (user) {
          await supabase.rpc("increment_sponsor_view", { sponsor_id: sponsorCard.dataset.id });
        } else {
          await supabase.rpc("increment_sponsor_public", { sponsor_id: sponsorCard.dataset.id });
        }
      } catch (err) {
        console.error("Erreur incrément vue sponsor :", err);
      }
    })();

    observer.unobserve(sponsorCard); // on arrête après la première vue
  });
}, { threshold: 0.6 });

// Assurez-vous que chaque carte a son id
sponsorCard.dataset.id = sponsor.id;
observer.observe(sponsorCard);

      feedCards.appendChild(sponsorCard);

      usedSponsorIndexes.add(sponsorIndex);
      sponsorIndex = (sponsorIndex + 1) % sortedSponsors.length;
    }
  }
}

// 🔹 Lancer fetch feed
fetchFeed();
