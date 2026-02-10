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

// -------------------- FETCH IA --------------------
async function fetchAIs() {
  const ul = document.getElementById('ais');
  if (!ul) return console.error('Ul not found');

  const { data, error } = await supabase
    .from('ai_tools')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error('Erreur fetch IA:', error);

  ul.innerHTML = '';
  data.forEach(ai => {
    const li = document.createElement('li');
    li.textContent = `${ai.name} [${ai.category}] - ${ai.status}`;

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
const users = document.getElementById("ai-users").value.trim();
const author = document.getElementById("ai-author").value.trim();

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
  badges, signals, punchline,
  youtube_videos,
  footer_videos,use_cases,
  website_url, story, users, author
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
    badges, signals, punchline,youtube_videos, website_url, story, 
    users, author,footer_videos ,use_cases, status: 'published', 
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
  document.getElementById('ai-punchline').value = '';
  document.getElementById('ai-signals').value = '';
  document.querySelectorAll(".yt-input, .footer-video-input")
  .forEach(i => i.value = "");

  


  fetchAIs();
}

// -------------------- EDIT IA --------------------
function editAI(ai) {
  currentEditingAI = ai;
  document.getElementById('ai-name').value = ai.name;
  document.getElementById('ai-description').value = ai.description;
  document.getElementById('ai-logo').value = ai.logo_url;
  document.getElementById('ai-category').value = ai.category;
  document.getElementById('ai-badges').value = (ai.badges || []).join(', ');
  document.getElementById('ai-website').value = ai.website_url;
  document.getElementById('ai-punchline').value = ai.punchline || '';
  document.getElementById('ai-signals').value = ai.signals || '';
document.querySelectorAll(".yt-input").forEach((input, i) => {
  input.value = ai.youtube_videos?.[i] || "";
});

document.querySelectorAll(".footer-video-input").forEach((input, i) => {
  input.value = ai.footer_videos?.[i] || "";
});

  document.getElementById('add-ai-btn').textContent = 'Modifier IA';
}
//////////////////////   Voir en live   ////////////////////////////
const previewCard = document.getElementById("preview-card");

function updatePreview() {
  const name = document.getElementById("ai-name").value.trim() || "Nom de l'IA";
  const logo = document.getElementById("ai-logo").value.trim() || "assents/icons/...png";
  const punchline = document.getElementById("ai-punchline").value.trim() || "Ta punchline apparaîtra ici";
  const category = document.getElementById("ai-category").value.trim() || "green";
  const signals = document.getElementById("ai-signals").value.trim() || "";
  

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

      <div class="ai-center">
        <p class="ai-punchline">${punchline}</p>
      </div>

      <div class="ai-badges">
        ${badgesArray.map(b => `<div class="ai-badge">${b}</div>`).join('')}
      </div>
    </div>
  `;
}

// écoute sur tous les inputs pertinents
["ai-name","ai-logo","ai-category","ai-punchline","ai-signals"].forEach(id => {
  document.getElementById(id).addEventListener("input", updatePreview);
});

// initialiser la preview au chargement
updatePreview();

///////////////////////   preview ai detail   ////////////////
const detailPreview = document.getElementById("detail-preview-card");

function updateDetailPreview() {
  const footerVideos = [...document.querySelectorAll(".footer-video-input")]
  .map(i => i.value.trim())
  .filter(Boolean);

  const name = document.getElementById("ai-name").value.trim() || "Nom de l'IA";
  const logo = document.getElementById("ai-logo").value.trim() || "assets/icons/default-profile.png";
  const punchline = document.getElementById("ai-punchline").value.trim() || "Ta punchline ici";
  const story = document.getElementById("ai-story").value.trim() || "Récit de l'IA...";
  const users = document.getElementById("ai-users").value.trim() || "+0 utilisateurs";
  const author = document.getElementById("ai-author").value.trim() || "Auteur inconnu";
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
          <p><strong>Utilisateurs:</strong> ${users}</p>
          <p><strong>Rédacteur:</strong> ${author}</p>
          ${badges.length ? `<div class="ai-badges">${badges.map(b => `<div class="ai-badge">${b}</div>`).join('')}</div>` : ""}
        </div>
      </div>

      <div class="ai-story">
        <h2>Histoire / Explication</h2>
        <p>${story}</p>
      </div>

${ytHTML ? `
<div class="ai-youtube">
  <h2>Vidéos YouTube</h2>
  <div class="yt-grid">${ytHTML}</div>
</div>` : ""}

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
});
