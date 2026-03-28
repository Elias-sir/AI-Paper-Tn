import { supabase } from "./supabase.js";
import { createAICard } from "./card.js";

let container;

document.addEventListener("DOMContentLoaded", async () => {
  container = document.getElementById("my-ai-Container");

  if (!container) {
    console.error("Container my-ai introuvable");
    return;
  }

  await loadMyAI();
});

async function loadMyAI() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: likes } = await supabase
    .from("ai_likes")
    .select("ai_id")
    .eq("user_id", user.id);

  const ids = likes?.map(l => l.ai_id) || [];

  if (ids.length === 0) {
   container.innerHTML = `
  <div class="empty-state">
    <i class="ph ph-heart-straight"></i>

    <p>Commence à liker pour remplir ton espace</p>

    <div class="empty-icons">
      <i class="ph ph-sparkle"></i>
      <i class="ph ph-robot"></i>
      <i class="ph ph-star"></i>
    </div>

    <a href="index.html#feed-cards" class="explore-btn">
      <i class="ph ph-rocket-launch"></i>
      Explorer les IA
    </a>
  </div>
`;
    return;
  }

 const { data: ais } = await supabase
  .from("ai_tools")
  .select(`
    id,
    name,
    description,
    category,
    signals,
    logo_url,
    media_url,
    ai_likes(count),
    users,
    clicks_count,
    created_at
  `)
  .in("id", ids);

container.innerHTML = "";

for (const ai of ais) {
  ai.logo = ai.logo_url;
  ai.media = ai.media_url;
  ai.usersCount = ai.users || 0;
  ai.userHasLiked = true;
  ai.likes = ai.ai_likes?.[0]?.count || 0;

  const card = await createAICard(ai);
  container.appendChild(card);
}
}  