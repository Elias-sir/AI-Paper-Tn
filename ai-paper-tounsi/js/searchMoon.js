import { supabase } from './supabase.js';

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
      const vibe      = ai.vibe || "";
      const category  = ai.category || "green";
      const punchline = ai.punchline || "";
      const signals   = ai.signals ? (Array.isArray(ai.signals) ? ai.signals : ai.signals.split(",").map(s => s.trim())) : [];

      return `
        <div class="search-moon-card mini" data-id="${ai.id}">
          <div class="ai-top">
            <div class="ai-info">
              <div class="ai-header tag-${category}">${name}</div>
              ${vibe ? `<div class="ai-vibe mini">${vibe}</div>` : ""}
            </div>
            <div class="ai-logo mini">
              <img src="${logoUrl}" alt="${name}">
            </div>
          </div>

          ${punchline ? `<div class="ai-center mini">
            <p class="ai-punchline mini">${punchline}<span class="punchlight">⚡</span></p>
          </div>` : ""}

          ${signals.length > 0 ? `<div class="ai-badges">
            ${signals.map(b => `<div class="ai-badge mini">${b}</div>`).join("")}
          </div>` : ""}

          <div class="ai-stats">
            🌙 ${ai.users || 0} utilisateurs • ❤️ ${ai.likes || 0}
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
