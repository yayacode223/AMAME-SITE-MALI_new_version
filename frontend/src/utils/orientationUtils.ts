// orientationUtils.ts
import { 
  DomaineFiliereType, 
  DifficulteType, 
  DemandeType, 
  SalaireType,
  FiliereSummaryResponse,
  FiliereDetailResponse
} from "@/types/orientationType";

// Mapper les domaines pour l'UI
export const mapDomaineToUI = (domaine: DomaineFiliereType): { id: string; label: string } => {
  const mapping = {
    [DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES]: { id: "sciences", label: "Sciences & Technologies" },
    [DomaineFiliereType.SCIENCES_DE_LA_SANTE]: { id: "sante", label: "Santé" },
    [DomaineFiliereType.SCIENCES_ECONOMIQUES_ET_GESTION]: { id: "economie", label: "Économie & Gestion" },
    [DomaineFiliereType.DROIT_ET_SCIENCES_POLITIQUES]: { id: "droit", label: "Droit & Sciences Politiques" },
    [DomaineFiliereType.LETTRES_ET_SCIENCES_HUMAINES]: { id: "lettres", label: "Lettres & Sciences Humaines" },
    [DomaineFiliereType.ARTS_ET_COMMUNICATION]: { id: "arts", label: "Arts & Communication" }
  };
  
  return mapping[domaine] || { id: domaine.toLowerCase(), label: domaine };
};

// Mapper la difficulté pour l'UI
export const mapDifficulteToUI = (difficulte: DifficulteType): string => {
  const mapping = {
    [DifficulteType.TRES_ELEVEE]: "Très élevée",
    [DifficulteType.ELEVEE]: "Élevée",
    [DifficulteType.MOYENNE]: "Moyenne",
    [DifficulteType.VARIABLE]: "Variable"
  };
  
  return mapping[difficulte] || difficulte;
};

// Mapper la demande pour l'UI
export const mapDemandeToUI = (demande: DemandeType): string => {
  const mapping = {
    [DemandeType.TRES_FORTE]: "Très forte",
    [DemandeType.FORTE]: "Forte",
    [DemandeType.MOYENNE]: "Moyenne",
    [DemandeType.CROISSANTE]: "Croissante",
    [DemandeType.VARIABLE]: "Variable"
  };
  
  return mapping[demande] || demande;
};

// Mapper le salaire pour l'UI
export const mapSalaireToUI = (salaire: SalaireType): string => {
  const mapping = {
    [SalaireType.TRES_ELEVE]: "Très élevé",
    [SalaireType.ELEVE]: "Élevé",
    [SalaireType.MOYEN_ELEVE]: "Moyen à élevé",
    [SalaireType.MOYEN]: "Moyen",
    [SalaireType.VARIABLE]: "Variable"
  };
  
  return mapping[salaire] || salaire;
};

// Adapter les données pour la page d'orientation
export const adaptFiliereForOrientation = (filiere: FiliereSummaryResponse) => ({
  id: filiere.id,
  titre: filiere.nom,
  description: filiere.descriptionCourte,
  debouches: filiere.debouches,
  domaine: mapDomaineToUI(filiere.domaine).id,
  duree: filiere.dureeEtudes,
  difficulte: mapDifficulteToUI(filiere.difficulte),
  demande: mapDemandeToUI(filiere.demande),
  salaire: mapSalaireToUI(filiere.salaire),
  competences: [], // Rempli dans le détail
  universites: [] // Rempli dans le détail
});

// Adapter les données pour la page de détail
export const adaptFiliereForDetail = (filiere: FiliereDetailResponse) => ({
  id: filiere.id,
  titre: filiere.nom,
  description: filiere.descriptionCourte,
  descriptionLongue: filiere.descriptionLongue,
  debouches: filiere.debouches,
  domaine: mapDomaineToUI(filiere.domaine).id,
  duree: filiere.dureeEtudes,
  difficulte: mapDifficulteToUI(filiere.difficulte),
  demande: mapDemandeToUI(filiere.demande),
  salaire: mapSalaireToUI(filiere.salaire),
  competences: filiere.competences,
  universites: filiere.universites,
  prerequis: filiere.prerequis,
  tauxEmploi: filiere.tauxEmploi,
  salaireDebut: filiere.salaireDebut,
  salaireExperience: filiere.salaireExperience,
  perspectives: filiere.perspectives
});