import { supabase } from "./supabase.js";

/* ─────────────────────────────
   🎛️ Fetch toutes les cartes sponsor
───────────────────────────── */
export async function fetchSponsorCards() {
  const { data, error } = await supabase
    .from("sponsor_cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erreur fetch sponsor cards:", error);
    return [];
  }
  return data;
}

/* ─────────────────────────────
   ➕ Créer / ✏️ Mettre à jour / ❌ Supprimer
───────────────────────────── */
export async function createSponsorCard(data) {
  const { error } = await supabase.from("sponsor_cards").insert([data]);
  if (error) console.error("Erreur create sponsor card:", error);
  return !error;
}

export async function updateSponsorCard(id, data) {
  const { error } = await supabase.from("sponsor_cards").update(data).eq("id", id);
  if (error) console.error("Erreur update sponsor card:", error);
  return !error;
}

export async function deleteSponsorCard(id) {
  const { error } = await supabase.from("sponsor_cards").delete().eq("id", id);
  if (error) console.error("Erreur delete sponsor card:", error);
  return !error;
}

/* ─────────────────────────────
   👀 Preview carte sponsor
───────────────────────────── */
export function renderSponsorCard(card) {
  const el = document.createElement("section");
  el.className = "ai-card sponsor-card";

  // Media (image ou vidéo) - reste séparé
  const media = card.media_type === "video"
    ? `<video src="${card.media_url}" autoplay muted loop playsinline class="ai-logo-img"></video>`
    : `<img src="${card.media_url}" alt="${card.title}" class="ai-logo-img">`;

  // Badges
  const badges = (card.signals || []).map(b => `<div class="ai-badge">${b}</div>`).join("");

  // Logo (optionnel)
  const logoEl = card.logo_url
    ? `<div class="ai-logo"><img src="${card.logo_url}" alt="${card.title} logo"></div>`
    : "";

  el.innerHTML = `
    <div class="ai-top ai-card-content">
      <div class="ai-info">
        <div class="ai-header tag-red">
          ${card.title} <span class="ai-badge">Sponsor</span>
        </div>
      </div>
      ${logoEl} <!-- logo séparé ici -->
    </div>

    <div class="ai-logo">${media}</div> <!-- media séparé, centré -->

    <div class="ai-badges">${badges}</div>
  `;

  // Click ouvre le lien si présent
  if (card.link) {
    el.addEventListener("click", () => window.open(card.link, "_blank"));
  }

  return el;
}



/* ─────────────────────────────
   🔹 Render liste et setup form
───────────────────────────── */
export async function renderSponsorList(listContainer) {
  listContainer.innerHTML = "";
  const cards = await fetchSponsorCards();
  cards.forEach(c => listContainer.appendChild(renderSponsorCard(c)));
}

/* ─────────────────────────────
   🔹 Setup live preview
───────────────────────────── */
export function setupLivePreview(form, previewContainer) {
  form.addEventListener("input", () => {
    const formData = new FormData(form);
    const data = {
      title: formData.get("title"),
      logo_url: formData.get("logo_url"),      // si tu as ajouté le logo
      media_url: formData.get("media_url"),
      media_type: formData.get("media_type"),
      link: formData.get("link"),
      signals: formData.get("signals")?.split(",").map(s => s.trim()) || []
    };
    
    previewContainer.innerHTML = "";
    previewContainer.appendChild(renderSponsorCard(data));
  });
}


/* ─────────────────────────────
   🔹 Setup form create / update
───────────────────────────── */
export function setupSponsorForm(form, listContainer, previewContainer) {
  setupLivePreview(form, previewContainer);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      title: formData.get("title"),
      media_url: formData.get("media_url"),
      media_type: formData.get("media_type"),
      link: formData.get("link"),
      signals: formData.get("signals")?.split(",").map(s => s.trim()) || []
    };

    if (form.dataset.editId) {
      await updateSponsorCard(form.dataset.editId, data);
      delete form.dataset.editId;
    } else {
      await createSponsorCard(data);
    }

    form.reset();
    renderSponsorList(listContainer);
  });
}

/* ─────────────────────────────
   🔹 Setup delete + edit buttons
───────────────────────────── */
export function setupSponsorActions(listContainer, form) {
  listContainer.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (!confirm("Supprimer cette carte sponsor ?")) return;
      await deleteSponsorCard(id);
      renderSponsorList(listContainer);
    }

    if (editBtn) {
      const id = editBtn.dataset.id;
      const cards = await fetchSponsorCards();
      const card = cards.find(c => c.id == id);
      if (!card) return;

      // pré-remplir le formulaire
      form.querySelector("input[name='title']").value = card.title;
      form.querySelector("input[name='media_url']").value = card.media_url;
      form.querySelector("select[name='media_type']").value = card.media_type;
      form.querySelector("input[name='link']").value = card.link;
      form.querySelector("input[name='signals']").value = (card.signals || []).join(",");

      // garder l'id pour update
      form.dataset.editId = card.id;
    }
  });
}


/* ─────────────────────────────
   🔹 Rendre le tableau de stats
───────────────────────────── */
export async function renderSponsorStats(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const cards = await fetchSponsorCards();

  cards.forEach(card => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${card.title}</td>
      <td>${card.views_count || 0}</td>
      <td>${card.clicks_count || 0}</td>
      <td>${new Date(card.created_at).toLocaleDateString()}</td>
    `;

    tbody.appendChild(tr);
  });
}


/* ─────────────────────────────
   🔹 Initialisation complète
───────────────────────────── */
export function initSponsorAdmin(formId, listId, previewId, statsTableId) {
  const form = document.getElementById(formId);
  const listContainer = document.getElementById(listId); // rename listEl -> listContainer
  const previewContainer = document.getElementById(previewId);
  const statsTable = statsTableId ? document.getElementById(statsTableId) : null;

  if (!form || !listContainer || !previewContainer) return;

  renderSponsorList(listContainer);
  setupSponsorForm(form, listContainer, previewContainer);
  setupSponsorActions(listContainer, form);
  if (statsTableId) renderSponsorStats(statsTableId);
}

