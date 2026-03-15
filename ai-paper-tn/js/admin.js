import { supabase } from './supabase.js';

// -------------------- LISTE DES ADMINS --------------------
const ADMIN_EMAILS = [
  'super_adminaipaper.visionon.world@gmail.com',
  'super_adminaipaper.visionon.world2@gmail.com',
  'super_adminaipaper.visionon.world3@gmail.com',
];

let currentEditingAI = null;

// -------------------- mini écrans YouTube 🎥 --------------------
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


// -------------------- CHECK ADMIN ET PROTECTION API --------------------
async function checkAdminAccess() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (!session) {
      console.log('Pas de session active, redirection vers login');
      window.location.replace('login.html');
      return false;
    }

    const user = session.user;
    console.log('Utilisateur connecté:', user.email);

    if (!ADMIN_EMAILS.includes(user.email)) {
      console.log('Accès refusé : non admin');
      alert('Vous n\'avez pas les droits pour accéder à cette page.');
      window.location.replace('index.html');
      return false;
    }

    // Override de toutes les fonctions Supabase sensibles pour empêcher usage si non admin
    const safeSupabase = new Proxy(supabase, {
      get(target, prop) {
        if (['from', 'rpc', 'auth'].includes(prop)) {
          return target[prop].bind(target);
        }
        console.warn(`Accès bloqué à supabase.${prop} pour non-admin`);
        return () => { throw new Error('Accès API interdit'); };
      }
    });

    return true;

  } catch (err) {
    console.error('Erreur check admin:', err);
    window.location.replace('login.html');
    return false;
  }
}



// -------------------- FETCH IA + STAT CLICK --------------------
async function fetchAIs() {
  const ul = document.getElementById('ais');
  if (!ul) return console.error('Ul not found');

  const { data, error } = await supabase
    .from('ai_tools')
    .select('*');

  if (error) return console.error('Erreur fetch IA:', error);

  // Trier par clicks_count décroissant
  const sortedData = data.sort((a, b) => (b.clicks_count || 0) - (a.clicks_count || 0));

  ul.innerHTML = '';
  sortedData.forEach(ai => {
    const li = document.createElement('li');

    // Affichage avec clicks_count
    li.textContent = `${ai.name} [${ai.category}] - ${ai.status} - Clicks: ${ai.clicks_count || 0}`;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Modifier';
    editBtn.style.marginRight = '8px';
    editBtn.addEventListener('click', () => editAI(ai));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Supprimer';
    deleteBtn.addEventListener('click', () => deleteAI(ai.id));

    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    ul.appendChild(li);
  });
}

// -------------------- SUPPRIMER IA --------------------
async function deleteAI(id) {
  if (!confirm('Voulez-vous vraiment supprimer cette IA ?')) return;

  const { error } = await supabase
    .from('ai_tools')
    .delete()
    .eq('id', id);

  if (error) return console.error('Erreur delete IA:', error);

  fetchAIs();
}

// -------------------- AJOUT / MODIF IA --------------------
async function handleAddOrEdit() {
  const addBtn = document.getElementById('add-ai-btn');
  const name = document.getElementById('ai-name').value;
  const description = document.getElementById('ai-description').value;
  const logo_url = document.getElementById('ai-logo').value;
  const category = document.getElementById('ai-category').value;
  const badges = document.getElementById('ai-badges').value.split(',').map(b => b.trim());
  const website_url = document.getElementById('ai-website').value;
  const punchline = document.getElementById("ai-punchline").value.trim();

  const signals = document.getElementById("ai-signals").value.trim();
const story = document.getElementById("ai-story").value.trim();
const users = document.getElementById("ai-users")?.value.trim() || "";
const country = document.getElementById("ai-country")?.value.trim() || "";
const author = document.getElementById("ai-author")?.value.trim() || "Auteur inconnu";
const utility = document.getElementById("ai-utility")?.value.trim() || "";
const target = document.getElementById("ai-target")?.value.trim() || "";
const payment = document.getElementById("ai-payment")?.value.trim() || "";
const advantages = document.getElementById("ai-advantages")?.value.trim() || "";
const disadvantages = document.getElementById("ai-disadvantages")?.value.trim() || "";
const media_url = document.getElementById("ai-media")?.value.trim() || "";



const use_cases = document
  .getElementById("ai-use-cases")
  .value
  .split(",")
  .map(u => u.trim())
  .filter(Boolean);

const youtube_videos = [...document.querySelectorAll(".yt-input")]
  .map(i => i.value.trim())
  .filter(Boolean)
  .slice(0, 5);

const footer_videos = [...document.querySelectorAll(".footer-video-input")]
  .map(i => i.value.trim())
  .filter(Boolean)
  .slice(0, 5);

if (youtube_videos.length >= 5) {
  document.querySelectorAll(".yt-input").forEach((i, idx) => {
    if (idx >= 5) i.disabled = true;
  });
}



  if (currentEditingAI) {
    const { error } = await supabase
      .from('ai_tools')

      .update({
  name, description, logo_url, category,
  badges, signals,media_url,punchline,
  youtube_videos,
  footer_videos,use_cases,
  website_url, story, users, author , country , utility, target, payment, advantages, disadvantages
})

      .eq('id', currentEditingAI.id);

    if (error) return console.error('Erreur update IA:', error);

    alert('IA modifiée avec succès !');
    currentEditingAI = null;
    addBtn.textContent = 'Ajouter l\'IA';
  } else {
    const { error } = await supabase
    .from('ai_tools')

    .insert([
  { name, description, logo_url, category, 
    badges, signals, media_url,punchline,youtube_videos, website_url, story, 
    users, author,country,utility, target, payment, advantages, disadvantages ,footer_videos ,use_cases, status: 'published', 
    created_by: null },
]);

    if (error) return console.error('Erreur ajout IA:', error);

    alert('IA ajoutée avec succès !');
  }

  // Reset formulaire
document.getElementById('ai-name').value = '';
  document.getElementById('ai-description').value = '';
  document.getElementById('ai-logo').value = '';
  document.getElementById('ai-category').value = '';
  document.getElementById('ai-badges').value = '';
  document.getElementById('ai-website').value = '';
  document.getElementById('ai-media').value = '';
  document.getElementById('ai-punchline').value = '';
  document.getElementById('ai-signals').value = '';
  document.getElementById('ai-users').value = '';
  document.getElementById('ai-author').value = '';
  document.getElementById('ai-country').value = '';
  document.getElementById('ai-utility').value = '';
  document.getElementById('ai-target').value = '';
  document.getElementById('ai-payment').value = '';
  document.getElementById('ai-advantages').value = '';
  document.getElementById('ai-disadvantages').value = '';
  document.getElementById('ai-story').value = '';
  document.querySelectorAll(".yt-input, .footer-video-input")
  .forEach(i => i.value = "");

  


  fetchAIs();
}

// -------------------- EDIT IA --------------------
function editAI(ai) {
  currentEditingAI = ai;

   document.getElementById('ai-name').value = ai.name || '';
  document.getElementById('ai-description').value = ai.description || '';
  document.getElementById('ai-logo').value = ai.logo_url || '';
  document.getElementById('ai-category').value = ai.category || '';
  
  document.getElementById('ai-website').value = ai.website_url || '';
  document.getElementById('ai-media').value = ai.media_url || '';
  document.getElementById('ai-punchline').value = ai.punchline || '';

  document.getElementById('ai-badges').value = 
  Array.isArray(ai.badges) ? ai.badges.join(', ') : (ai.badges || '');

document.getElementById('ai-signals').value = 
  Array.isArray(ai.signals) ? ai.signals.join(', ') : (ai.signals || '');

 document.getElementById('ai-users').value =
  Array.isArray(ai.users) ? ai.users.join(', ') : (ai.users || '');

  document.getElementById('ai-author').value = ai.author || '';
  document.getElementById('ai-country').value = ai.country || '';
  document.getElementById('ai-utility').value = ai.utility || '';
  document.getElementById('ai-target').value = ai.target || '';
  document.getElementById('ai-payment').value = ai.payment || '';

  document.getElementById('ai-advantages').value =
  Array.isArray(ai.advantages) ? ai.advantages.join(', ') : (ai.advantages || '');

document.getElementById('ai-disadvantages').value =
  Array.isArray(ai.disadvantages) ? ai.disadvantages.join(', ') : (ai.disadvantages || '');

  document.getElementById('ai-story').value = ai.story || '';
document.querySelectorAll(".yt-input").forEach((input, i) => {
  input.value = ai.youtube_videos?.[i] || "";
});

document.querySelectorAll(".footer-video-input").forEach((input, i) => {
  input.value = ai.footer_videos?.[i] || "";
});

  document.getElementById('add-ai-btn').textContent = 'Modifier IA';
}
//////////////////////   Voir en live CARTE   ////////////////////////////
const previewCard = document.getElementById("preview-card");

function updatePreview() {
  const name = document.getElementById("ai-name").value.trim() || "Nom de l'IA";
  const logo = document.getElementById("ai-logo").value.trim() || "assents/icons/...png";
 const media = document.getElementById("ai-media").value.trim();
  const category = document.getElementById("ai-category").value.trim() || "green";
  const signals = document.getElementById("ai-signals").value.trim() || "";
  const description = document.getElementById("ai-description").value.trim() || "Description de l'IA";

  

  // badges animés
  const badgesArray = signals.split(",").map(b => b.trim()).filter(b => b);

  previewCard.innerHTML = `
    <div class="ai-card">
      <div class="ai-top">
        <div class="ai-info">
          <div class="ai-header tag-${category}">${name}</div>
        </div>
        <div class="ai-logo">
          <img src="${logo}" alt="${name}" />
        </div>
      </div>
<p class="ai-description">${description}</p> 
   <div class="ai-center">
      ${
        media
          ? `<img src="${media}" class="ai-main-image" alt="${name}" />`
          : `<div class="ai-placeholder">Image IA</div>`
      }
    </div>
  `;
}

// écoute sur tous les inputs pertinents
["ai-name","ai-logo","ai-category","ai-media","ai-signals","ai-description"].forEach(id => {
  document.getElementById(id).addEventListener("input", updatePreview);
});

// initialiser la preview au chargement
updatePreview();

///////////////////////   preview AI DETAILS   ////////////////

function formatUsers(count) {
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(0) + " millions";
  if (count >= 1_000) return (count / 1_000).toFixed(0) + "k";
  return count.toString();
}



const detailPreview = document.getElementById("detail-preview-card");

function updateDetailPreview() {
  const footerVideos = [...document.querySelectorAll(".footer-video-input")]
  .map(i => i.value.trim())
  .filter(Boolean);

  const name = document.getElementById("ai-name").value.trim() || "Nom de l'IA";
  const logo = document.getElementById("ai-logo").value.trim() || "assets/icons/default-profile.png";
  const media = document.getElementById("ai-media").value.trim();
  const punchline = document.getElementById("ai-punchline").value.trim() || "Ta punchline ici";
  const story = document.getElementById("ai-story").value.trim() || "Récit de l'IA...";
  const usersInput = document.getElementById("ai-users").value.trim();
const usersCount = usersInput ? parseInt(usersInput.replace(/\D/g, '')) : 0;
  const author = document.getElementById("ai-author").value.trim() || "Auteur inconnu";
  const countryInput = document.getElementById("ai-country");
const country = countryInput ? countryInput.value.trim() : "Pays inconnu";
const utility = document.getElementById("ai-utility").value.trim();
const target = document.getElementById("ai-target").value.trim();
const payment = document.getElementById("ai-payment").value.trim();
const advantages = document.getElementById("ai-advantages").value.trim();
const disadvantages = document.getElementById("ai-disadvantages").value.trim();

  const badges = document.getElementById("ai-signals").value.split(",").map(b => b.trim()).filter(b => b);
  const ytVideos = [...document.querySelectorAll(".yt-input")]
  .map(i => i.value.trim())
  .filter(Boolean);

const ytHTML = ytVideos.map(url => {
  const thumb = getYoutubeThumb(url);
  return thumb ? `
    <a href="${url}" target="_blank" class="yt-thumb">
      <img src="${thumb}" />
      <span>▶</span>
    </a>
  ` : "";
}).join("");


  detailPreview.innerHTML = `
    <div class="ai-detail-card" style="max-width:600px;">
      <div class="ai-top">
        <div class="ai-logo">
          <img src="${logo}" alt="${name}" />
        </div>
        <div class="ai-info">
          <h1>${name}</h1>
    <p class="ai-punchline">${punchline}</p>
          <p><strong>Utilisateurs:</strong> ${formatUsers(usersCount)}</p>
          <p><strong>Rédacteur:</strong> ${author}</p>
          <p><strong>Pays:</strong> ${country}</p>

          ${badges.length ? `<div class="ai-badges">${badges.map(b => `<div class="ai-badge">${b}</div>`).join('')}</div>` : ""}
        </div>
      </div>

      <div class="ai-story">
        <h2>Histoire / Explication</h2>
        <p>${story}</p>
      </div>

      ${(utility || target || payment || advantages || disadvantages) ? `
<div class="ai-features">
  <h2>💡 Fonctionnalités & Infos Clés</h2>
  ${utility ? `<p><strong>Utilité :</strong> ${utility}</p>` : ""}
  ${target ? `<p><strong>Cible :</strong> ${target}</p>` : ""}
  ${payment ? `<p><strong>Moyens de paiement :</strong> ${payment}</p>` : ""}
  ${advantages ? `<p><strong>Avantages :</strong> ${advantages}</p>` : ""}
  ${disadvantages ? `<p><strong>Désavantages :</strong> ${disadvantages}</p>` : ""}
</div>
` : ""}
<!-- Ligne séparatrice -->
<div class="divider"></div>

${footerVideos.length ? `
<div class="ai-footer-video">
  <h2>Vidéos courtes</h2>
  ${footerVideos.map(url => `
    <video
      src="${url}"
      controls
      preload="metadata"
      onloadedmetadata="this.duration > 20 && (this.currentTime = 0, this.pause())"
    ></video>
  `).join("")}
</div>` : ""}

<!-- Ligne séparatrice -->
<div class="divider"></div>

${ytHTML ? `
<div class="ai-youtube">
  <h2>Vidéos YouTube</h2>
  <div class="yt-grid">${ytHTML}</div>
</div>` : ""}

<!-- Ligne séparatrice -->
<div class="divider"></div>

    </div>
  `;
}

// Écoute sur tous les inputs pour mettre à jour la preview
[
  "ai-name","ai-logo","ai-punchline",
  "ai-story","ai-users","ai-author","ai-signals"
].forEach(id => {
  document.getElementById(id).addEventListener("input", updateDetailPreview);
});

document.querySelectorAll(".yt-input, .footer-video-input")
  .forEach(i => i.addEventListener("input", updateDetailPreview));


// Initialiser au chargement
updateDetailPreview();


// -------------------- FETCH USERS --------------------
async function fetchUsers() {
  const container = document.getElementById('users-list');
  if (!container) return console.error('Container users-list non trouvé');

  const { data: users, error } = await supabase
    .from('users')
    .select('id,email,pseudo,created_at,avatar,bio,badge_id');

  if (error) return console.error('Erreur fetch users:', error);

  container.innerHTML = '';

  users.forEach(user => {
    const div = document.createElement('div');
    div.classList.add('user-card');

    div.innerHTML = `
      <div class="user-avatar">
        <img src="${user.avatar || 'assets/icons/default-avatar.png'}" alt="${user.pseudo}" />
      </div>
      <div class="user-info">
        <p class="user-pseudo">${user.pseudo}</p>
        <p class="user-email">${user.email}</p>
        <p class="user-joined">Inscrit le: ${new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    `;

    // 👉 Ici, on redirige vers profile.html avec l'ID du user
  div.querySelector('.user-avatar img').addEventListener('click', () => {
    window.location.href = `profile.html?id=${user.id}`;
  });
    container.appendChild(div);
  });
}


async function fetchUsersCount() {
  const countEl = document.getElementById('users-count');

  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Erreur count users:', error);
    return;
  }

  countEl.textContent = count;
}


// -------------------- OUVRIR PROFIL UTILISATEUR --------------------
function openUserProfile(userId) {
  // pour l'instant, juste un console log, plus tard on ouvre le détail
  console.log('Ouvrir profil user ID:', userId);
}


// -------------------- INIT --------------------
document.addEventListener('DOMContentLoaded', async () => {
  const hasAccess = await checkAdminAccess();
  if (!hasAccess) return;

  document.body.style.display = 'block';

  // Ajouter listener pour le bouton ajout/modif
  const addBtn = document.getElementById('add-ai-btn');
  addBtn.addEventListener('click', handleAddOrEdit);

  // Charger la liste des IA
  fetchAIs();
  fetchUsers();
  fetchUsersCount(); 
});
