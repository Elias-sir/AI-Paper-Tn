import { supabase } from './supabase.js';

const proposeForm = document.getElementById('propose-ai-form');

proposeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const aiName = document.getElementById('ai-name').value.trim();
    const aiUseCase = document.getElementById('ai-use-case').value.trim();

    if (!aiName) return alert("Le nom de l'IA est requis !");

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return alert("Erreur, vous devez être connecté.");

    const userId = user.id;

    // Message combiné : proposition + remerciement
    const combinedMessage = `Nouvelle proposition d'IA :
Nom : ${aiName}
Utilité : ${aiUseCase}

...Merci pour votre proposition ! Nous allons faire des recherches approfondies pour trouver l'IA demandée. Vous serez informé lorsque l'IA sera mise en ligne.`;

    await handleProposalMessage(userId, combinedMessage);

    proposeForm.reset();
});



async function handleProposalMessage(userId, content) {
    // Récupérer un admin (ou le premier)
    const { data: admins } = await supabase
        .from('roles')
        .select('user_id')
        .eq('role', 'admin');

    if (!admins || admins.length === 0) return alert("Aucun admin trouvé !");
    const adminId = admins[0].user_id;

    // Vérifier ou créer la conversation
    let { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('admin_id', adminId)
        .maybeSingle();

    if (!conv) {
        const { data: newConv } = await supabase
            .from('conversations')
            .insert({ user_id, admin_id: adminId, status: 'open' })
            .select()
            .maybeSingle();
        conv = newConv;
    }

    const conversationId = conv.id;

    // Envoyer le message combiné
    await supabase.from('messages_v2').insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_role: 'user',
        content
    });

    // 🔹 Rediriger vers la conversation
    window.location.href = `messagerie.html?conversation_id=${conversationId}`;
}
