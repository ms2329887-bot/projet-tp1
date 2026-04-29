/* =================================================================
   MODULE 3 : GESTION DES DONNÉES
   Fichier: js/data.js
   
   Ce fichier gère le chargement et la manipulation des données
   des étudiants.
   ================================================================= */

// Variable globale pour stocker les données
let studentsData = null;

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

/**
 * Charge les données des étudiants depuis le fichier JSON
 * @returns {Promise<Object>} Les données chargées ou null si erreur
 */
async function chargerDonneesEtudiants() {
    try {
        console.log('📥 Chargement des données étudiants...');
        
        const response = await fetch('data/students.json');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validation basique
        if (!data.etudiants || !Array.isArray(data.etudiants)) {
            throw new Error('Format de données invalide');
        }
        
        studentsData = data;
        console.log(`✅ ${data.etudiants.length} étudiants chargés`);
        
        return data;
        
    } catch (error) {
        console.error('❌ Erreur de chargement:', error);
        return null;
    }
}
   /**
 * Vérifie si les données sont chargées
 * @returns {boolean}
 */
function donneesChargees() {
    return studentsData !== null && studentsData.etudiants.length > 0;
}
// ============================================
// FONCTIONS DE RECHERCHE
// ============================================

/**
 * Recherche un étudiant par son nom ou prénom
 * @param {string} nom - Nom ou prénom à rechercher
 * @returns {Array} Liste des étudiants correspondants
 */
function rechercherEtudiant(nom) {
    if (!donneesChargees()) {
        console.error('Données non chargées');
        return [];
    }
    
    const nomLower = nom.toLowerCase().trim();
    
    return studentsData.etudiants.filter(etudiant => {
        const prenomMatch = etudiant.prenom.toLowerCase().includes(nomLower);
        const nomMatch = etudiant.nom.toLowerCase().includes(nomLower);
        const nomComplet = `${etudiant.prenom} ${etudiant.nom}`.toLowerCase();
        const nomCompletInverse = `${etudiant.nom} ${etudiant.prenom}`.toLowerCase();
        
        return prenomMatch || nomMatch || 
               nomComplet.includes(nomLower) || 
               nomCompletInverse.includes(nomLower);
    });
}

/**
 * Trouve un étudiant par son ID
 * @param {number} id - ID de l'étudiant
 * @returns {Object|null} L'étudiant trouvé ou null
 */
function trouverParId(id) {
    if (!donneesChargees()) return null;
    return studentsData.etudiants.find(e => e.id === id);
}

/**
 * Filtre les étudiants par filière
 * @param {string} filiere - Nom de la filière
 * @returns {Array} Liste des étudiants de cette filière
 */
function filtrerParFiliere(filiere) {
    if (!donneesChargees()) return [];
    
    const filiereLower = filiere.toLowerCase();
    return studentsData.etudiants.filter(e => 
        e.filiere.toLowerCase().includes(filiereLower)
    );
}

/**
 * Trouve les étudiants qui ont un intérêt spécifique
 * @param {string} interet - L'intérêt recherché
 * @returns {Array} Liste des étudiants
 */
function filtrerParInteret(interet) {
    if (!donneesChargees()) return [];
    
    const interetLower = interet.toLowerCase();
    return studentsData.etudiants.filter(e =>
        e.interets.some(i => i.toLowerCase().includes(interetLower))
    );
}

/**
 * Obtient un fun fact aléatoire d'un étudiant
 * @param {Object} etudiant - L'étudiant
 * @returns {string} Un fun fact aléatoire
 */
function funFactAleatoire(etudiant) {
    if (!etudiant || !etudiant.funFacts || etudiant.funFacts.length === 0) {
        return "Pas de fun fact disponible";
    }
    const index = Math.floor(Math.random() * etudiant.funFacts.length);
    return etudiant.funFacts[index];
}