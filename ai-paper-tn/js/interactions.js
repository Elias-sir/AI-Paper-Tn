// interactions.js
import { supabase } from "./supabase.js";

async function updateHeroButton() {
  const heroBtn = document.querySelector('.hero-btn.primary');
  if (!heroBtn) return;

  // Récupérer user connecté
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    // pas connecté → bouton normal
    heroBtn.innerHTML = "🚀 Nous rejoindre";
    heroBtn.setAttribute('href', 'login.html');
    heroBtn.classList.add('primary');
    heroBtn.classList.remove('welcome-btn');
    return;
  }

  // Récupérer pseudo + avatar dans table users
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("pseudo, avatar")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    heroBtn.innerHTML = "Bienvenue !";
    heroBtn.removeAttribute('href');
    heroBtn.classList.remove('primary');
    heroBtn.classList.add('welcome-btn');
    return;
  }

  const avatarUrl = profile.avatar || "assents/icons/default-profile.png";

  // Modifier le bouton avec pseudo + avatar
  heroBtn.innerHTML = `
    <img src="${avatarUrl}" alt="Avatar" class="hero-avatar">
    <span>Bienvenue, ${profile.pseudo} !</span>
  `;
  heroBtn.removeAttribute('href'); // retirer le lien vers login
  heroBtn.classList.remove('primary');
  heroBtn.classList.add('welcome-btn');

  // 🔹 Redirection vers profile.html au clic
  heroBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

// Exécution au chargement
document.addEventListener('DOMContentLoaded', () => {
  updateHeroButton();
});

// Exécution au chargement
document.addEventListener('DOMContentLoaded', () => {
  updateHeroButton();
});














// likes, approvals, micro-anim

// van compte 
const aiCountEl = document.getElementById('ai-count');

let currentCount = 1;
aiCountEl.textContent = currentCount.toLocaleString();

function aiFreeFallCount() {

  currentCount += 1; // +1 à chaque fois
  aiCountEl.textContent = currentCount.toLocaleString();

  setTimeout(aiFreeFallCount, 500); // vitesse du compteur
}

aiFreeFallCount();



// fleche decouvrir dans hero 
document.querySelector(".hero-scroll")?.addEventListener("click", () => {
  document.querySelector("#feed-cards")?.scrollIntoView({
    behavior: "smooth"
  });
});

// responsive 
const burger = document.getElementById("nav-burger");
const navRight = document.getElementById("nav-right");

burger.addEventListener("click", () => {
  navRight.classList.toggle("open");
});

navRight.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navRight.classList.remove("open");
  });
});







