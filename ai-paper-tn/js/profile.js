import { supabase } from "./supabase.js";
console.log("PROFILE JS CHARGÉ");

// --- DOM elements ---
const avatarImg = document.getElementById("avatarImg");
const avatarInput = document.getElementById("avatarInput");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");

const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");

const viewPseudo = document.getElementById("viewPseudo");
const viewBio = document.getElementById("viewBio");
const viewEmail = document.getElementById("viewEmail");
const viewRole = document.getElementById("viewRole");
const viewCreated = document.getElementById("viewCreated");

const pseudoInput = document.getElementById("pseudoInput");
const bioInput = document.getElementById("bioInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");

const proposeAiBtn = document.getElementById("proposeAiBtn");
const settingsBtn = document.getElementById("settingsBtn");
const logoutBtn = document.getElementById("logoutBtn");
const notifBtn = document.getElementById("notif-btn");
// --- Upload avatar helper ---
async function uploadAvatar(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar_${userId}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // upload dans Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.error("Erreur upload avatar:", error);
    return null;
  }

  // URL publique
    const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  console.log("URL AVATAR SUPABASE:", urlData.publicUrl);

  return urlData.publicUrl;

}




// --- Charger profil depuis Supabase ---
async function loadProfile() {
  const loader = document.getElementById("profileLoader");

  // cache le vrai avatar pendant le chargement
  const avatarContainer = document.querySelector(".profile-avatar");
  avatarContainer.classList.add("hidden"); 
  loader.style.display = "flex"; // montre le loader
  viewMode.classList.add("hidden"); // cache le contenu

  // --- fetch user & profile comme avant ---
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("pseudo, bio, avatar, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(profileError);
    return;
  }

  // rôle
  const { data: roles } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", user.id);
  const role = roles?.[0]?.role || "user";

  // --- remplir les infos ---
  avatarImg.src = profile.avatar || "assents/icons/default-profile.png";
  viewPseudo.textContent = profile.pseudo;
  const badgeSpan = document.createElement("span");
  badgeSpan.className = "badge badge-vert verified pseudo-badge";
  badgeSpan.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
  viewPseudo.appendChild(badgeSpan);

  viewBio.textContent = profile.bio || "";
  viewEmail.textContent = user.email;
  viewRole.textContent = "Role: " + role;
  viewCreated.textContent = "Inscrit le: " + new Date(profile.created_at).toLocaleDateString();

  pseudoInput.value = profile.pseudo;
  bioInput.value = profile.bio || "";
  emailInput.value = user.email;

  // --- afficher tout après chargement ---
  loader.style.display = "none";       // cache loader
  viewMode.classList.remove("hidden"); // montre contenu
  avatarContainer.classList.remove("hidden"); // montre avatar
}


// --- Mode édition ---
editBtn.addEventListener("click", () => {
  viewMode.classList.add("hidden");
  editMode.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  editMode.classList.add("hidden");
  viewMode.classList.remove("hidden");
});

// --- Change avatar preview ---
changeAvatarBtn.addEventListener("click", () => {
  avatarInput.value = ""; // 🔥 reset important
  avatarInput.click();
});
avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files[0];
  if (!file) return;

  // preview immédiat
  const reader = new FileReader();
  reader.onload = () => avatarImg.src = reader.result;
  reader.readAsDataURL(file);

  // récupérer user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // upload direct
  const uploadedUrl = await uploadAvatar(file, user.id);
  if (!uploadedUrl) return;

  // update base
  const { error } = await supabase
    .from("users")
    .update({ avatar: uploadedUrl })
    .eq("id", user.id);

  if (error) {
    console.error(error);
    alert("Erreur mise à jour avatar");
    return;
  }

  avatarImg.src = uploadedUrl;
  alert("Avatar mis à jour ✅");
});

// --- Sauvegarder profil ---
editMode.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1️⃣ user connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return alert("Erreur utilisateur non connecté");

  // 2️⃣ upload avatar si changé
  let avatarUrl = null;
  if (avatarInput.files[0]) {
    const uploadedUrl = await uploadAvatar(avatarInput.files[0], user.id);
    if (uploadedUrl) avatarUrl = uploadedUrl;
  }

  try {
    // 3️⃣ update table users
    const updateData = {
  pseudo: pseudoInput.value,
  bio: bioInput.value
};

if (avatarUrl) {
  updateData.avatar = avatarUrl;
}

const { error: updateError } = await supabase
  .from("users")
  .update(updateData)
  .eq("id", user.id);

    if (updateError) throw updateError;

    // 4️⃣ update email si changé
    if (emailInput.value && emailInput.value !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: emailInput.value
      });
      if (emailError) alert("Erreur mise à jour email : " + emailError.message);
    }

    // 5️⃣ update mot de passe si fourni
    if (passwordInput.value) {
      const { error: pwError } = await supabase.auth.updateUser({
        password: passwordInput.value
      });
      if (pwError) alert("Erreur mise à jour mot de passe : " + pwError.message);
    }

   // 6️⃣ mise à jour instantanée de l'écran
// 6️⃣ Recharger les vraies données depuis Supabase
await loadProfile();

// 7️⃣ nettoyage & retour en mode view
passwordInput.value = "";
editMode.classList.add("hidden");
viewMode.classList.remove("hidden");


alert("Profil mis à jour avec succès ! 🎉");

localStorage.setItem("user_pseudo", pseudoInput.value);


  } catch (err) {
    console.error(err);
    alert("Erreur lors de la sauvegarde du profil : " + err.message);
  }
});


// --- Boutons navigation ---
proposeAiBtn.addEventListener("click", () => window.location.href = "propose-ai.html");
AproposdenousBtn.addEventListener("click", () => window.location.href = "apropos-de-nous.html");
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

if (notifBtn) {
  notifBtn.addEventListener("click", () => {
    window.location.href = "messagerie.html";
  });
}

// --- Mettre à jour l'affichage instantanément ---
function updateViewUI({ pseudo, bio, email, avatar }) {
  viewPseudo.textContent = pseudo;
  viewBio.textContent = bio || "";
  viewEmail.textContent = email;
  avatarImg.src = avatar || "assents/icons/default-profile.png";
}



// --- Init ---
loadProfile();
