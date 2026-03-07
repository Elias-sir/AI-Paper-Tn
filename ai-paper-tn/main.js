import { supabase } from "./js/supabase.js";
import * as Notifs from "./js/notifications.js";

console.log("Supabase prêt", supabase);

const navRight = document.getElementById('nav-right');

async function updateNav() {
  // 1️⃣ récupérer user connecté
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    // pas connecté → nav normal
    navRight.innerHTML = `
      <button class="nav-btn search-btn" id="search-open">
        <i class="ph ph-magnifying-glass"></i>
      </button>

      <button class="nav-btn notif-btn" id="notif-btn">
        <i class="ph ph-chat-text"></i>
        <span id="notif-badge"></span>
      </button>


       <!--  <a href="apropos-de-nous.html" class="nav-btn about-btn">
        <i class="ph ph-info"></i>
      </a>-->

      <a href="login.html" class="nav-btn" id="login-btn">Connexion</a>
    `;

      // 🔹 Binder badge et refresh
    Notifs.bindBadgeToElement('notif-badge');
    await Notifs.refreshNotifications();


    return;
  }

  // 2️⃣ récupérer infos dans table users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("pseudo, avatar")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Erreur récup profil nav :", profileError);
    return;
  }

  const pseudo = profile.pseudo;
  const avatarUrl = profile.avatar || "assents/icons/default-profile.png";

  // 3️⃣ mettre à jour nav
  navRight.innerHTML = `
    <button class="nav-btn search-btn" id="search-open">
      <i class="ph ph-magnifying-glass"></i>
    </button>  


    <button class="nav-btn notif-btn" id="notif-btn">
      <i class="ph ph-chat-text"></i>
      
      <span id="notif-badge"></span>
    </button>


    <!-- <a href="apropos-de-nous.html" class="nav-btn about-btn">
      <i class="ph ph-info"></i>
    </a>-->

    <!--<button id="logout-btn" class="nav-btn">Déconnexion</button>-->

    <button id="profile-btn" class="nav-profile" title="${pseudo}">
      <img class="nav-avatar" src="${avatarUrl}" alt="Avatar">
      <span>${pseudo}</span>
    </button>
  `;
 
Notifs.bindBadgeToElement('notif-badge');
await Notifs.refreshNotifications();


  // 4️⃣ ajouter events
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) profileBtn.addEventListener('click', () => window.location.href = 'profile.html');

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });

}

// --- Init ---
// --- Init ---
await updateNav();

// 🔹 Init notifications realtime
await Notifs.initNotifications();
await Notifs.subscribeNotificationsRealtime();


document.addEventListener("click", (e) => {

  // 🔎 Ouvrir Search Moon
  if (e.target.closest("#search-open")) {
    const searchMoon = document.getElementById("search-moon");
    const searchInput = document.getElementById("search-moon-input");

    if (searchMoon) {
      searchMoon.classList.add("active");
      searchMoon.setAttribute("aria-hidden", "false");
      setTimeout(() => searchInput?.focus(), 100);
    }
  }

  // 💬 Aller vers la messagerie
  if (e.target.closest("#notif-btn")) {
    window.location.href = "messagerie.html";
  }

});
