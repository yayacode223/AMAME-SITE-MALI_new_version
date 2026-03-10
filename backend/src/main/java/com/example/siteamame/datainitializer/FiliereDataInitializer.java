//package com.example.siteamame.datainitializer;
//
//import com.example.siteamame.enumeration.DemandeType;
//import com.example.siteamame.enumeration.DifficulteType;
//import com.example.siteamame.enumeration.DomaineFiliereSerieType;
//import com.example.siteamame.enumeration.SalaireType;
//import com.example.siteamame.model.Filiere;
//import com.example.siteamame.repository.FiliereRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.stereotype.Component;
//
//import java.util.Arrays;
//
//@Component
//@RequiredArgsConstructor
//public class FiliereDataInitializer implements CommandLineRunner {
//
//    private final FiliereRepository filiereRepository;
//
//    @Override
//    public void run(String... args) throws Exception {
//        if (filiereRepository.count() == 0) {
//            // 1. Sciences et Technologies
//            Filiere sciences = new Filiere();
//            sciences.setNom("Sciences et Technologies");
//            sciences.setDescriptionCourte("Ingénierie, informatique, mathématiques, physique, chimie et sciences fondamentales");
//            sciences.setDescriptionLongue("Les Sciences et Technologies représentent un domaine d'étude vaste et dynamique qui forme les futurs innovateurs et leaders technologiques. Ce secteur combine théorie et pratique pour résoudre les défis complexes du monde moderne, allant du développement logiciel à l'ingénierie civile en passant par la recherche scientifique.");
////            sciences.getFile().setFilePath("💻");
//            sciences.setDomaine(DomaineFiliereSerieType.SCIENCES_ET_TECHNOLOGIES);
//            sciences.setDifficulte(DifficulteType.ELEVEE);
//            sciences.setDemande(DemandeType.TRES_FORTE);
//            sciences.setSalaire(SalaireType.ELEVE);
//            sciences.setDureeEtudes("3-5 ans");
//            sciences.setTauxEmploi("95%");
//            sciences.setSalaireDebut("45 000 - 65 000 €");
//            sciences.setSalaireExperience("80 000 - 120 000 €");
//            sciences.setPerspectives("Le secteur des technologies connaît une croissance exponentielle avec la digitalisation de l'économie. Les diplômés bénéficient d'excellentes opportunités dans les secteurs de l'IA, de la cybersécurité, et des technologies vertes. La demande en compétences techniques ne cesse d'augmenter à l'échelle mondiale.");
//            sciences.setDebouches(Arrays.asList("Ingénieur", "Développeur", "Data Scientist", "Chercheur", "Architecte logiciel", "Analyste système", "Administrateur réseau"));
//            sciences.setCompetences(Arrays.asList("Logique", "Mathématiques", "Analyse", "Créativité technique", "Résolution de problèmes", "Innovation"));
//            sciences.setUniversites(Arrays.asList("IPR/IFRA", "USTTB", "Écoles d'ingénieurs internationales", "Polytechnique", "École des Mines"));
//            sciences.setPrerequis(Arrays.asList("Baccalauréat scientifique", "Bonne maîtrise des mathématiques", "Esprit analytique", "Curiosité technologique", "Capacité d'abstraction"));
//
//            filiereRepository.save(sciences);
//
//            // 2. Sciences de la Santé
//            Filiere sante = new Filiere();
//            sante.setNom("Sciences de la Santé");
//            sante.setDescriptionCourte("Médecine, pharmacie, soins infirmiers, sciences biomédicales et santé publique");
//            sante.setDescriptionLongue("Les Sciences de la Santé forment les professionnels dédiés au bien-être et aux soins des populations. C'est un domaine exigeant mais extrêmement gratifiant qui évolue constamment avec les avancées médicales. Ce secteur requiert un engagement profond et une vocation authentique pour le service aux autres.");
////            sante.getFile().setFilePath("🏥");
//            sante.setDomaine(DomaineFiliereSerieType.SCIENCES_DE_LA_SANTE);
//            sante.setDifficulte(DifficulteType.TRES_ELEVEE);
//            sante.setDemande(DemandeType.FORTE);
//            sante.setSalaire(SalaireType.TRES_ELEVE);
//            sante.setDureeEtudes("6-12 ans");
//            sante.setTauxEmploi("98%");
//            sante.setSalaireDebut("50 000 - 70 000 €");
//            sante.setSalaireExperience("100 000 - 250 000 €");
//            sante.setPerspectives("Avec le vieillissement de la population et les nouveaux défis sanitaires, les professionnels de santé sont plus demandés que jamais. Les spécialisations offrent des carrières diversifiées dans la recherche, la pratique clinique, la santé publique et l'industrie pharmaceutique.");
//            sante.setDebouches(Arrays.asList("Médecin", "Pharmacien", "Infirmier", "Chercheur médical", "Chirurgien", "Spécialiste", "Directeur de santé", "Épidémiologiste"));
//            sante.setCompetences(Arrays.asList("Empathie", "Rigueur", "Résistance au stress", "Dextérité", "Communication", "Éthique médicale", "Prise de décision"));
//            sante.setUniversites(Arrays.asList("Faculté de Médecine", "USTTB", "Universités internationales", "Écoles de santé publique", "Instituts de formation paramédicale"));
//            sante.setPrerequis(Arrays.asList("Baccalauréat scientifique", "Concours d'entrée", "Grande capacité de travail", "Sens des responsabilités", "Vocation médicale"));
//
//            filiereRepository.save(sante);
//
//            // 3. Sciences Économiques et Gestion
//            Filiere economie = new Filiere();
//            economie.setNom("Sciences Économiques et Gestion");
//            economie.setDescriptionCourte("Économie, finance, management, comptabilité, marketing et entrepreneuriat");
//            economie.setDescriptionLongue("Ce domaine forme les décideurs économiques de demain. Il combine analyse des marchés, stratégie d'entreprise et compétences managériales pour naviguer dans un environnement économique complexe. Les diplômés deviennent des acteurs clés du développement économique et de la création de valeur.");
////            economie.getFile().setFilePath("📊");
//            economie.setDomaine(DomaineFiliereSerieType.SCIENCES_ECONOMIQUES_ET_GESTION);
//            economie.setDifficulte(DifficulteType.MOYENNE);
//            economie.setDemande(DemandeType.FORTE);
//            economie.setSalaire(SalaireType.MOYEN_ELEVE);
//            economie.setDureeEtudes("3-5 ans");
//            economie.setTauxEmploi("90%");
//            economie.setSalaireDebut("35 000 - 50 000 €");
//            economie.setSalaireExperience("60 000 - 150 000 €");
//            economie.setPerspectives("La mondialisation et la digitalisation créent de nouvelles opportunités dans la finance, le consulting et l'entrepreneuriat. Les profils internationaux sont particulièrement recherchés. L'économie verte et la finance durable ouvrent de nouvelles voies professionnelles.");
//            economie.setDebouches(Arrays.asList("Économiste", "Gestionnaire", "Consultant", "Analyste financier", "Entrepreneur", "Directeur marketing", "Contrôleur de gestion", "Auditeur"));
//            economie.setCompetences(Arrays.asList("Analyse", "Négociation", "Stratégie", "Communication", "Leadership", "Prise de décision", "Vision d'entreprise"));
//            economie.setUniversites(Arrays.asList("ENI", "USTTB", "Écoles de commerce", "Facultés d'économie", "Instituts de gestion"));
//            economie.setPrerequis(Arrays.asList("Baccalauréat général", "Intérêt pour l'actualité économique", "Esprit d'analyse", "Aptitude au travail en équipe", "Sens des chiffres"));
//
//            filiereRepository.save(economie);
//
//            // 4. Droit et Sciences Politiques
//            Filiere droit = new Filiere();
//            droit.setNom("Droit et Sciences Politiques");
//            droit.setDescriptionCourte("Droit civil, pénal, des affaires, relations internationales et administration publique");
//            droit.setDescriptionLongue("Le domaine du Droit et des Sciences Politiques forme les gardiens de la justice et les acteurs de la vie publique. Il allie rigueur juridique et compréhension des enjeux sociétaux. Cette filière prépare à des carrières où l'éthique, la justice et le service public sont au cœur des préoccupations.");
////            droit.getFile().setFilePath("⚖️");
//            droit.setDomaine(DomaineFiliereSerieType.DROIT_ET_SCIENCES_POLITIQUES);
//            droit.setDifficulte(DifficulteType.MOYENNE);
//            droit.setDemande(DemandeType.MOYENNE);
//            droit.setSalaire(SalaireType.VARIABLE);
//            droit.setDureeEtudes("4-5 ans");
//            droit.setTauxEmploi("85%");
//            droit.setSalaireDebut("30 000 - 45 000 €");
//            droit.setSalaireExperience("50 000 - 200 000 €");
//            droit.setPerspectives("La complexification des réglementations et la globalisation des échanges créent de nouveaux débouchés dans le droit international et le conseil aux entreprises. Les technologies juridiques (LegalTech) transforment la pratique du droit et ouvrent de nouvelles opportunités.");
//            droit.setDebouches(Arrays.asList("Avocat", "Magistrat", "Diplomate", "Juriste", "Fonctionnaire international", "Conseiller politique", "Lobbyiste", "Notaire"));
//            droit.setCompetences(Arrays.asList("Éloquence", "Raisonnement", "Rédaction", "Négociation", "Éthique", "Analyse juridique", "Persuasion"));
//            droit.setUniversites(Arrays.asList("Faculté de Droit", "ENI", "Universités internationales", "Instituts d'études politiques", "Écoles de notariat"));
//            droit.setPrerequis(Arrays.asList("Baccalauréat général", "Excellente expression écrite et orale", "Sens de l'argumentation", "Curiosité politique", "Rigueur intellectuelle"));
//
//            filiereRepository.save(droit);
//
//            // 5. Lettres et Sciences Humaines
//            Filiere lettres = new Filiere();
//            lettres.setNom("Lettres et Sciences Humaines");
//            lettres.setDescriptionCourte("Littérature, histoire, géographie, langues, philosophie et sociologie");
//            lettres.setDescriptionLongue("Les Lettres et Sciences Humaines explorent la condition humaine à travers la culture, l'histoire et la société. Ce domaine développe une pensée critique essentielle dans notre monde complexe. Il forme des esprits capables d'analyser, de comprendre et de transformer les réalités sociales et culturelles.");
////            lettres.getFile().setFilePath("📚");
//            lettres.setDomaine(DomaineFiliereSerieType.LETTRES_ET_SCIENCES_HUMAINES);
//            lettres.setDifficulte(DifficulteType.MOYENNE);
//            lettres.setDemande(DemandeType.VARIABLE);
//            lettres.setSalaire(SalaireType.MOYEN);
//            lettres.setDureeEtudes("3-4 ans");
//            lettres.setTauxEmploi("80%");
//            lettres.setSalaireDebut("25 000 - 35 000 €");
//            lettres.setSalaireExperience("40 000 - 70 000 €");
//            lettres.setPerspectives("Les compétences en analyse et communication sont de plus en plus valorisées dans l'économie du savoir. Les humanités digitales ouvrent de nouvelles voies professionnelles. La médiation culturelle et l'édition numérique créent de nouveaux débouchés.");
//            lettres.setDebouches(Arrays.asList("Enseignant", "Journaliste", "Traducteur", "Chercheur", "Écrivain", "Éditeur", "Chargé de communication", "Documentaliste"));
//            lettres.setCompetences(Arrays.asList("Rédaction", "Analyse", "Culture générale", "Communication", "Esprit critique", "Créativité", "Empathie"));
//            lettres.setUniversites(Arrays.asList("FLSH", "ENSup", "Universités internationales", "Écoles de journalisme", "Instituts de traduction"));
//            lettres.setPrerequis(Arrays.asList("Baccalauréat général", "Excellente culture générale", "Maîtrise de la langue", "Curiosité intellectuelle", "Ouverture d'esprit"));
//
//            filiereRepository.save(lettres);
//
//            // 6. Arts et Communication
//            Filiere arts = new Filiere();
//            arts.setNom("Arts et Communication");
//            arts.setDescriptionCourte("Design, communication, arts visuels, médias, cinéma et arts du spectacle");
//            arts.setDescriptionLongue("Les Arts et Communication forment les créateurs et médiateurs culturels de demain. Ce domaine allie expression artistique et maîtrise des technologies de communication modernes. Il prépare à des carrières où l'innovation, la créativité et l'adaptabilité sont essentielles.");
////            arts.getFile().setFilePath("🎨");
//            arts.setDomaine(DomaineFiliereSerieType.ARTS_ET_COMMUNICATION);
//            arts.setDifficulte(DifficulteType.VARIABLE);
//            arts.setDemande(DemandeType.CROISSANTE);
//            arts.setSalaire(SalaireType.VARIABLE);
//            arts.setDureeEtudes("3-5 ans");
//            arts.setTauxEmploi("75%");
//            arts.setSalaireDebut("25 000 - 40 000 €");
//            arts.setSalaireExperience("45 000 - 100 000 €");
//            arts.setPerspectives("L'économie créative et le digital transforment les métiers de la communication. Les compétences en design thinking sont très recherchées dans tous les secteurs. Les nouvelles technologies (IA, réalité virtuelle) créent de nouveaux champs d'expression artistique.");
//            arts.setDebouches(Arrays.asList("Designer", "Communicant", "Artiste", "Community Manager", "Réalisateur", "Photographe", "Directeur artistique", "Rédacteur web"));
//            arts.setCompetences(Arrays.asList("Créativité", "Expression", "Innovation", "Adaptabilité", "Sens esthétique", "Curiosité", "Polyvalence"));
//            arts.setUniversites(Arrays.asList("Conservatoire", "Écoles d'art", "Universités spécialisées", "Écoles de design", "Instituts de communication"));
//            arts.setPrerequis(Arrays.asList("Baccalauréat général ou technologique", "Portfolio artistique", "Sens créatif", "Ouverture d'esprit", "Curiosité culturelle"));
//
//            filiereRepository.save(arts);
//
//            System.out.println("=== 6 FILIÈRES AJOUTÉES AVEC SUCCÈS ===");
//        }
//    }
//}