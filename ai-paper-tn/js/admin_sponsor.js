import { supabase } from "./supabase.js";

/* ─────────────────────────────
   🎛️ Fetch toutes les cartes sponsor
───────────────────────────── */
export async function fetchSponsorCards() {
  const { data, error } = await supabase
    .from("sponsor_cards")
    .select("*")
    .order("priority", { ascending: false }) // priorité en premier
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
  const { data, error } = await supabase
    .from("sponsor_cards")
    .delete()
    .eq("id", id)
    .select();

  console.log("Delete result:", data, error);

  if (error) console.error("Erreur delete sponsor card:", error);
  return !error;
}

/* ─────────────────────────────
   👀 Render carte sponsor (preview minimal)
───────────────────────────── */
export function renderSponsorCard(sponsor) {
  // Media (image)
  const mediaHtml = sponsor.media_url
    ? `<img src="${sponsor.media_url}" class="sponsor-media" alt="${sponsor.title}">`
    : "";

  // Autres badges (séparés par signals)
  const badges = (sponsor.signals || [])
    .map(s => `<div class="badge-feed">${s}</div>`)
    .join("");

  // Logo si présent
  const logoEl = sponsor.logo_url
    ? `<div class="ai-logo"><img src="${sponsor.logo_url}" alt="${sponsor.title} logo"></div>`
    : "";

  // Création de la carte
  const sponsorCard = document.createElement("div");
  sponsorCard.className = "sponsor-admin-card";

  sponsorCard.innerHTML = `
    <div class="ai-top ai-card-content">
      <div class="ai-info">
        <div class="ai-header tag-amber">
          ${sponsor.title || "Sponsor"}
          <span class="sponsor-badge">Partenaire</span>
        </div>
        <div class="ai-vibe">${sponsor.description || "Pas de description"}</div>
      </div>
      ${logoEl}
    </div>

    <div class="ai-center sponsor-center">
      ${mediaHtml}
    </div>

    <div class="ai-badges">
      ${badges}
    </div>
  `;

  return sponsorCard;
}


/* ─────────────────────────────
   🔹 Render liste et setup form
───────────────────────────── */
export function renderSponsorListRow(card) {
  const el = document.createElement("div");
  el.className = "sponsor-list-row";

  const badges = (Array.isArray(card.signals) ? card.signals : (card.signals || "").split(",").map(s => s.trim()))
    .filter(Boolean)
    .join(", ");

  el.innerHTML = `
    <span><strong>${card.title}</strong>
    ${card.priority ? `(Priorité: ${card.priority})` : ""}
    ${card.active ? "✅ Actif" : "❌ Inactif"}
    ${badges ? ` | Badges: ${badges}` : ""}</span>

    <span class="sponsor-row-actions">
      <button class="edit-btn" data-id="${card.id}">✏️ Edit</button>
      <button class="delete-btn" data-id="${card.id}">🗑️ Delete</button>
    </span>
  `;
  return el;
}

export async function renderSponsorList(listContainer) {
  listContainer.innerHTML = "";
  const cards = await fetchSponsorCards();
  cards.forEach(card => listContainer.appendChild(renderSponsorListRow(card)));
}


/* ─────────────────────────────
   🔹 Setup live preview
───────────────────────────── */
export function setupLivePreview(form, previewContainer) {
  form.addEventListener("input", () => {
    const formData = new FormData(form);
    const data = {
      title: formData.get("title"),
      logo_url: formData.get("logo_url"),
      media_url: formData.get("media_url"),
      link: formData.get("link"),
      signals: formData.get("signals")?.split(",").map(s => s.trim()) || [],
      priority: formData.get("priority") || 0,
      active: formData.get("active") === "on",  // checkbox
      description: formData.get("description") || "" 
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
      logo_url: formData.get("logo_url"),
      media_url: formData.get("media_url"),
      link: formData.get("link"),
      signals: formData.get("signals")?.split(",").map(s => s.trim()) || [],
      priority: parseInt(formData.get("priority")) || 0,
        active: formData.get("active") === "on",  // checkbox
        description: formData.get("description") || "" 
    };

   if (form.dataset.editId) {
  if (!form.dataset.editId) {
    console.error("ID manquant pour update !");
    return;
  }
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
      form.querySelector("input[name='link']").value = card.link;
      form.querySelector("input[name='signals']").value = (card.signals || []).join(",");
      form.querySelector("input[name='logo_url']").value = card.logo_url || "";
      form.querySelector("input[name='priority']").value = card.priority || 0;

      // garder l'id pour update
      form.dataset.editId = card.id;
    }
  });
}

/* ─────────────────────────────
   🔹 Render tableau stats
───────────────────────────── */
export async function renderSponsorStats(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const cards = await fetchSponsorCards();

  cards.forEach(card => {
    const tr = document.createElement("tr");

    const ctr = card.views_count ? ((card.clicks_count || 0) / card.views_count * 100).toFixed(1) + "%" : "0%";

    tr.innerHTML = `
      <td>${card.title}</td>
      <td>${card.views_count || 0}</td>
      <td>${card.clicks_count || 0}</td>
      <td>${ctr}</td>
      <td>${new Date(card.created_at).toLocaleDateString()}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* ─────────────────────────────
   🔹 Init complet
───────────────────────────── */
export function initSponsorAdmin(formId, listId, previewId, statsTableId) {
  const form = document.getElementById(formId);
  const listContainer = document.getElementById(listId);
  const previewContainer = document.getElementById(previewId);

  if (!form || !listContainer || !previewContainer) return;

  renderSponsorList(listContainer);
  setupSponsorForm(form, listContainer, previewContainer);
  setupSponsorActions(listContainer, form);

  if (statsTableId) renderSponsorStats(statsTableId);
}
