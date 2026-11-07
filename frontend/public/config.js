// Configuration d'exécution du frontend, lue par src/utils/runtimeConfig.ts avant l'affichage.
//
// En développement (npm run dev), ce fichier est servi tel quel : URL de médias relatives.
// Dans l'image Docker, il est RÉÉCRIT à chaque démarrage du conteneur à partir des variables
// MEDIA_BASE_URL et MEDIA_OPTIMIZER_ENABLED (docker/40-runtime-config.sh). Changer une variable
// de la stack puis redémarrer le conteneur suffit : aucune image n'est à reconstruire.
window.__AMAME_CONFIG__ = { mediaBaseUrl: "", mediaOptimizerEnabled: false };
