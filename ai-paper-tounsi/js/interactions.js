// likes, approvals, micro-anim

// van compte 
const aiCountEl = document.querySelector('.ai-count');

let currentCount = 1;
aiCountEl.textContent = currentCount.toLocaleString();

function aiFreeFallCount() {
  const isOverdrive = Math.random() < 0.35; // souvent rapide

  let increment;
  let delay;

  if (isOverdrive) {
    // chute libre
    increment = Math.floor(Math.random() * 60) + 25; // gros bonds
    delay = Math.random() * 60 + 30; // ultra rapide
    aiCountEl.classList.add('fast');
  } else {
    // respiration très courte
    increment = Math.floor(Math.random() * 12) + 4;
    delay = Math.random() * 220 + 120;
    aiCountEl.classList.remove('fast');
  }

  currentCount += increment;
  aiCountEl.textContent = currentCount.toLocaleString();

  setTimeout(aiFreeFallCount, delay);
}

aiFreeFallCount();

// fleche decouvrir dans hero 
document.querySelector(".hero-scroll")?.addEventListener("click", () => {
  document.querySelector("#feed-cards")?.scrollIntoView({
    behavior: "smooth"
  });
});

// notres des utilisateur des ai dans hero 
const target = 1000000; 
let current = 0;
const el = document.getElementById("tn-ai-count");

if (el) {
  const step = () => {
    current += Math.ceil((target - current) / 12);
    el.textContent = current.toLocaleString();
    if (current < target) requestAnimationFrame(step);
  };
  step();
}


// responsive 
const burger = document.getElementById("nav-burger");
const navRight = document.getElementById("nav-right");

burger.addEventListener("click", () => {
  navRight.classList.toggle("open");
});

navRight.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navRight.classList.remove("open");
  });
});





