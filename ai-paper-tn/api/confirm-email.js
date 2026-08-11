import { createClient } from '@supabase/supabase-js';

// Initialisation de Supabase (avec les variables d'environnement)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ clé admin (service_role)
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    // 🔍 Récupérer l'utilisateur par son token de confirmation
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('confirmation_token', token)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // ✅ Mettre à jour l'utilisateur dans auth.users
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error('Erreur confirmation:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la confirmation' });
    }

    // 🧹 Supprimer le token (optionnel)
    await supabase
      .from('users')
      .update({ confirmation_token: null })
      .eq('id', user.id);

    return res.status(200).json({ message: 'Compte confirmé avec succès' });

  } catch (err) {
    console.error('Erreur:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}