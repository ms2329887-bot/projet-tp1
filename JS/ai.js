/* =================================================================
   MODULE 4 : INTÉGRATION IA
   Fichier: js/ai.js
   ================================================================= */

// ============================================
// 1. CONFIGURATION
// ============================================

if (typeof API_CONFIG === 'undefined') {
    console.error('❌ config.js non chargé !');
}

const AI_CONFIG = {
    maxTokens: 300,
    temperature: 0.7,
    timeout: 30000
};

// ============================================
// 2. APPEL API GROQ
// ============================================

/**
 * Appelle l'API Groq
 * @param {string} systemPrompt - Instructions système
 * @param {string} userMessage  - Message de l'utilisateur
 * @returns {Promise<string>} La réponse générée
 */
async function appelGroq(systemPrompt, userMessage) {
    const { apiKey, model } = API_CONFIG.groq;

    if (!apiKey || apiKey.includes('COLLEZ')) {
        throw new Error('Clé API Groq non configurée !');
    }

    try {
        console.log('📤 Envoi à Groq...');

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userMessage  }
                ],
                max_tokens: AI_CONFIG.maxTokens,
                temperature: AI_CONFIG.temperature,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur API Groq:', errorText);
            throw new Error(`Erreur ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('📥 Réponse Groq reçue:', data);

        return data.choices?.[0]?.message?.content || 'Pas de réponse 🤔';

    } catch (error) {
        console.error('❌ Erreur Groq:', error);
        throw error;
    }
}

// ============================================
// 3. NETTOYAGE DES RÉPONSES
// ============================================

/**
 * Nettoie la réponse de l'IA
 * @param {string} reponse - Réponse brute
 * @returns {string} Réponse nettoyée
 */
function nettoyerReponse(reponse) {
    let cleaned = reponse.trim();

    cleaned = cleaned.replace(/\[INST\]|\[\/INST\]|<s>|<\/s>/g, '');
    cleaned = cleaned.replace(/^(Tu es|You are).*?\n\n/s, '');

    const lines = cleaned.split('\n').filter(l => l.trim());
    if (lines.length > 5) {
        cleaned = lines.slice(0, 5).join('\n');
    }

    return cleaned.trim();
}

// ============================================
// 4. MESSAGE DE DEBUG
// ============================================

console.log(`
╔═══════════════════════════════════════╗
║     🤖 MODULE IA CHARGÉ              ║
║   Provider: ${API_CONFIG.provider}        ║
╚═══════════════════════════════════════╝
`);

// ============================================
// 5. GÉNÉRATION DE PROMPTS
// ============================================

/**
 * Génère le prompt système selon le mode
 * @param {string} mode - Le mode (naturel, roast, sympathique, philosophique)
 * @returns {string} Instructions système
 */
function genererPromptSysteme(mode) {
    const prompts = {
        naturel: `Tu es un assistant amical qui présente des étudiants d'une école d'informatique.
Sois informatif, concis et sympathique.
Utilise des emojis de manière modérée.
Limite ta réponse à 4-5 phrases maximum.`,

        roast: `Tu es un chatbot taquin qui fait du "roasting" gentil et drôle.
RÈGLES STRICTES :
- Sois drôle mais JAMAIS méchant
- Taquine sur les habitudes (café, procrastination, etc.)
- Reste bon enfant et respectueux
- Utilise des emojis : 🔥 😏 💀 😂
- Maximum 5 phrases courtes`,

        sympathique: `Tu es un chatbot ultra-positif et enthousiaste !
STYLE REQUIS :
- TRÈS positif et encourageant
- Beaucoup d'emojis mignons : 💖 ✨ 🥰 🌟 💕
- Complimente tout
- Exprime de l'admiration et de la joie
- Maximum 5 phrases`,

        philosophique: `Tu es un chatbot philosophe qui réfléchit profondément.
STYLE :
- Pose des questions existentielles
- Utilise des métaphores
- Ton contemplatif
- Emojis : 🤔 💭 🧘 ✨
- Maximum 5 phrases profondes`
    };

    return prompts[mode] || prompts.naturel;
}

/**
 * Génère le message utilisateur enrichi avec le contexte (RAG)
 * @param {string} question  - Question de l'utilisateur
 * @param {Object} contexte  - Données pertinentes
 * @param {string} mode      - Mode de réponse
 * @returns {string} Message enrichi
 */
function genererMessageUtilisateur(question, contexte, mode) {
    let msg = '';

    if (contexte) {
        msg += 'INFORMATIONS À UTILISER :\n';
        msg += JSON.stringify(contexte, null, 2);
        msg += '\n\n';
    }

    msg += `QUESTION : "${question}"\n`;
    msg += `Réponds en français, style ${mode}.`;

    return msg;
}

// ============================================
// 6. INTERPRÉTATION DES QUESTIONS
// ============================================

/**
 * Interprète l'intention de la question de l'utilisateur
 * ✅ Définie ici dans ai.js pour être disponible dès son chargement
 * @param {string} message - Message de l'utilisateur
 * @returns {Object} L'intention détectée { type, nom }
 */
function interpreterQuestion(message) {
    const msg = message.toLowerCase();

    if (msg.includes('statistique') || msg.includes('combien') || msg.includes('total')) {
        return { type: 'statistiques', nom: null };
    }

    if (msg.includes('liste') || msg.includes('tous les étudiants') || msg.includes('tout le monde')) {
        return { type: 'liste', nom: null };
    }

    const motsClés = ['qui est', 'présente', 'parle-moi de', "c'est qui", 'infos sur', 'info sur'];
    for (const mot of motsClés) {
        if (msg.includes(mot)) {
            const nom = msg.replace(mot, '').trim();
            return { type: 'presentation', nom };
        }
    }

    return { type: 'inconnu', nom: null };
}

// ============================================
// 7. RAG (RETRIEVAL AUGMENTED GENERATION)
// ============================================

/**
 * Récupère les informations pertinentes selon la question
 * @param {string} question - Question de l'utilisateur
 * @returns {Object} Contexte pertinent
 */
function recupererContexte(question) {
    if (!donneesChargees()) {
        return null;
    }

    const intent = interpreterQuestion(question);

    let contexte = {
        etablissement: studentsData.etablissement,
        totalEtudiants: studentsData.stats.totalEtudiants
    };

    if (intent.nom) {
        const etudiants = rechercherEtudiant(intent.nom);
        if (etudiants.length > 0) {
            contexte.etudiant = etudiants[0];
        }
    }

    if (question.toLowerCase().includes('événement') ||
        question.toLowerCase().includes('hackathon')) {
        contexte.dernierEvenement = dernierEvenement();
    }

    if (question.toLowerCase().includes('potin') ||
        question.toLowerCase().includes('gossip')) {
        contexte.potin = potinAleatoire();
    }

    if (intent.type === 'statistiques') {
        contexte.stats = calculerStatistiques();
    }

    return contexte;
}

/**
 * Génère une réponse avec IA (Groq) et RAG
 * @param {string} question - Question de l'utilisateur
 * @param {string} mode     - Mode de réponse
 * @returns {Promise<string>} Réponse générée
 */
async function genererReponseIA(question, mode = 'naturel') {
    try {
        // 1. Récupérer le contexte pertinent (RAG)
        const contexte = recupererContexte(question);

        // 2. Préparer les deux parties du prompt
        const systemPrompt  = genererPromptSysteme(mode);
        const userMessage   = genererMessageUtilisateur(question, contexte, mode);

        console.log('📝 System prompt:', systemPrompt.substring(0, 100) + '...');

        // 3. Appeler l'API Groq
        const reponseIA = await appelGroq(systemPrompt, userMessage);

        // 4. Nettoyer la réponse
        const reponseFinale = nettoyerReponse(reponseIA);

        console.log('✅ Réponse finale:', reponseFinale);

        return reponseFinale;

    } catch (error) {
        console.error('Erreur génération IA:', error);
        return "Oups ! 🤖 L'IA rencontre un petit problème. " +
               "Vérifie ta connexion ou réessaie dans un instant.";
    }
}
// ============================================
// 7. CACHE SIMPLE
// ============================================

const cacheIA = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Génère une réponse avec cache
 */
async function genererReponseAvecCache(question, mode) {
    const cacheKey = `${question}-${mode}`;
    const cached = cacheIA.get(cacheKey);
    
    // Vérifier le cache
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('✅ Réponse depuis le cache');
        return cached.response;
    }
    
    // Générer la réponse
    const response = await genererReponseIA(question, mode);
    
    // Mettre en cache
    cacheIA.set(cacheKey, {
        response,
        timestamp: Date.now()
    });
    
    return response;
}