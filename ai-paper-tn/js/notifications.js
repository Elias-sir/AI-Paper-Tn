import { supabase } from './supabase.js';


let badgeEl = document.getElementById('notif-badge');
let unreadCount = 0;


export function bindBadgeToElement(newBadgeId) {
    badgeEl = document.getElementById(newBadgeId);
    updateBadge(); // met à jour le badge tout de suite
}

export async function initNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Charger les notifs non vues
    const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('seen', false);

    if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
    }

    unreadCount = data.length;
    updateBadge();
}



// Incrémenter le badge
export function incrementNotification() {
    unreadCount++;
    updateBadge();
}

// Réinitialiser le badge
export function resetNotification() {
    unreadCount = 0;
    updateBadge();
}

// Mettre à jour l’affichage
function updateBadge() {
    if (!badgeEl) return; // ⚠️ ajout de la sécurité

    if (unreadCount > 0) {
        badgeEl.textContent = unreadCount;
        badgeEl.classList.add('pulse');
    } else {
        badgeEl.textContent = '';
        badgeEl.classList.remove('pulse');
    }
}



document.getElementById('notif-btn').addEventListener('click', async () => {
    // 1️⃣ Reset le badge
    resetNotification();

    // 2️⃣ Ouvrir le sidebar si tu en as un
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebar.classList.contains('open')) {
        sidebar.classList.add('open');
    }

    // 3️⃣ Charger la première conversation ou ouvrir la messagerie
    const firstConv = document.querySelector('.conversation');
    if (firstConv) firstConv.click(); // simule un clic sur la première conversation

    // 4️⃣ Scroll vers le chat
    const chatArea = document.querySelector('.chat-area');
    if (chatArea) chatArea.scrollIntoView({ behavior: 'smooth' });
});






export function newMessageNotification(userId, content, conversationId) {
    addNotification(userId, 'message', content, conversationId);
}

export function newAiNotification(userId, content) {
    addNotification(userId, 'new_ai', content);
}

export function updateAiNotification(userId, content) {
    addNotification(userId, 'update_ai', content);
}

export function partnerPostNotification(userId, content) {
    addNotification(userId, 'partner_post', content);
}

export function systemUpdateNotification(userId, content) {
    addNotification(userId, 'system_update', content);
}

// fonction centrale qui crée la notif et incrémente le badge
async function addNotification(userId, type, content, conversationId = null) {

     console.log("🔥 addNotification appelée", userId, type);
    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            content: content,
            type: type,
            seen: false,
            conversation_id: conversationId
        });

    if (error) {
        console.error('Erreur création notification:', error);
        return;
    }
    

}


export async function refreshNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('seen', false);

    if (error) return;

    unreadCount = data.length;
    updateBadge();
}


// 🔥 Realtime notifications
export async function subscribeNotificationsRealtime() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Supprimer ancien channel si nécessaire
    if (window.notifChannel) supabase.removeChannel(window.notifChannel);

    // Créer channel pour l'utilisateur
    window.notifChannel = supabase
        .channel(`notifications-user-${user.id}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            },
            payload => {
                console.log("🔥 Nouvelle notification reçue :", payload.new);
                
                unreadCount++;
                updateBadge();
            }
        )
        .subscribe();
}