import { supabase } from './supabase.js';

const BUCKET = 'ai-media';

// Nettoie le nom de fichier (accents, espaces, caractères spéciaux)
function cleanName(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

/**
 * Upload un fichier et retourne son URL publique
 */
export async function uploadFile(file, folder = 'misc') {
  const path = `${folder}/${Date.now()}-${cleanName(file.name)}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Branche un <input type="file"> sur un <input type="text">
 * targetInput  : l'input texte qui contient l'URL
 * fileInput    : l'input file
 * statusEl     : élément où afficher l'état (optionnel)
 * folder       : sous-dossier dans le bucket
 */
export function attachUploader(targetInput, fileInput, statusEl, folder) {
  if (!targetInput || !fileInput) return;

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    if (statusEl) statusEl.textContent = `⏳ Envoi… (${sizeMB} Mo)`;
    fileInput.disabled = true;

    try {
      const url = await uploadFile(file, folder);

      targetInput.value = url;
      // ⚠️ indispensable : déclenche tes previews live
      targetInput.dispatchEvent(new Event('input', { bubbles: true }));

      if (statusEl) statusEl.textContent = `✅ Envoyé (${sizeMB} Mo)`;
    } catch (err) {
      console.error('Erreur upload:', err);
      if (statusEl) statusEl.textContent = `❌ ${err.message}`;
    } finally {
      fileInput.disabled = false;
      fileInput.value = '';
    }
  });
}