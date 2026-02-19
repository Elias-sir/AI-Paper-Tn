import { supabase } from './supabase.js';

function getYoutubeThumb(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://img.youtube.com/vi/${u.pathname.slice(1)}/hqdefault.jpg`;
    }
    if (u.searchParams.get("v")) {
      return `https://img.youtube.com/vi/${u.searchParams.get("v")}/hqdefault.jpg`;
    }
    if (u.pathname.includes("shorts")) {
      return `https://img.youtube.com/vi/${u.pathname.split("/").pop()}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}


function formatUsers(count) {
  if (!count) return "0";
  if (count >= 1_000_000) return Math.round(count / 1_000_000) + "M";
  if (count >= 1_000) return Math.round(count / 1_000) + "k";
  return count.toString();
}



// 👇👇👇 COLLE ICI 👇👇👇
document.addEventListener("play", e => {
  const v = e.target;
  if (v.tagName === "VIDEO") {
    clearTimeout(v._limitTimer);
    v._limitTimer = setTimeout(() => {
      v.pause();
      v.currentTime = 0;
    }, 20000);
  }
}, true);

document.addEventListener("pause", e => {
  const v = e.target;
  if (v.tagName === "VIDEO" && v._limitTimer) {
    clearTimeout(v._limitTimer);
  }
}, true);
// 👆👆👆 JUSQU’ICI


// Récupérer l'ID de l'AI dans l'URL
const params = new URLSearchParams(window.location.search);
const aiId = params.get("id");


const container = document.getElementById("ai-detail-container");

async function loadAIDetail() {
  if (!aiId) {
    container.innerHTML = "<p>AI non trouvé 😅</p>";
    return;
  }

  // Récupérer l'AI depuis Supabase
  const { data: ai, error } = await supabase
    .from('ai_tools')
    .select('*')
    .eq('id', aiId)
    .single();

  if (error || !ai) {
    container.innerHTML = "<p>AI non trouvé 😅</p>";
    return;
  }

  // Fallback pour champs manquants
  const logoUrl = ai.logo_url || 'assets/icons/default-profile.png';
const name = ai.name || "IA inconnue";
const punchline = ai.punchline || "";
const description = ai.description || "Pas de description";
const story = ai.story || "";
const category = ai.category || "-18/+18";
const utility = ai.utility || "";
const target = ai.target || "";
const payment = ai.payment || "";
const advantages = ai.advantages || "";
const disadvantages = ai.disadvantages || "";
const author = ai.author || "Auteur inconnu";
// transformer users en nombre

// Récupérer le nombre d'utilisateurs correctement
let usersCount = 0;

if (ai.users) {
  if (typeof ai.users === "string") {
    // enlever tout ce qui n'est pas un chiffre et convertir en nombre
    usersCount = parseInt(ai.users.replace(/\D/g, '')) || 0;
  } else if (typeof ai.users === "number") {
    usersCount = ai.users;
  }
}

let badges = [];

if (Array.isArray(ai.badges)) {
  badges = ai.badges;
} else if (typeof ai.badges === 'string') {
  badges = ai.badges.split(',').map(b => b.trim());
}

const signals = ai.signals || "";
const websiteUrl = ai.website_url || "";

// ----------------------- PARSING YT ET FOOTER VIDEOS -----------------------
let youtubeVideos = [];
if (Array.isArray(ai.youtube_videos)) {
  youtubeVideos = ai.youtube_videos;
} else if (typeof ai.youtube_videos === 'string') {
  try {
    youtubeVideos = JSON.parse(ai.youtube_videos);
  } catch (e) {
    console.warn("Impossible de parser youtube_videos:", ai.youtube_videos);
    youtubeVideos = ai.youtube_videos.split(',').map(s => s.trim());
  }
}

let footerVideos = [];

// Vérifier si c’est un JSON string
if (typeof ai.footer_videos === "string") {
  try {
    footerVideos = JSON.parse(ai.footer_videos).map(v => v.replace(/^"|"$/g, '')); // enlever les " au début/fin
  } catch {
    footerVideos = ai.footer_videos.split(',').map(v => v.trim());
  }
} else if (Array.isArray(ai.footer_videos)) {
  footerVideos = ai.footer_videos.map(v => v.replace(/^"|"$/g, ''));
}



const featuresHTML = `
<section class="ai-features">
  <h2>💡 Fonctionnalités & Infos Clés</h2>
  ${utility ? `<p><strong>Utilité :</strong> ${utility}</p>` : ""}
  ${target ? `<p><strong>Cible :</strong> ${target}</p>` : ""}
  ${payment ? `<p><strong>Modes de paiement :</strong> ${payment}</p>` : ""}
  ${advantages ? `<p><strong>Avantages :</strong> ${advantages}</p>` : ""}
  ${disadvantages ? `<p><strong>Désavantages :</strong> ${disadvantages}</p>` : ""}
</section>
`;


const ytHTML = youtubeVideos
  .map(url => {
    const thumb = getYoutubeThumb(url);
    return thumb ? `
      <a href="${url}" target="_blank" class="yt-thumb">
        <img src="${thumb}" alt="YouTube video">
        <span class="yt-play">▶</span>
      </a>
    ` : "";
  })
  .join("");

console.log("YT Videos:", youtubeVideos);
console.log("Footer Videos:", footerVideos);





  // Génération du contenu HTML
 container.innerHTML = `
<section class="ai-detail-card">

  <!-- Top -->
  <div class="ai-top">
    <div class="ai-logo"><img src="${logoUrl}" alt="${name}"></div>
    <div class="ai-info">
      <h1>${name}</h1>
      <p class="ai-category"><strong>Catégorie:</strong> ${category}</p>
      <p class="ai-author"><strong>Page rédigé par:</strong> ${author}</p>
      <p><strong>Pays :</strong> ${ai.country || "Non spécifié"}</p>
     <p class="ai-users"><strong>Utilisateurs dans le monde :</strong> ${formatUsers(usersCount)}</p>
      ${websiteUrl ? `<p><strong>Site:</strong> <a href="${websiteUrl}" target="_blank">${websiteUrl}</a></p>` : ""}
    </div>
  </div>

  <!-- Punchline -->
  ${punchline ? `<div class="ai-center"><p class="ai-punchline">${punchline}</p></div>` : ""}

  <!-- Badges et signals -->
  <div class="ai-badges">
    ${badges.map(b => `<div class="ai-badge">${b}</div>`).join('')}
    ${signals.split(',').map(s => `<div class="ai-badge signal">${s}</div>`).join('')}
  </div>

  <!-- Story / récit -->
  ${story ? `<div class="ai-story"><h2>Histoire & Explications</h2><p>${story}</p></div>` : ""}


    <!-- Ligne séparatrice -->
<div class="divider"></div>


  ${featuresHTML}  <!-- <-- notre nouveau bloc -->

  <!-- Ligne séparatrice -->
<div class="divider"></div>

  <!-- Vidéo liens youtubes -->
 ${ytHTML ? `
<section class="ai-youtube">
  <h2>Vidéos YouTube Explicatif</h2>
  <div class="yt-grid">
    ${ytHTML}
  </div>
</section>
` : ""}
<!-- Ligne séparatrice -->
<div class="divider"></div>


${footerVideos.length ? `
<section class="ai-footer-video">
  <h2>Sponsoring</h2>
  <div class="shorts-grid">
    ${footerVideos.map(url => `
      <video 
        src="${url}" 
        controls 
        muted 
        autoplay
        loop
        playsinline
        preload="metadata">
      </video>
    `).join("")}
  </div>
</section>
` : ""}

`;

}

container.querySelectorAll("video").forEach(v => {
  v.addEventListener("ended", () => {
    v.currentTime = 0;
  });
});

// Charger le détail au démarrage
loadAIDetail();
