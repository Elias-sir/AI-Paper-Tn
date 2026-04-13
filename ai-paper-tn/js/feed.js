import { supabase } from "./supabase.js";
import { createAICard } from "./card.js";
import { getUser } from "./authService.js";

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
  const user = await getUser();
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

    /// MELANGES DES AI
    .order("created_at", { ascending: false });

  if (aisError) {
    console.error("Erreur fetch IA:", aisError);
    return;
  }

  aisData.sort((a, b) => b.ai_likes.length - a.ai_likes.length);

  // 2️⃣ Fetch cartes sponsor actives
const now = new Date();

const { data: sponsorRaw, error: sponsorError } = await supabase
  .from("sponsor_cards")
  .select("*")
  .eq("active", true)
  .order("priority", { ascending: false })
  .order("created_at", { ascending: false });

if (sponsorError) console.error("Erreur fetch sponsor cards:", sponsorError);

// 🔹 Filtrage temporel
const sponsorData = (sponsorRaw || []).filter(s => {
  const start = s.start_date ? new Date(s.start_date) : null;
  const end = s.end_date ? new Date(s.end_date) : null;

  if (start && start > now) return false;
  if (end && end < now) return false;

  return true;
});

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


//LA PARTIE FEED END
const feedEnd = document.querySelector('.feed-end');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      feedEnd.classList.add('visible');
    }
  });
});

observer.observe(feedEnd);




// =============  LA PARTIE AFFICHE AI DANS HERO  =================  // 
const placedAI = []; // positions déjà utilisées

// pour le fixé dans le hero pas debordement
function getNonOverlappingPosition(container, size = 45) {
  let top, left, safe = false, attempts = 0;
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const marginPx = size; // évite coupure

  while (!safe && attempts < 100) {

    // 🔥 position en PX (pas %)
    const x = marginPx + Math.random() * (width - marginPx * 2);
    const y = marginPx + Math.random() * (height - marginPx * 2);

    // converti en %
    left = (x / width) * 100;
    top = (y / height) * 100;

    safe = true;

    for (const pos of placedAI) {
      const dx = (pos.left - left) * width / 100;
      const dy = (pos.top - top) * height / 100;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < size) {
        safe = false;
        break;
      }
    }

    attempts++;
  }

  placedAI.push({ top, left });
  return { top, left };
}


//pour capturé les ai populaire
async function getPopularAI() {
  const { data, error } = await supabase
    .from("ai_tools")
    .select("*");

  if (error) return [];

const sorted = data.sort((a, b) => {
  const scoreA = (a.clicks_count || 0) + (a.likes_count || 0) * 2;
  const scoreB = (b.clicks_count || 0) + (b.likes_count || 0) * 2;
  return scoreB - scoreA;
});

// 🔥 ON LIMITE À 100
const top100 = sorted.slice(0, 100);

// top 10 parmi les 100
const top10 = top100.slice(0, 10);

return { all: top100, top10 };
}


//pour les afficher
async function displayHeroAI() {
  const { all, top10 } = await getPopularAI();

  const topIds = new Set(top10.map(ai => ai.id));

  
const container = document.querySelector(".hero-all-ai");
if (!container) return;

// 🔥 important
container.style.position = "absolute";

all.forEach((ai) => {
  const el = document.createElement("div");
  el.className = "hero-ai";

  const isTop = topIds.has(ai.id);

  el.innerHTML = `<img src="${ai.logo_url}" />`;

  el.classList.add("dim");

if (isTop) {
  el.classList.add("top-ai");
}


   // ⚡ position random avec collision
  const pos = getNonOverlappingPosition(container, 45);
  
  // 🌌 POSITION RANDOM
  el.style.position = "absolute";
  el.style.top = pos.top + "%";
  el.style.left = pos.left + "%";

 
  // 🎲 variation animation
// el.style.animationDuration = (4 + Math.random() * 4) + "s"; // 4s → 8s
// el.style.animationDelay = Math.random() * 5 + "s";//

// 🎲 profondeur (parallax)
// el.dataset.speed = (Math.random() * 0.3 + 0.05).toFixed(2); //

  el.addEventListener("click", () => {
    window.location.href = `ai-detail.html?id=${ai.id}`;
  });

  container.appendChild(el);
});
}



window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  document.querySelectorAll(".hero-ai").forEach(el => {
    const speed = parseFloat(el.dataset.speed);

    const y = scrollY * speed;

    el.style.transform = ` translateY(${y}px)`;
  });
});


// POUR AFFICHER LES 10 POPULAIRE AI AVEC ANIMATION
//setInterval(() => {
  //const topEls = document.querySelectorAll(".top-ai");

  //topEls.forEach(el => {
   // el.classList.toggle("glow");
   // el.classList.toggle("dim");
  //});

//}, 1000);
//


displayHeroAI();

// =========== LA PARTIE HERO FOOTER ===========  // 
async function displayFooterAI() {
  const { all } = await getPopularAI();

  const container = document.querySelector(".footer-ai-bg");
  if (!container) return;

  const max = 70; // moins chargé que hero
  const selected = all.slice(0, max);

  selected.forEach(ai => {
    const el = document.createElement("div");
    el.className = "footer-ai";

    el.innerHTML = `<img src="${ai.logo_url}" />`;

    // position random simple
    el.style.top = Math.random() * 100 + "%";
    el.style.left = Math.random() * 100 + "%";

    container.appendChild(el);
  });
}

displayFooterAI();


// 🔹 LANCER LE FEED
fetchFeed();