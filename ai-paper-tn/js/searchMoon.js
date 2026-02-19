import { supabase } from './supabase.js';


function formatUsers(count) {
  if (!count) return "0";
  if (count >= 1_000_000) return Math.round(count / 1_000_000) + "M";
  if (count >= 1_000) return Math.round(count / 1_000) + "k";
  return count.toString();
}

// -------------------- Search Moon --------------------
document.addEventListener('DOMContentLoaded', () => {
  const searchMoon = document.getElementById("search-moon");
  const searchInput = document.getElementById("search-moon-input");
  const resultsContainer = document.getElementById("search-moon-results");
  const searchOpen = document.getElementById("search-open");
  const mobileSearchOpen = document.getElementById("mobile-search-open");
  const searchClose = document.getElementById("search-moon-close");
  const burger = document.getElementById("nav-burger");
const mobileMenu = document.getElementById("mobile-menu");

  if (!searchMoon || !searchInput || !resultsContainer) return;

  // --- ouverture/fermeture ---
  const openSearch = () => {
    searchMoon.classList.add("active");
    searchMoon.setAttribute("aria-hidden", "false");
    setTimeout(() => searchInput.focus(), 100);
  };
  const closeSearch = () => {
    searchMoon.classList.remove("active");
    searchMoon.setAttribute("aria-hidden", "true");
    searchInput.value = "";
    resultsContainer.innerHTML = "";
  };

  searchOpen?.addEventListener("click", openSearch);
  mobileSearchOpen?.addEventListener("click", openSearch);
  searchClose?.addEventListener("click", closeSearch);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && searchMoon.classList.contains("active")) closeSearch();
  });


 if (burger && mobileMenu) {
  burger.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
  });
}


// ouvre Search Moon quand on clique sur le bouton mobile
if (mobileSearchOpen && mobileMenu) {
  mobileSearchOpen.addEventListener("click", () => {
    const searchMoon = document.getElementById("search-moon");
    const searchInput = document.getElementById("search-moon-input");

    searchMoon.classList.add("active");
    searchMoon.setAttribute("aria-hidden", "false");
    setTimeout(() => searchInput.focus(), 100);

    mobileMenu.classList.remove("active");
  });
}

  


  // --- fetch IA depuis Supabase ---
  let allAIs = [];
  const fetchAIs = async () => {
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .order('created_at', { ascending: false }); // plus récentes en premier

    if (error) return console.error('Erreur fetch AIs:', error);
    allAIs = data || [];
  };
  fetchAIs();

  // --- filtrage + tri ---
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    // filtre texte + use_cases
    let filtered = allAIs.filter(ai => {
      const nameMatch = ai.name.toLowerCase().includes(query);
      const categoryMatch = (ai.category || '').toLowerCase().includes(query);
      const useCasesMatch = (ai.use_cases || []).some(u => u.toLowerCase().includes(query));
      return nameMatch || categoryMatch || useCasesMatch;
    });

    // tri par popularité (likes) puis utilisateurs puis recent
    filtered.sort((a, b) => {
      // plus de likes d'abord
      if ((b.likes || 0) !== (a.likes || 0)) return (b.likes || 0) - (a.likes || 0);
      // plus d'utilisateurs d'abord
      if ((b.users || 0) !== (a.users || 0)) return (b.users || 0) - (a.users || 0);
      // plus récent
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // affichage
   resultsContainer.innerHTML = filtered.length > 0
  ? filtered.map(ai => {
      const logoUrl   = ai.logo_url || "assets/icons/default.png";
      const name      = ai.name || "IA inconnue";
      const description = ai.description || ""; 
      const category  = ai.category || "green";
      const media = ai.media_url || ""; // au lieu de ai.media
      const signals   = ai.signals ? (Array.isArray(ai.signals) ? ai.signals : ai.signals.split(",").map(s => s.trim())) : [];

      

      return `
  <div class="search-moon-card mini ai-card-content" data-id="${ai.id}">
    
    <div class="ai-top">
      <div class="ai-info">
        <div class="ai-header tag-${category}">${name}</div>
        ${description ? `<div class="ai-vibe">${description}</div>` : ""}
      </div>

      <div class="ai-logo">
        <img src="${logoUrl}" alt="${name}">
      </div>
    </div>

   <div class="ai-center">
  ${media
    ? `<img src="${media}" class="ai-main-image" alt="${name}" />`
    : `<div class="ai-placeholder">Image IA</div>`}
</div>


    ${signals.length > 0 ? `
      <div class="ai-badges">
        ${signals.map(b => `<div class="ai-badge">${b}</div>`).join("")}
      </div>
    ` : ""}

   <div class="ai-stats">

  <div class="ai-users">
    <i class="ph ph-users"></i>
    <span>${formatUsers(ai.users || 0)}</span>
  </div>

  <div class="ai-btn like-btn">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" stroke="currentColor"
      stroke-width="1.5" class="icon-heart">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"/>
    </svg>
    <span class="like-count">${ai.likes || 0}</span>
  </div>

</div>


  </div>
`;


    }).join('')
  : `<p style="color:#888;text-align:center;margin-top:10px;">
       Aucun résultat.
       <a href="propose-ai.html" style="color:#4fc3f7; text-decoration:underline;">
         Proposez votre AI à l’administrateur
       </a>
     </p>`;


    // clic carte → détail
    document.querySelectorAll('.search-moon-card').forEach(card => {
  card.addEventListener('click', () => {
    const id = card.dataset.id;
    if (id) {
      // redirection vers la page détail avec query param
      window.location.href = `ai-detail.html?id=${id}`;
    }
  });
});

  });
});
