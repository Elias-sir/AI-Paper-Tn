import { supabase } from './supabase.js';

const registerPseudo = document.getElementById('register-pseudo');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerSubmit = document.getElementById('register-submit');
const registerError = document.getElementById('register-error');

if (registerSubmit) {
  registerSubmit.addEventListener('click', async () => {
    registerError.textContent = '';
    console.log('Register JS chargé');
    // ton code existant
 


  try {
    // 1️⃣ Inscription via Supabase Auth
   const { data: authData, error: authError } =
  await supabase.auth.signUp({
    email: registerEmail.value,
    password: registerPassword.value,
    options: {
      data: {
        pseudo: registerPseudo.value
      }
    }
  });

if (authError) throw authError;


    // 2️⃣ Mettre à jour le pseudo dans users
    const { data, error } = await supabase
     

    if (error) throw error;

    // 3️⃣ Redirection vers login
    window.location.href = 'login.html';

  } catch (err) {
    registerError.textContent = err.message;
    console.error(err);
  }
});

}

