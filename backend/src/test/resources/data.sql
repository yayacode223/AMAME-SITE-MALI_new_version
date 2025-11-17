CREATE TABLE bourse (
                         id INT,
                         bailleur VARCHAR(300),
                         categorie VARCHAR(200),
                         date_limite DATE,
                         date_publication DATE,
                         date_scraping DATE,
                         description_courte TEXT,
                         description_longue TEXT,
                         financement VARCHAR(200),
                         financement_statut VARCHAR(100),
                         lien_site_officiel VARCHAR(500),
                         niveau VARCHAR(200),
                         nombres_vues INTEGER,
                         organisation TEXT,
                         pays_eligible TEXT,
                         pays_hote VARCHAR(100),
                         region_eligible TEXT,
                         titre VARCHAR(500),
                         url_source VARCHAR(500)
);


-- Insertion de bourses de test
INSERT INTO bourse (
    id, bailleur, categorie, date_limite, date_publication, date_scraping,
    description_courte, description_longue, financement, financement_statut,
    lien_site_officiel, niveau, nombres_vues, organisation, pays_eligible,
    pays_hote, region_eligible, titre, url_source
) VALUES
      (
          1,
          'Gouvernement Français',
          'Bourse d''excellence',
          DATEADD('DAY', 30, CURRENT_DATE()), -- Date limite dans 30 jours
          DATEADD('DAY', -10, CURRENT_DATE()), -- Publiée il y a 10 jours
          CURRENT_DATE(),
          'Bourse d''excellence pour étudiants maliens en France',
          'Cette bourse couvre les frais de scolarité, l''hébergement et fournit une allocation mensuelle pour les étudiants maliens méritants souhaitant poursuivre leurs études en France. Le programme vise à renforcer la coopération éducative entre le Mali et la France.',
          'Complet (frais de scolarité + hébergement + allocation)',
          'Entièrement financée',
          'https://www.campusfrance.org/fr/bourse-excellence-mali',
          'Master,Doctorat',
          150,
          'Ministère de l''Enseignement Supérieur Français',
          'Mali, Sénégal, Côte d''Ivoire, Burkina Faso',
          'France',
          'Afrique de l''Ouest',
          'Bourse d''Excellence France-Mali 2024',
          'https://www.campusfrance.org'
      ),
      (
          2,
          'Université de Montréal',
          'Bourse de recherche',
          DATEADD('DAY', 45, CURRENT_DATE()), -- Date limite dans 45 jours
          DATEADD('DAY', -5, CURRENT_DATE()), -- Publiée il y a 5 jours
          CURRENT_DATE(),
          'Bourse de recherche en sciences informatiques au Canada',
          'L''Université de Montréal offre des bourses de recherche pour les étudiants internationaux en informatique et intelligence artificielle. Le programme inclut une exemption des frais de scolarité et une bourse de subsistance.',
          'Exemption frais de scolarité + bourse mensuelle',
          'Partiellement financée',
          'https://www.umontreal.ca/bourses-internationales',
          'Master,Doctorat',
          89,
          'Université de Montréal',
          'Tous les pays africains',
          'Canada',
          'Afrique',
          'Bourse de Recherche en Informatique - Université de Montréal 2024',
          'https://www.umontreal.ca'
      ),
      (
          3,
          'Commonwealth Scholarship Commission',
          'Bourse internationale',
          DATEADD('DAY', 15, CURRENT_DATE()), -- Date limite dans 15 jours
          DATEADD('DAY', -20, CURRENT_DATE()), -- Publiée il y a 20 jours
          CURRENT_DATE(),
          'Bourses du Commonwealth pour études au Royaume-Uni',
          'Le programme de bourses du Commonwealth offre aux étudiants des pays membres l''opportunité de poursuivre des études de master et doctorat au Royaume-Uni. Couverture complète des frais et allocation généreuse.',
          'Frais de scolarité + voyage + allocation mensuelle',
          'Entièrement financée',
          'https://cscuk.fcdo.gov.uk/scholarships',
          'Master,Doctorat',
          234,
          'Gouvernement Britannique',
          'Pays membres du Commonwealth',
          'Royaume-Uni',
          'Monde',
          'Bourses du Commonwealth 2024 pour Étudiants Internationaux',
          'https://cscuk.fcdo.gov.uk'
      ),
      (
          4,
          'DAAD',
          'Bourse d''études',
          DATEADD('DAY', 60, CURRENT_DATE()), -- Date limite dans 60 jours
          DATEADD('DAY', -2, CURRENT_DATE()), -- Publiée il y a 2 jours
          CURRENT_DATE(),
          'Bourses DAAD pour études en Allemagne',
          'Le Service allemand d''échanges universitaires (DAAD) propose des bourses pour étudiants internationaux dans toutes les disciplines. Excellente opportunité pour étudier dans les universités allemandes réputées.',
          'Bourse mensuelle + assurance santé + frais de voyage',
          'Entièrement financée',
          'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
          'Licence,Master,Doctorat',
          178,
          'DAAD (Service Allemand d''Échanges Universitaires)',
          'Pays en développement',
          'Allemagne',
          'Afrique, Asie, Amérique Latine',
          'Bourses DAAD 2024 pour Études en Allemagne',
          'https://www.daad.de'
      ),
      (
          5,
          'Banque Mondiale',
          'Bourse de développement',
          DATEADD('DAY', -5, CURRENT_DATE()), -- Date limite dépassée (il y a 5 jours)
          DATEADD('DAY', -40, CURRENT_DATE()), -- Publiée il y a 40 jours
          CURRENT_DATE(),
          'Bourse JJ/WBGS pour études en développement',
          'Programme de bourses conjoint Japon/Banque Mondiale pour des études en développement économique dans des universités partenaires à travers le monde.',
          'Frais de scolarité + allocation mensuelle + frais de voyage',
          'Entièrement financée',
          'https://www.worldbank.org/en/programs/scholarships',
          'Master',
          95,
          'Groupe de la Banque Mondiale',
          'Pays membres de la Banque Mondiale',
          'Japon, USA, France, UK',
          'Monde',
          'Bourse JJ/WBGS 2024 - Programme Japon/Banque Mondiale',
          'https://www.worldbank.org'
      ),
      (
          6,
          'Université Cheikh Anta Diop',
          'Bourse locale',
          DATEADD('DAY', 90, CURRENT_DATE()), -- Date limite dans 90 jours
          CURRENT_DATE(), -- Publiée aujourd''hui
          CURRENT_DATE(),
          'Bourse d''excellence UCAD pour étudiants maliens',
          'L''Université Cheikh Anta Diop de Dakar offre des bourses d''excellence aux étudiants maliens pour des programmes de licence et master dans diverses disciplines.',
          'Exemption partielle des frais + allocation mensuelle',
          'Partiellement financée',
          'https://www.ucad.sn/bourses-excellence',
          'Licence,Master',
          67,
          'Université Cheikh Anta Diop de Dakar',
          'Mali',
          'Sénégal',
          'Afrique de l''Ouest',
          'Bourse d''Excellence UCAD pour Étudiants Maliens 2024',
          'https://www.ucad.sn'
      ),
      (
          7,
          'Google Africa',
          'Bourse entreprise',
          DATEADD('DAY', 25, CURRENT_DATE()), -- Date limite dans 25 jours
          DATEADD('DAY', -8, CURRENT_DATE()), -- Publiée il y a 8 jours
          CURRENT_DATE(),
          'Bourse Google pour les leaders technologiques africains',
          'Google offre des bourses complètes pour des études en informatique et technologies aux étudiants africains talentueux. Programme incluant mentorat et stage chez Google.',
          'Frais complets + allocation + stage rémunéré',
          'Entièrement financée',
          'https://buildyourfuture.withgoogle.com/scholarships',
          'Licence,Master',
          312,
          'Google LLC',
          'Pays africains',
          'USA, UK, Afrique du Sud',
          'Afrique',
          'Bourse Google pour les Futurs Leaders Technologiques Africains 2024',
          'https://buildyourfuture.withgoogle.com'
      );