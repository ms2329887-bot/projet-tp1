document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Application chargée avec succès !');
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initialisation du chatbot...');

    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatContainer = document.getElementById('chat-container');
    const modeButtons = document.querySelectorAll('.mode-btn');

    let currentMode = 'naturel';

    // Gestion des modes
    modeButtons.forEach(button => {
        button.addEventListener('click', function () {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.getAttribute('data-mode');
            console.log(`Mode changé : ${currentMode}`);
            addBotMessage(`Mode ${currentMode} activé ! 😎`);
        });
    });

    // Événements d'envoi
    sendBtn.addEventListener('click', function () {
        sendMessage();
    });

    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    // ✅ Une seule déclaration de sendMessage()
    function sendMessage() {
        const message = userInput.value.trim();

        if (message === '') {
            console.log('⚠️ Message vide, rien à envoyer');
            return;
        }

        console.log(`📤 Envoi du message : "${message}"`);
        console.log('Mode actuel:', currentMode);
        console.log('Nombre de messages:', chatContainer.children.length);

        addUserMessage(message);
        userInput.value = '';

        setTimeout(() => {
            const response = generateTemporaryResponse(message, currentMode);
            addBotMessage(response);
        }, 1000);
    }

    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content"><p>${escapeHtml(text)}</p></div>
        `;
        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content"><p>${escapeHtml(text)}</p></div>
        `;
        chatContainer.appendChild(messageDiv);
        scrollToBottom();

        // ✅ Log déplacé ici, dans un contexte valide
        console.log('Nombre de messages:', document.querySelectorAll('.message').length);
    }

    function generateTemporaryResponse(userMessage, mode) {
        // ✅ msg est bien déclaré ici
        const msg = userMessage.toLowerCase();

        const responses = {
            naturel: [
                "Hmm, intéressante question ! Pour l'instant je suis en mode apprentissage. 😊",
                "Je note ça ! Bientôt je pourrai te répondre avec l'IA. 🤖",
                "Super question ! J'apprends encore comment y répondre. 📚"
            ],
            roast: [
                "Oh là là, cette question... 🔥 Donne-moi le temps de préparer une réponse qui arrache !",
                "Tu veux vraiment que je roast avec ça ? Attends le Module 4, ça va chauffer ! 😈",
                "Pas mal comme question, mais j'ai besoin de mon cerveau IA d'abord ! 💀"
            ],
            sympathique: [
                "Quelle belle question ! 💖 Je suis impatient d'y répondre quand j'aurai mon IA !",
                "Tu es trop gentil(le) de me poser cette question ! 🥰 Bientôt je pourrai t'aider !",
                "Aww, j'aimerais tellement pouvoir répondre ! 💕 Patience, ça arrive !"
            ],
            philosophique: [
                "Hmm... La connaissance est-elle vraiment accessible ? 🤔",
                "Comme disait Socrate : 'Je sais que je ne sais rien'... 📚",
                "Mais qu'est-ce qu'une question, sinon une quête de sens ? 🧘"
            ]
        };

        if (msg.includes('salut') || msg.includes('bonjour') || msg.includes('hello')) {
            return mode === 'roast'
                ? "Salut toi ! Prêt(e) à te faire roast ? 🔥"
                : mode === 'sympathique'
                ? "Coucou ! 💖 Quel plaisir de te parler !"
                : "Salut ! Comment puis-je t'aider ? 😊";
        }

        if (msg.includes('merci') || msg.includes('thanks')) {
            return mode === 'roast'
                ? "Ouais ouais, de rien... 😏"
                : mode === 'sympathique'
                ? "Avec grand plaisir ! Tu es adorable ! 🥰"
                : "De rien, ravi d'aider ! 😊";
        }

        if (msg.includes('qui es-tu') || msg.includes('qui es tu')) {
            return `Je suis un chatbot en mode ${mode} ! 🤖 En cours de développement dans le Module 1.`;
        }

        const modeResponses = responses[mode] || responses.naturel;
        return modeResponses[Math.floor(Math.random() * modeResponses.length)];
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(indicator);
        setTimeout(() => indicator.remove(), 2000);
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ✅ theme-toggle à l'intérieur, après que le DOM est prêt
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });
}

console.log(`
╔═══════════════════════════════════════╗
║   🤖 CHATBOT ÉTUDIANT - MODULE 1     ║
║   Développé pour apprendre Git,      ║
║   HTML, CSS et JavaScript !          ║
╚═══════════════════════════════════════╝
`);
console.log('💡 Astuce : Ouvre la console (F12) pour voir les logs de débogage !');