document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Application chargée avec succès !");
  initializeApp();
});

// ============================================
// INITIALISATION
// ============================================
// ℹ️ interpreterQuestion est définie dans ai.js
//    (chargé avant app.js dans le HTML)

function initializeApp() {
  console.log("🚀 Initialisation du chatbot...");

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================
  chargerDonneesEtudiants().then(data => {
    if (data) {
      addBotMessage(`Données chargées ! Je connais ${data.etudiants.length} étudiants de ${data.etablissement} ! 🎓`);
    } else {
      addBotMessage("⚠️ Impossible de charger les données. Certaines fonctionnalités seront limitées.");
    }
  });

  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const chatContainer = document.getElementById("chat-container");
  const modeButtons = document.querySelectorAll(".mode-btn");

  let currentMode = "naturel";

  // ============================================
  // GESTION DU THÈME CLAIR/SOMBRE
  // ============================================
  const themeToggle = document.getElementById("theme-toggle");
  const sunIcon = themeToggle.querySelector(".sun");
  const moonIcon = themeToggle.querySelector(".moon");

  // Appliquer le thème sauvegardé au chargement
  const savedTheme = localStorage.getItem("chatbot-theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    if (sunIcon) sunIcon.style.display = "none";
    if (moonIcon) moonIcon.style.display = "inline";
  } else {
    if (sunIcon) sunIcon.style.display = "inline";
    if (moonIcon) moonIcon.style.display = "none";
  }

  // Événement de clic (une seule fois)
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const isLightNow = document.body.classList.toggle("light-theme");

      const newTheme = isLightNow ? "light" : "dark";
      localStorage.setItem("chatbot-theme", newTheme);

      if (isLightNow) {
        if (sunIcon) sunIcon.style.display = "none";
        if (moonIcon) moonIcon.style.display = "inline";
      } else {
        if (sunIcon) sunIcon.style.display = "inline";
        if (moonIcon) moonIcon.style.display = "none";
      }

      console.log(`🎨 Thème changé : ${newTheme}`);
    });
  }

  // ============================================
  // GESTION DES MODES
  // ============================================
  modeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      modeButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      currentMode = this.getAttribute("data-mode");
      console.log(`Mode changé : ${currentMode}`);
      addBotMessage(`Mode ${currentMode} activé ! 😎`);
    });
  });

  // ============================================
  // ÉVÉNEMENTS D'ENVOI
  // ============================================
  sendBtn.addEventListener("click", function () {
    sendMessage();
  });

  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
  });

  // ============================================
  // ENVOI DU MESSAGE
  // ============================================
  function sendMessage() {
    const message = userInput.value.trim();

    if (message === '') {
      userInput.classList.add('shake');
      setTimeout(() => userInput.classList.remove('shake'), 500);
      return;
    }

    console.log(`📤 Message: "${message}" en mode ${currentMode}`);

    sendBtn.classList.add('sending');
    setTimeout(() => sendBtn.classList.remove('sending'), 500);

    addUserMessage(message);
    userInput.value = '';

    showTypingIndicator();

    generateResponse(message, currentMode).then(response => {
      hideTypingIndicator();
      addBotMessage(response);
    }).catch(error => {
      hideTypingIndicator();
      addBotMessage("Oups, une erreur s'est produite ! 😅");
      console.error('Erreur:', error);
    });
  }

  // ============================================
  // TYPING INDICATOR
  // ============================================
  function showTypingIndicator() {
    if (document.getElementById('typing-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'message bot-message typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    `;
    chatContainer.appendChild(indicator);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  // ============================================
  // AFFICHAGE DES MESSAGES
  // ============================================
  function addUserMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message user-message";
    messageDiv.innerHTML = `
      <div class="message-avatar">👤</div>
      <div class="message-content"><p>${escapeHtml(text)}</p></div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  function addBotMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message bot-message";
    messageDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content"><p>${escapeHtml(text)}</p></div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();

    console.log("Nombre de messages:", document.querySelectorAll(".message").length);
  }

  // ============================================
  // GÉNÉRATION DE RÉPONSES
  // ============================================
  async function generateResponse(userMessage, mode) {
    if (!donneesChargees()) {
      return "Les données ne sont pas encore chargées. Patiente... 🔄";
    }

    const intent = interpreterQuestion(userMessage);

    if (intent.type === 'statistiques') {
      const stats = studentsData.stats;
      return `📊 Statistiques :\n\n` +
        `👥 Total : ${stats.totalEtudiants} étudiants\n` +
        `🎓 Filières : ${stats.filieres.length}\n` +
        `📦 Projets : ${stats.totalProjets}\n` +
        `☕ Cafés/jour : ${stats.totalCafes}`;
    }

    if (intent.type === 'liste') {
      const liste = studentsData.etudiants
        .map(e => `• ${e.prenom} ${e.nom} (${e.filiere})`)
        .join('\n');
      return `📋 Liste des étudiants :\n\n${liste}`;
    }

    try {
    return await genererReponseAvecCache(userMessage, mode);
    } catch (error) {
      return generateTemporaryResponseFallback(userMessage, mode, intent);
    }
  }

  // ============================================
  // FALLBACK SANS IA
  // ============================================
  function generateTemporaryResponseFallback(userMessage, mode, intent) {
    const msg = userMessage.toLowerCase();

    if (msg.includes('salut') || msg.includes('bonjour')) {
      return mode === 'roast'
        ? "Tiens, regarde qui arrive ! 🔥"
        : "Salut ! Que veux-tu savoir ? 😊";
    }

    if (intent.type === 'presentation' && intent.nom) {
      const etudiants = rechercherEtudiant(intent.nom);
      if (etudiants.length > 0) {
        return presenterEtudiant(etudiants[0], mode);
      }
      return `Je ne connais pas ${intent.nom} 🤔`;
    }

    return "Hmm, je n'ai pas bien compris. Reformule ta question ! 🤔";
  }

  // ============================================
  // UTILITAIRES
  // ============================================
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

console.log(`
╔═══════════════════════════════════════╗
║   🤖 CHATBOT ÉTUDIANT - MODULE 1     ║
║   Développé pour apprendre Git,      ║
║   HTML, CSS et JavaScript !          ║
╚═══════════════════════════════════════╝
`);
console.log("💡 Astuce : Ouvre la console (F12) pour voir les logs de débogage !");