import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {

  // ================= LOGIN =================
  const loginSubmit = document.getElementById('login-submit');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');

  if (loginSubmit) {
    loginSubmit.addEventListener('click', async () => {
      loginError.textContent = '';
      console.log('Login bouton cliqué !');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.value,
        password: loginPassword.value,
      });
console.log("DEBUG authData:", authData.user);

   if (authError) {

  if (authError.message.includes("Invalid login credentials")) {
    loginError.textContent = "Email ou mot de passe incorrect.";
  } else if (authError.message.includes("Email not confirmed")) {
    loginError.textContent = "Veuillez confirmer votre email.";
  } else {
    loginError.textContent = "Erreur de connexion. Réessayez.";
  }

  loginError.classList.add("show");
  return;
}


      // 🔒 Vérification champs vides
if (!loginEmail.value.trim() || !loginPassword.value.trim()) {
  loginError.textContent = "Veuillez remplir tous les champs.";
  loginError.classList.add("show");
  return;
}


      const { data: userData, error: userError } = await supabase
          .from('users')
          .select('pseudo, avatar')
          .eq('id', authData.user.id)
          .single();
      
 if (authError) {

  if (authError.message.includes("Invalid login credentials")) {
    loginError.textContent = "Email ou mot de passe incorrect.";
  } else if (authError.message.includes("Email not confirmed")) {
    loginError.textContent = "Veuillez confirmer votre email.";
  } else {
    loginError.textContent = "Erreur de connexion. Réessayez.";
  }

  loginError.classList.add("show");
  return;
}
      
        // 3️⃣ Stocker pseudo dans sessionStorage pour usage futur
      sessionStorage.setItem('pseudo', userData.pseudo);
      sessionStorage.setItem(
        'avatar',
        userData.avatar || 'assents/icons/default-profile.png'
      );

      console.log("DEBUG userData:", userData);

      window.location.href = 'index.html';
    });
  }

  // ================= REGISTER =================
  const registerSubmit = document.getElementById('register-submit');
  const registerPseudo = document.getElementById('register-pseudo');
  const registerEmail = document.getElementById('register-email');
  const registerPassword = document.getElementById('register-password');
  const registerError = document.getElementById('register-error');

  if (registerSubmit) {
    registerSubmit.addEventListener('click', async () => {
      registerError.textContent = '';
      console.log('Register bouton cliqué !');


      // 🔒 Vérification champs vides
if (
  !registerPseudo.value.trim() ||
  !registerEmail.value.trim() ||
  !registerPassword.value.trim()
) {
  registerError.textContent = "Veuillez remplir tous les champs.";
  registerError.classList.add("show");
  return;
}

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: registerEmail.value,
          password: registerPassword.value,
          options: { data: { pseudo: registerPseudo.value } }
        });

        if (authError) {

  if (authError.message.includes("User already registered")) {
    registerError.textContent = "Cet email est déjà utilisé.";
  } else if (authError.message.includes("Password should be")) {
    registerError.textContent = "Mot de passe trop faible (min 6 caractères).";
  } else if (authError.message.includes("Invalid email")) {
    registerError.textContent = "Email invalide.";
  } else {
    registerError.textContent = "Erreur lors de l'inscription.";
  }

  registerError.classList.add("show");
  return;
}

        window.location.href = 'index.html';

      } catch (err) {
        registerError.textContent = err.message;
        console.error(err);
      }
    });
  }

  // ================= TOGGLE MOT DE PASSE =================
  function setupPasswordToggle(inputId, toggleId, eyeOpenId, eyeClosedId) {
    const passwordInput = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    const eyeOpen = document.getElementById(eyeOpenId);
    const eyeClosed = document.getElementById(eyeClosedId);

    if (!passwordInput || !toggle) return;

    toggle.addEventListener('click', () => {
      const visible = passwordInput.type === 'text';
      passwordInput.type = visible ? 'password' : 'text';
      eyeOpen.classList.toggle('hidden', !visible);
      eyeClosed.classList.toggle('hidden', visible);
    });
  }

  setupPasswordToggle('login-password', 'toggle-login-password', 'eye-open-login', 'eye-closed-login');
  setupPasswordToggle('register-password', 'toggle-register-password', 'eye-open-register', 'eye-closed-register');

});
