console.log('loginSubmit:', document.getElementById('login-submit'));

import { supabase } from './supabase.js';

const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmit = document.getElementById('login-submit');
const loginError = document.getElementById('login-error');

if (loginSubmit) {
  loginSubmit.addEventListener('click', async () => {
    loginError.textContent = '';
    console.log('Login JS chargé'); // ou Register JS chargé



  // 1️⃣ Connexion via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value,
  });

  if (authError) {
    loginError.textContent = authError.message;
    return;
  }

  // 2️⃣ Récupérer le pseudo depuis la table users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('pseudo, avatar')
    .eq('id', authData.user.id)
    .single();

  if (userError) {
    loginError.textContent = userError.message;
    return;
  }

  // 3️⃣ Stocker pseudo dans sessionStorage pour usage futur
sessionStorage.setItem('pseudo', userData.pseudo);
sessionStorage.setItem(
  'avatar',
  userData.avatar || 'assents/icons/default-profile.png'
);





  // 4️⃣ Redirection vers index.html
  window.location.href = 'index.html';
});
 }
