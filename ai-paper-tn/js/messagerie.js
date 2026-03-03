import { supabase } from './supabase.js';
import * as Notifs from './notifications.js';

// ================= MAPPING ADMIN =================
// Ce tableau contient les 3 admins avec leurs emails et leurs user_id Supabase
// Remplace 'ID_ADMIN_1' par l'id réel dans ta table 'users' pour chaque admin
// ================= MAPPING ADMIN =================
const admins = [
  {
    email: 'super_adminaipaper.visionon.world@gmail.com',
    id: 'b29e4c0f-bf46-470d-9df1-d13d89fd9d63',
    pseudo: 'Admin 1',
    avatar: 'https://ilbfvzihnmamxusdqizd.supabase.co/storage/v1/object/public/avatars/avatar_b29e4c0f-bf46-470d-9df1-d13d89fd9d63.JPG'
  },
  {
    email: 'super_adminaipaper.visionon.world2@gmail.com',
    id: 'dcc6fd76-1994-45fd-a2d5-a90e5de09acd',
    pseudo: 'Admin 2',
    avatar: 'https://ilbfvzihnmamxusdqizd.supabase.co/storage/v1/object/public/avatars/avatar_b29e4c0f-bf46-470d-9df1-d13d89fd9d63.JPG'
  },
  {
    email: 'super_adminaipaper.visionon.world3@gmail.com',
    id: '1ddc495b-7598-4482-8695-c4c5a29ef1e5',
    pseudo: 'Admin 3',
    avatar: 'https://ilbfvzihnmamxusdqizd.supabase.co/storage/v1/object/public/avatars/avatar_b29e4c0f-bf46-470d-9df1-d13d89fd9d63.JPG'
  },
];



const conversationList = document.getElementById('conversation-list');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatUser = document.getElementById('chat-user');

let currentUser = null;
let currentConversation = null;
let chatChannel = null;



// ================= INIT AUTH =================
const initAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) window.location.href = 'login.html';
    else currentUser = data.user;
};

// ================= LOAD CONVERSATIONS =================
const loadConversations = async () => {
    if (!currentUser) return;

    // Détecter si l'utilisateur est admin
    const isAdmin = currentUser.email.includes('super_adminaipaper');

    if (isAdmin) {
        // ADMIN : afficher les users qui ont écrit
        const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
  *,
  user:user_id (id, pseudo, avatar),
  messages_v2(id, seen, sender_id)
`)
    .eq('admin_id', currentUser.id)
    .order('last_message_at', { ascending: false });

if (error) return console.error(error);

conversationList.innerHTML = '';

for (const conv of conversations) {
    // fallback si user n'existe pas
    const user = conv.user || { pseudo: "Utilisateur", avatar: "assents/icons/default-profile.png" };

    const div = document.createElement('div');
    div.className = 'conversation';
    div.dataset.convId = conv.id;

    div.innerHTML = `
        <img src="${user.avatar}" class="conv-avatar" alt="Avatar de ${user.pseudo}" />
        <span>${user.pseudo}</span>
    `;

    // calcul des non lus
const unreadMessages = conv.messages_v2?.filter(m =>
  !m.seen && m.sender_id !== currentUser.id
).length || 0;

if (unreadMessages > 0) {
  div.classList.add('has-unread');
}

    // ✅ Nouvelle partie : vérifier si il y a des notifications non lues
    const { data: unreadNotifications, error: notifError } = await supabase
  .from('notifications')
  .select('id')
  .eq('conversation_id', conv.id)
  .eq('seen', false);

if (!notifError && unreadNotifications.length > 0) {
  div.classList.add('pulse');
} else {
  div.classList.remove('pulse');
}

    
    div.onclick = () => openConversation(conv);
    conversationList.appendChild(div);
}


    } else {
        // USER : garder les 3 admins statiques et lier le clic
        document.querySelectorAll('#conversation-list .conversation').forEach(div => {
            div.addEventListener('click', async () => {
                const adminEmail = div.dataset.adminEmail;
                await getOrCreateConversationWithAdmin(adminEmail);
            });
        });
    }
};

// ================= GET OR CREATE CONVERSATION WITH SPECIFIC ADMIN =================
const getOrCreateConversationWithAdmin = async (adminEmail) => {
    if (!currentUser) return;

    // 1️⃣ Récupérer l'utilisateur correspondant à l'adminEmail
    // 1️⃣ Récupérer l'admin depuis le tableau admins
const admin = admins.find(a => a.email === adminEmail);
if (!admin) return alert("Admin non trouvé !");
const adminId = admin.id;


    // 2️⃣ Vérifier si conversation existe
    const { data: existing, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('admin_id', adminId)
        .eq('status', 'open')
        .maybeSingle();

    if (convError) return console.error(convError);

    if (existing) return openConversation(existing);

    // 3️⃣ Créer nouvelle conversation
    const { data: newConv, error: newError } = await supabase
        .from('conversations')
        .insert({ user_id: currentUser.id, admin_id: adminId, status: 'open' })
        .select()
        .maybeSingle();

    if (newError) return console.error(newError);

    openConversation(newConv);
};


// ================= OPEN CONVERSATION =================
const openConversation = async (conversation) => {
    currentConversation = conversation;

    // enlever badge visuel
const activeDiv = document.querySelector(`[data-conv-id="${conversation.id}"]`);
if (activeDiv) activeDiv.classList.remove('has-unread');


window.currentConversation = conversation; // pour notifications.js
    chatMessages.innerHTML = '';
    chatForm.classList.remove('hidden');

    // afficher pseudo de l'autre
    let otherPerson = conversation.user_id === currentUser.id ? conversation.admin : conversation.user;
    chatUser.textContent = otherPerson?.pseudo || 'Chat';

    // charger les messages
    const { data: messages, error } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at');



        // marquer messages reçus comme vus
await supabase
  .from('messages_v2')
  .update({ 
    seen: true, 
    read_at: new Date().toISOString() 
  })
  .eq('conversation_id', conversation.id)
  .neq('sender_id', currentUser.id)
  .eq('seen', false);


    if (!error && messages) messages.forEach(renderMessage);


    // ⚡ Marquer notifications de cette conversation comme vues
await supabase
    .from('notifications')
    .update({ seen: true })
    .eq('user_id', currentUser.id)
    .eq('conversation_id', conversation.id);

await Notifs.refreshNotifications();


    // s'abonner au chat realtime
    subscribeChatRealtime();
};

// ================= SEND MESSAGE =================
chatForm.addEventListener('submit', async e => {
    e.preventDefault();
    const content = chatInput.value.trim();
    if (!content || !currentConversation) return;

    renderMessage({ content, sender_id: currentUser.id });
    chatInput.value = '';

   const { error } = await supabase.from('messages_v2').insert({
    conversation_id: currentConversation.id,
    sender_id: currentUser.id,
    sender_role: currentUser.email.includes('super_adminaipaper') ? 'admin' : 'user',
    content
});

if (!error) {
    // Déterminer le destinataire
    let receiverId =
        currentUser.id === currentConversation.user_id
            ? currentConversation.admin_id
            : currentConversation.user_id;

    // Créer la notification immédiatement
    await Notifs.newMessageNotification(
        receiverId,
        content,
        currentConversation.id
    );
}
});

// ================= RENDER MESSAGE =================
function renderMessage(msg) {
    const div = document.createElement('div');
    div.classList.add(msg.sender_id === currentUser.id ? 'user' : 'admin');

    // format date
    let date = "";
    if (msg.created_at) {
        const d = new Date(msg.created_at);
        date = d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

  const isMine = msg.sender_id === currentUser.id;

let status = "";
if (isMine) {
    status = msg.seen ? "Lu" : "Envoyé";
}

div.innerHTML = `
    <div class="msg-content">${msg.content}</div>
    <div class="msg-time">
        ${date}
        ${isMine ? `<span class="msg-status">${status}</span>` : ""}
    </div>
`;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ================= REALTIME CHAT =================
const subscribeChatRealtime = () => {
    if (!currentConversation) return;

    // Supprimer ancien canal si existe
    if (chatChannel) supabase.removeChannel(chatChannel);

    chatChannel = supabase
    .channel(`chat-${currentConversation.id}`)
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'messages_v2',
            filter: `conversation_id=eq.${currentConversation.id}`
        },


   payload => {
    const msg = payload.new;

    // ⛔️ Ne pas afficher le message si c’est moi qui l’ai envoyé
    if (msg.sender_id !== currentUser.id) {
        renderMessage(msg);
    }
}
    )
    .subscribe();
};

//================= BURGER MENU ==============
const burgerBtn = document.getElementById('burger-btn');
const sidebar = document.querySelector('.sidebar');

burgerBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

conversationList.addEventListener('click', () => {
  if (window.innerWidth <= 768) sidebar.classList.remove('open');
});






// ================= INIT =================
// ✅ Après initAuth()
await initAuth();

// ✅ Charger les conversations
await loadConversations();

// ✅ Initialiser notifications et realtime
await Notifs.initNotifications();
await Notifs.subscribeNotificationsRealtime();

// ✅ Initialiser chat realtime pour chaque conversation ouverte
if (currentConversation) subscribeChatRealtime();
