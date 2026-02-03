import requests
from bs4 import BeautifulSoup
import psycopg2
from datetime import datetime, date
import re
import time
import logging
from urllib.parse import urljoin

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Configuration de la base de données
DB_CONFIG = {
    'dbname': 'amame_db',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'database',
    'port': '5432'
}

class Mina7Scraper:
    def __init__(self, parser='html5lib'):
        self.base_url = "https://mina7portal.com"
        self.parser = parser  # 'html5lib', 'lxml', 'html.parser'
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        logger.info(f"Parser utilisé: {self.parser}")
    
    def creer_soup(self, html_content):
        """Crée un objet BeautifulSoup avec le parser choisi"""
        return BeautifulSoup(html_content, self.parser)
    
    def connecter_db(self):
        """Établit la connexion à la base de données PostgreSQL."""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            logger.info("Connexion à la base de données PostgreSQL réussie.")
            return conn
        except psycopg2.OperationalError as e:
            logger.error(f"ERREUR CRITIQUE : Impossible de se connecter à la base de données : {e}")
            return None
    
    def creer_table_bourses(self):
        """Crée la table bourses si elle n'existe pas"""
        conn = self.connecter_db()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bourse (
                    id SERIAL PRIMARY KEY,
                    titre VARCHAR(500) NOT NULL,
                    description_courte TEXT,
                    description_longue TEXT,
                    bailleur VARCHAR(300),
                    nombres_vues INTEGER DEFAULT 0,
                    pays_hote VARCHAR(100),
                    niveau VARCHAR(200),
                    financement VARCHAR(200),
                    organisation VARCHAR(300),
                    financement_statut VARCHAR(100),
                    date_limite DATE,
                    pays_eligible TEXT,
                    region_eligible TEXT,
                    lien_site_officiel VARCHAR(500),
                    url_source VARCHAR(500) UNIQUE,
                    categorie VARCHAR(200),
                    date_scraping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    date_publication DATE
                )
            """)
            
            # Création des index pour optimiser les recherches
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_bourse_pays_hote ON bourse(pays_hote);
                CREATE INDEX IF NOT EXISTS idx_bourse_niveau ON bourse(niveau);
                CREATE INDEX IF NOT EXISTS idx_bourse_date_limite ON bourse(date_limite);
                CREATE INDEX IF NOT EXISTS idx_bourse_categorie ON bourse(categorie);
                CREATE INDEX IF NOT EXISTS idx_bourse_url_source ON bourse(url_source);
            """)
            
            conn.commit()
            logger.info("Table 'bourses' créée ou déjà existante")
            return True
            
        except Exception as e:
            logger.error(f"Erreur création table: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()

    def bourse_existe_deja(self, url_source):
        """Vérifie si une bourse existe déjà dans la base"""
        conn = self.connecter_db()
        if not conn:
            return True
        
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM bourse WHERE url_source = %s", (url_source,))
            existe = cursor.fetchone() is not None
            return existe
        except Exception as e:
            logger.error(f"Erreur vérification existence bourse: {e}")
            return True
        finally:
            cursor.close()
            conn.close()

    def date_limite_valide(self, date_limite):
        """Vérifie si la date limite est dans le futur"""
        if not date_limite:
            return True
        
        aujourdhui = date.today()
        return date_limite >= aujourdhui
    
    def get_categories(self):
        """Retourne la liste des catégories à scraper"""
        categories = [
            {
                'nom': 'Bourses d\'études au Canada',
                'slug': 'bourses-detudes-au-canada',
                'url': 'https://mina7portal.com/category/country/bourses-detudes-au-canada'
            },
            {
                'nom': 'Bourses d\'études en États-Unis', 
                'slug': 'bourses-detudes-en-etats-unis',
                'url': 'https://mina7portal.com/category/country/bourses-detudes-en-etats-unis'
            },
            {
                'nom': 'Bourses d\'études en Suisse',
                'slug': 'bourses-detudes-en-suisse', 
                'url': 'https://mina7portal.com/category/country/bourses-detudes-en-suisse'
            },
            {
                'nom': 'Bourses d\'études en Allemagne',
                'slug': 'bourses-detudes-en-allemagne',
                'url': 'https://mina7portal.com/category/country/bourses-detudes-en-allemagne'
            },
            {
                'nom': 'Bourses d\'études en France', 
                'slug': 'bourses-detudes-en-france',
                'url': 'https://mina7portal.com/category/country/bourses-detudes-en-france'
            },
            {
                'nom': 'Bourses d\'études en Australie',
                'slug': 'bourses-detudes-en-australie',
                'url': 'https://mina7portal.com/category/country/bourses-detudes-en-australie'
            },
            {
                'nom': 'Bourses d\'études en Royaume-Uni',
                'slug': 'bourses-detudes-au-royaume-uni', 
                'url': 'https://mina7portal.com/category/country/bourses-detudes-au-royaume-uni'
            },
            {
                'nom': 'Bourses d\'études en Suède',
                'slug': 'bourses-detudes-en-suede',
                'url': 'https://mina7portal.com/category/country/bourses-detudes-en-suede'
            }
        ]
        return categories
    
    def scraper_liste_bourses(self, url_categorie):
        """Scrape la liste des bourses d'une catégorie"""
        try:
            logger.info(f"Scraping de la catégorie: {url_categorie}")
            response = self.session.get(url_categorie)
            response.raise_for_status()
            
            # Utilisation du parser choisi
            soup = self.creer_soup(response.content)
            bourses_data = []
            
            # Sélecteur exact pour les articles de bourses
            articles = soup.select('section.row.gy-3 article.col-12')
            
            for article in articles:
                try:
                    # Titre
                    titre_element = article.select_one('h2[itemprop="name"]')
                    titre = titre_element.get_text(strip=True) if titre_element else None
                    
                    # Lien de détail
                    link_element = article.select_one('footer a.btn')
                    url_detail = link_element.get('href') if link_element else None
                    if url_detail and not url_detail.startswith('http'):
                        url_detail = urljoin(self.base_url, url_detail)
                    
                    # Vérifier si la bourse existe déjà
                    if self.bourse_existe_deja(url_detail):
                        logger.info(f"  ⚠ Bourse déjà existante: {titre[:50]}...")
                        continue
                    
                    # Description courte
                    desc_element = article.select_one('p[itemprop="description"]')
                    description_courte = desc_element.get_text(strip=True) if desc_element else ""
                    
                    # Extraction des informations de la liste
                    infos = self.extraire_infos_liste(article)
                    
                    # Vérifier la date limite avant de continuer
                    if infos.get('date_limite') and not self.date_limite_valide(infos['date_limite']):
                        logger.info(f"  ⚠ Bourse expirée ignorée: {titre[:50]}... (date: {infos['date_limite']})")
                        continue
                    
                    if titre and url_detail:
                        bourse_data = {
                            'titre': titre,
                            'description_courte': description_courte,
                            'url_detail': url_detail,
                            **infos
                        }
                        bourses_data.append(bourse_data)
                        
                except Exception as e:
                    logger.error(f"Erreur parsing article: {e}")
                    continue
            
            logger.info(f"Trouvé {len(bourses_data)} bourses valides dans cette catégorie")
            return bourses_data
            
        except Exception as e:
            logger.error(f"Erreur scraping liste {url_categorie}: {e}")
            return []
    
    def extraire_infos_liste(self, article):
        """Extrait les informations depuis la liste"""
        infos = {
            'nombres_vues': 0,
            'date_limite': None,
            'financement_statut': None,
            'pays_hote': None,
            'bailleur': None
        }
        
        try:
            list_items = article.select('ul.fa-ul li')
            
            for item in list_items:
                text = item.get_text(strip=True)
                
                if 'Consultée' in text:
                    match = re.search(r'Consultée\s+(\d+)\s+fois', text)
                    if match:
                        infos['nombres_vues'] = int(match.group(1))
                
                elif 'Date limite' in text:
                    date_text = item.select_one('cite')
                    if date_text:
                        date_str = date_text.get_text(strip=True)
                        infos['date_limite'] = self.parse_date(date_str)
                
                elif 'Financement' in text:
                    if 'complet' in text.lower():
                        infos['financement_statut'] = 'Financement complet'
                    elif 'partiel' in text.lower():
                        infos['financement_statut'] = 'Financement partiel'
                    else:
                        infos['financement_statut'] = text.replace('Financement', '').strip()
                
                elif 'Pays' in text:
                    pays_text = text.replace('Pays :', '').strip()
                    infos['pays_hote'] = pays_text
                
                elif 'Bailleur' in text:
                    bailleur_text = text.replace('Bailleur :', '').strip()
                    infos['bailleur'] = bailleur_text
        
        except Exception as e:
            logger.error(f"Erreur extraction infos liste: {e}")
        
        return infos
    
    def scraper_detail_bourse(self, bourse_liste_data, categorie_nom):
        """Scrape les détails d'une bourse spécifique"""
        url_bourse = bourse_liste_data['url_detail']
        
        try:
            logger.info(f"  → Scraping détail: {url_bourse}")
            time.sleep(1)
            
            response = self.session.get(url_bourse)
            response.raise_for_status()
            
            # Utilisation du parser choisi
            soup = self.creer_soup(response.content)
            
            titre = bourse_liste_data['titre']
            
            # Section des détails
            details_section = soup.select_one('section[aria-labelledby="details"]')
            
            # Organisation/Bailleur
            organisation = bourse_liste_data.get('bailleur')
            if details_section:
                org_element = details_section.select_one('div:-soup-contains("Organisation") + div a')
                if org_element:
                    organisation = org_element.get_text(strip=True)
            
            # Pays hôte
            pays_hote = bourse_liste_data.get('pays_hote')
            if details_section:
                pays_element = details_section.select_one('div:-soup-contains("Pays hôte") + div a')
                if pays_element:
                    pays_hote = pays_element.get_text(strip=True)
            
            # Date limite
            date_limite = bourse_liste_data.get('date_limite')
            if details_section:
                date_element = details_section.select_one('time[itemprop="deadlineDate"]')
                if date_element:
                    date_str = date_element.get_text(strip=True)
                    nouvelle_date = self.parse_date(date_str)
                    if nouvelle_date:
                        date_limite = nouvelle_date
            
            # Vérification finale de la date limite
            if not self.date_limite_valide(date_limite):
                logger.info(f"    ⚠ Bourse expirée après vérification détail: {date_limite}")
                return None
            
            # Financement statut
            financement_statut = bourse_liste_data.get('financement_statut')
            if details_section:
                finance_element = details_section.select_one('div:-soup-contains("Financement") + div')
                if finance_element:
                    finance_text = finance_element.get_text(strip=True)
                    financement_statut = finance_text
            
            # Pays éligibles
            pays_eligible = None
            if details_section:
                pays_eligible_element = details_section.select_one('div:-soup-contains("Pays éligibles") + div')
                if pays_eligible_element:
                    pays_eligible = pays_eligible_element.get_text(strip=True)
            
            # Région éligible
            region_eligible = None
            if details_section:
                region_element = details_section.select_one('div:-soup-contains("Région éligible") + div')
                if region_element:
                    region_eligible = region_element.get_text(strip=True)
            
            # Description longue
            description_longue = ""
            desc_section = soup.select_one('section[aria-labelledby="description"]')
            if desc_section:
                desc_content = desc_section.select_one('.description')
                if desc_content:
                    description_longue = desc_content.get_text(strip=True)
                else:
                    description_longue = desc_section.get_text(strip=True)
            
            # Lien officiel de postulation
            lien_site_officiel = None
            apply_section = soup.select_one('section[aria-labelledby="apply"]')
            if apply_section:
                apply_link = apply_section.select_one('a.postLink')
                if apply_link:
                    lien_site_officiel = apply_link.get('href')
                    if lien_site_officiel and not lien_site_officiel.startswith('http'):
                        lien_site_officiel = urljoin(self.base_url, lien_site_officiel)
            
            # Niveau d'études
            niveau = self.deduire_niveau_etudes(titre, description_longue)
            
            # Financement
            financement = self.extraire_montant_financement(description_longue)
            
            bourse_data = {
                'titre': titre,
                'description_courte': bourse_liste_data.get('description_courte', ''),
                'description_longue': description_longue,
                'bailleur': organisation,
                'nombres_vues': bourse_liste_data.get('nombres_vues', 0),
                'pays_hote': pays_hote,
                'niveau': niveau,
                'financement': financement,
                'organisation': organisation,
                'financement_statut': financement_statut,
                'date_limite': date_limite,
                'pays_eligible': pays_eligible,
                'region_eligible': region_eligible,
                'lien_site_officiel': lien_site_officiel,
                'url_source': url_bourse,
                'categorie': categorie_nom,
                'date_publication': datetime.now().date()
            }
            
            return bourse_data
            
        except Exception as e:
            logger.error(f"Erreur scraping détail {url_bourse}: {e}")
            return None
    
    def parse_date(self, date_str):
        """Parse une date depuis le texte"""
        if not date_str:
            return None
        
        try:
            mois_fr = {
                'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04',
                'mai': '05', 'juin': '06', 'juil': '07', 'août': '08',
                'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12'
            }
            
            date_clean = date_str.strip()
            
            match = re.search(r'(\d{1,2})\s+(\w+)\.?\s+(\d{4})', date_clean)
            if match:
                jour, mois, annee = match.groups()
                mois_num = mois_fr.get(mois.lower()[:4])
                if mois_num:
                    return datetime.strptime(f"{jour}/{mois_num}/{annee}", '%d/%m/%Y').date()
            
            formats = ['%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%Y-%m-%d']
            for fmt in formats:
                try:
                    return datetime.strptime(date_clean, fmt).date()
                except ValueError:
                    continue
            
            return None
            
        except Exception:
            return None
    
    def deduire_niveau_etudes(self, titre, description):
        """Déduit le niveau d'études depuis le titre et la description"""
        text = f"{titre} {description}".lower()
        
        niveaux = []
        mapping_niveaux = {
            'baccalauréat': ['baccalauréat', 'baccalaureat', 'bac ', 'high school'],
            'licence': ['licence', 'bachelor', 'undergraduate', 'premier cycle'],
            'master': ['master', 'mastère', 'graduate', 'deuxième cycle'],
            'doctorat': ['doctorat', 'phd', 'doctoral', 'troisième cycle'],
            'mba': ['mba', 'master of business'],
            'postdoc': ['postdoc', 'post-doctorat']
        }
        
        for niveau, mots_cles in mapping_niveaux.items():
            if any(mot in text for mot in mots_cles):
                niveaux.append(niveau)
        
        return ', '.join(niveaux) if niveaux else None
    
    def extraire_montant_financement(self, description):
        """Extrait le montant du financement depuis la description"""
        if not description:
            return None
        
        patterns = [
            r'(\d+[\d\s]*(?:€|\$|USD|EUR|CAD|GBP))',
            r'bourse\s+de\s+(\d+[\d\s]*(?:€|\$|USD))',
            r'scholarship\s+of\s+(\d+[\d\s]*(?:€|\$|USD))',
            r'(\d+[\d\s]*)\s*(?:dollars|euros)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            if matches:
                return matches[0]
        
        return None
    
    def sauvegarder_bourse(self, bourse_data):
        """Sauvegarde une bourse dans la base de données"""
        conn = self.connecter_db()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO bourse (
                    titre, description_courte, description_longue, bailleur,
                    nombres_vues, pays_hote, niveau, financement, organisation,
                    financement_statut, date_limite, pays_eligible, region_eligible,
                    lien_site_officiel, url_source, categorie, date_publication
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (url_source) 
                DO UPDATE SET
                    titre = EXCLUDED.titre,
                    description_courte = EXCLUDED.description_courte,
                    description_longue = EXCLUDED.description_longue,
                    bailleur = EXCLUDED.bailleur,
                    nombres_vues = EXCLUDED.nombres_vues,
                    pays_hote = EXCLUDED.pays_hote,
                    niveau = EXCLUDED.niveau,
                    financement = EXCLUDED.financement,
                    organisation = EXCLUDED.organisation,
                    financement_statut = EXCLUDED.financement_statut,
                    date_limite = EXCLUDED.date_limite,
                    pays_eligible = EXCLUDED.pays_eligible,
                    region_eligible = EXCLUDED.region_eligible,
                    lien_site_officiel = EXCLUDED.lien_site_officiel,
                    categorie = EXCLUDED.categorie,
                    date_publication = EXCLUDED.date_publication,
                    date_scraping = CURRENT_TIMESTAMP
            """, (
                bourse_data['titre'],
                bourse_data['description_courte'],
                bourse_data['description_longue'],
                bourse_data['bailleur'],
                bourse_data['nombres_vues'],
                bourse_data['pays_hote'],
                bourse_data['niveau'],
                bourse_data['financement'],
                bourse_data['organisation'],
                bourse_data['financement_statut'],
                bourse_data['date_limite'],
                bourse_data['pays_eligible'],
                bourse_data['region_eligible'],
                bourse_data['lien_site_officiel'],
                bourse_data['url_source'],
                bourse_data['categorie'],
                bourse_data['date_publication']
            ))
            
            conn.commit()
            logger.info(f"    ✓ Bourse sauvegardée: {bourse_data['titre'][:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde bourse: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()
    
    def run_scraping(self, max_bourses_par_categorie=5):
        """Lance le scraping complet"""
        logger.info("=" * 60)
        logger.info(f"       LANCEMENT DU SCRAPING MINA7PORTAL")
        logger.info(f"              Parser: {self.parser}")
        logger.info("=" * 60)
        
        if not self.creer_table_bourses():
            return
        
        categories = self.get_categories()
        total_bourses_sauvegardees = 0
        total_bourses_expirees = 0
        
        for categorie in categories:
            logger.info(f"\n--- Catégorie: {categorie['nom']} ---")
            
            bourses_liste = self.scraper_liste_bourses(categorie['url'])
            
            if not bourses_liste:
                logger.info("Aucune bourse valide trouvée dans cette catégorie")
                continue
            
            if max_bourses_par_categorie:
                bourses_liste = bourses_liste[:max_bourses_par_categorie]
            
            bourses_sauvegardees_categorie = 0
            bourses_expirees_categorie = 0
            
            for bourse_liste in bourses_liste:
                bourse_data = self.scraper_detail_bourse(bourse_liste, categorie['nom'])
                
                if bourse_data:
                    if self.sauvegarder_bourse(bourse_data):
                        bourses_sauvegardees_categorie += 1
                        total_bourses_sauvegardees += 1
                else:
                    bourses_expirees_categorie += 1
                    total_bourses_expirees += 1
                
                time.sleep(2)
            
            logger.info(f"→ {bourses_sauvegardees_categorie} bourses sauvegardées dans cette catégorie")
            if bourses_expirees_categorie > 0:
                logger.info(f"→ {bourses_expirees_categorie} bourses expirées ignorées")
        
        logger.info("\n" + "=" * 60)
        logger.info("            RAPPORT FINAL DU SCRAPING")
        logger.info("=" * 60)
        logger.info(f"Parser utilisé: {self.parser}")
        logger.info(f"Bourses sauvegardées : {total_bourses_sauvegardees}")
        logger.info(f"Bourses expirées ignorées : {total_bourses_expirees}")
        logger.info("=" * 60)

# Test avec différents parsers
if __name__ == "__main__":
    # Essayer d'abord html5lib, puis lxml, puis html.parser
    parsers = ['html5lib', 'lxml', 'html.parser']
    
    for parser in parsers:
        try:
            logger.info(f"\n{'='*50}")
            logger.info(f"TEST AVEC PARSER: {parser}")
            logger.info(f"{'='*50}")
            
            scraper = Mina7Scraper(parser=parser)
            scraper.run_scraping(max_bourses_par_categorie=50)  # Test avec 50 bourses
            
            # Si ça marche, on arrête
            break
            
        except Exception as e:
            logger.error(f"Parser {parser} a échoué: {e}")
            continue