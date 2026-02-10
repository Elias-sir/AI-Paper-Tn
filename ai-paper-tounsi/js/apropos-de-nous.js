// Un petit JS pour scroll reveal simple
const cards = document.querySelectorAll('.card');

function reveal() {
  for (let card of cards) {
    const windowHeight = window.innerHeight;
    const cardTop = card.getBoundingClientRect().top;
    const revealPoint = 150;

    if(cardTop < windowHeight - revealPoint) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  }
}

window.addEventListener('scroll', reveal);

// Au chargement
reveal();
