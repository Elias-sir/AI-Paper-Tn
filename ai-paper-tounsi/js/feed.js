// logique du feed qui affiche les AI inscrites
import { supabase } from "./supabase.js";
import { createAICard } from "./card.js";

const feedCards = document.getElementById("feed-cards");

async function fetchAIsForFeed() {
  // récupérer les IA depuis Supabase
 const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from("ai_tools")
  .select(`
  id,
  name,
  description,
  logo_url,
  category,
  punchline,
  signals,
  use_cases,
  likes_count,
  ai_likes ( user_id )
`)

  .order("created_at", { ascending: false });


  if (error) {
    console.error("Erreur fetch IA:", error);
    return;
  }

  // 🔥 TRIER LES IA PAR NOMBRE DE LIKES DÉCROISSANT
data.sort((a, b) => b.ai_likes.length - a.ai_likes.length);
console.log(data[0].use_cases);


  feedCards.innerHTML = "";

  // ⚠️ for...of + await (OBLIGATOIRE)
for (const ai of data) {
  const likes = ai.ai_likes.length; // ✅ compteur basé sur tous les likes
  const userHasLiked = user
    ? ai.ai_likes.some(like => like.user_id === user.id)
    : false;

  const cardData = {
    id: ai.id,
    name: ai.name,
    vibe: ai.description || "",
    logo: ai.logo_url || "",
    category: ai.category || "green",
    punchline: ai.punchline || "",
    signals: ai.signals || [],
    likes,
    userHasLiked,
    use_cases: ai.use_cases || [],
  created_at: ai.created_at
  };

  const card = await createAICard(cardData); 
  feedCards.appendChild(card);

}


}


// fetch au chargement
fetchAIsForFeed();

