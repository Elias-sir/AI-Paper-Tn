document.addEventListener('DOMContentLoaded', () => {
    const notifBtn = document.getElementById('notif-btn');
    const notifBadge = document.getElementById('notif-badge');
    if (!notifBtn || !notifBadge) return;

    // clic sur la cloche
    notifBtn.addEventListener('click', () => {
        // juste animation "pulse" pour le fun
        notifBadge.classList.add('pulse');

        // enlever l'animation après 0.5s pour pouvoir la relancer
        setTimeout(() => {
            notifBadge.classList.remove('pulse');
        }, 500);

        // redirection vers la messagerie
        window.location.href = 'messagerie.html';
    });

    console.log("✅ Cloche initialisée pour animation et redirection.");
});
