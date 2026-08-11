import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, name, link } = req.body;

  if (!email || !link) {
    return res.status(400).json({ error: 'Email et lien requis' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@theais.tn', // ← à changer plus tard avec ton domaine
      to: [email],
      subject: 'Confirme ton adresse email',
      html: `
        <h1>Bienvenue sur The AI's, ${name || 'Cher utilisateur'} !</h1>
        <p>Clique sur le lien ci-dessous pour confirmer ton email :</p>
        <a href="${link}">${link}</a>
         <p>Ce lien expire dans 24h.</p>
      `,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}