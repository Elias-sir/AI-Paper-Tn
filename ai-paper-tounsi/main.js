import { supabase } from "./js/supabase.js";

console.log("Supabase prêt", supabase);

// Récupérer pseudo depuis sessionStorage
const navRight = document.getElementById('nav-right');
const pseudo = sessionStorage.getItem("pseudo");


const avatarUrl = sessionStorage.getItem("avatar") || "assents/icons/default-profile.png";
console.log("DEBUG NAV AVATAR →", avatarUrl);




if (pseudo) {
  // User connecté → afficher profil + logout
  navRight.innerHTML = `

 <button class="nav-btn search-btn" id="search-open" aria-label="Rechercher une IA">
  <i class="ph ph-magnifying-glass"></i>
  <span>Recherche AI</span>
</button>


 <button id="profile-btn" class="nav-profile">
  <img class="nav-avatar" src="${avatarUrl}" alt="Avatar">
  <span>${pseudo}</span>
</button>

    
  <button id="logout-btn" class="nav-btn">Déconnexion</button>

<button class="nav-btn notif-btn" id="notif-btn" aria-label="Messagerie">
  <i class="ph ph-chat-text"></i>
  <span>Message</span>
</button>


`;



} else {
  // User pas connecté → garder nav normal
  navRight.innerHTML = `

  <button class="nav-btn search-btn" id="search-open" aria-label="Rechercher une IA">
  <i class="ph ph-magnifying-glass"></i>
  <span>Recherche AI</span>
</button>



    <a href="login.html" class="nav-btn" id="login-btn">Connexion</a>
    
   <button class="nav-btn notif-btn" id="notif-btn" aria-label="Messagerie">
  <i class="ph ph-chat-text"></i>
  <span>Message</span>
</button>

  `;
}

   // 👉 Aller vers le profil
  const profileBtn = document.getElementById('profile-btn');
if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('pseudo');
    window.location.href = 'index.html';
  });
}


const notifBtn = document.getElementById('notif-btn');

if (notifBtn) {
  notifBtn.addEventListener('click', () => {
    window.location.href = 'messagerie.html';
  });
}
