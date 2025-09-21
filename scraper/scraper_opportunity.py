# ==============================================================================
# SCRIPT DE SCRAPING FINAL - scraper.py
# Objectif : Scraper dg-enseignementsup.ml et insérer les données dans PostgreSQL
# ==============================================================================

# 1. Imports nécessaires
import requests
from bs4 import BeautifulSoup
import psycopg2 # Le driver pour PostgreSQL
from datetime import datetime
import re
import time

# 2. CONFIGURATION DE LA BASE DE DONNÉES
DB_CONFIG = {
    'dbname': 'amame_db',   # <-- AJOUTEZ
    'user': 'postgres',      # <-- AJOUTEZ
    'password': 'postgres',    # <-- AJOUTEZ
    'host': 'database',
    'port': '5432'
}

# 3. FONCTIONS UTILES
def connecter_db():
    """Établit la connexion à la base de données PostgreSQL."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("-> Connexion à la base de données PostgreSQL réussie.")
        return conn
    except psycopg2.OperationalError as e:
        print(f"ERREUR CRITIQUE : Impossible de se connecter à la base de données : {e}")
        print("Veuillez vérifier les informations dans DB_CONFIG.")
        return None

def extraire_annee_du_texte(texte):
    """Extrait la première année (ex: 2024) d'un texte."""
    if not texte:
        return None
    match = re.search(r'20\d{2}', texte)
    if match:
        return int(match.group(0))
    return None

def deduire_pays_depuis_url_image(url_image):
    if not url_image: return None
    nom_fichier = url_image.lower()
    mapping_pays = {
        'russie': 'Russie', 'russe': 'Russie', 'chine': 'Chine', 'chinois': 'Chine',
        'egypt': 'Égypte', 'egypte': 'Égypte', 'egyptien': 'Égypte',
        'cuba': 'Cuba', 'cubain': 'Cuba', 'maroc': 'Maroc', 'marocain': 'Maroc',
        'algerie': 'Algérie', 'algerien': 'Algérie', 'tunisie': 'Tunisie',
        'tunisien': 'Tunisie', 'uemoa': 'UEMOA', 'japon': 'Japon',
        'japonais': 'Japon', 'inde': 'Inde', 'venezuela': 'Venezuela'
    }
    for mot_cle, nom_pays in mapping_pays.items():
        if mot_cle in nom_fichier:
            return nom_pays
    return None


def scraper_page_detail(url_detail, headers):
    """Visite une page de détail pour extraire les infos riches."""
    print(f"  -> Visite de la page détail : {url_detail[:70]}...")
    try:
        page_detail = requests.get(url_detail, headers=headers)
        page_detail.raise_for_status()
        soup_detail = BeautifulSoup(page_detail.content, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"    -> Erreur de visite : {e}")
        return {"description_complete": "ERREUR DE LECTURE", "liens_pdf": []}

    contenu_element = soup_detail.find("div", class_="entry-content")
    description_complete = ""
    if contenu_element:
        description_complete = " ".join(contenu_element.get_text(separator=' ', strip=True).split())

    liens_pdf = []
    if contenu_element:
        for lien in contenu_element.find_all("a"):
            if lien.has_attr('href') and lien['href'].lower().endswith(('.pdf', '.docx', '.doc')):
                liens_pdf.append(lien['href'])
    
    return {
        "description_complete": description_complete,
        "liens_pdf": liens_pdf
    }

# ==============================================================================
# 4. FONCTION PRINCIPALE D'EXÉCUTION
# ==============================================================================
def run_scraper():
    # --- Configuration du scraping ---
    url_liste = "https://dg-enseignementsup.ml/rubrique/actualites/"
    headers = {'User-Agent': 'MonAppEducative/1.0 (Contact: projet.etudiant.mali@example.com)'}
    annee_actuelle = datetime.now().year
    
    print("=" * 50)
    print("         LANCEMENT DU SCRAPER - DGESRS MALI")
    print("=" * 50)
    print(f"Scraping de : {url_liste}")
    
    # --- Requête de la page de liste ---
    try:
        page_liste = requests.get(url_liste, headers=headers)
        page_liste.raise_for_status()
        soup_liste = BeautifulSoup(page_liste.content, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"ERREUR : Impossible de télécharger la page de liste. Arrêt. Erreur: {e}")
        return

    # --- Étape 1 : Collecte des opportunités depuis le site ---
    print("\n--- Étape 1: Collecte des données depuis le site web ---")
    liste_articles = soup_liste.find_all("article", class_="list-article")
    opportunites_collectees = []

    for article in liste_articles:
        titre_element = article.find("h2", class_="entry-title")
        if not (titre_element and titre_element.find("a")): continue
            
        titre = titre_element.find("a").get_text(strip=True)
        annee_pertinence = extraire_annee_du_texte(titre)

        if annee_pertinence is None or annee_pertinence < annee_actuelle:
            continue
        
        url_source = titre_element.find("a")['href']

         # Extraire l'URL de l'image de l'article (que nous utiliserons comme URL du drapeau)
        image_container = article.find("div", class_="list-article-thumb")
        url_drapeau = ""
        if image_container and image_container.find("img"):
            url_drapeau = image_container.find("img")['src']
            
        # DÉDUIRE LE PAYS À PARTIR DE L'URL DE L'IMAGE
        pays = deduire_pays_depuis_url_image(url_drapeau)


        # Visiter la page de détail
        time.sleep(1) # Pause de 1s pour être respectueux
        details = scraper_page_detail(url_source, headers)

        opportunites_collectees.append({
            "titre": titre,
            "url_source": url_source,
            "description_complete": details.get("description_complete"),
            "url_pdf1": details.get("liens_pdf")[0] if details.get("liens_pdf") else None,
            "url_pdf2": details.get("liens_pdf")[1] if len(details.get("liens_pdf", [])) > 1 else None,
            "source_site": "dg-enseignementsup.ml",
            "pays_offrant": pays,       # <-- NOUVEAU
            "url_drapeau": url_drapeau,  # <-- NOUVEAU
            "annee_pertinence": annee_pertinence,
            "date_scraping": datetime.now()
        })
    
    print(f"-> {len(opportunites_collectees)} opportunités pertinentes ont été collectées.")

    # --- Étape 2 : Insertion des données dans la base de données ---
    print("\n--- Étape 2: Synchronisation avec la base de données ---")
    if not opportunites_collectees:
        print("Aucune opportunité à traiter. Fin du script.")
        return

    conn = connecter_db()
    if not conn:
        return

    cursor = conn.cursor()
    insertions_reussies = 0
    deja_existantes = 0

    for opp in opportunites_collectees:
        try:
            cursor.execute("SELECT id FROM opportunites WHERE url_source = %s", (opp['url_source'],))
            if cursor.fetchone():
                deja_existantes += 1
                continue

            sql = """
                INSERT INTO opportunites 
                (titre, description_complete, url_source, url_pdf1, url_pdf2, source_site, pays_offrant, url_drapeau, annee_pertinence, date_scraping)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                opp['titre'],
                opp['description_complete'],
                opp['url_source'],
                opp['url_pdf1'],
                opp['url_pdf2'],
                opp['source_site'],
                opp['pays_offrant'],
                opp['url_drapeau'],
                opp['annee_pertinence'],
                opp['date_scraping']
                # ... d'autres valeurs ...
            ))
            insertions_reussies += 1
        except Exception as e:
            print(f"  -> ERREUR lors de l'insertion de '{opp['titre'][:30]}...': {e}")
            conn.rollback()

    conn.commit()
    cursor.close()
    conn.close()

    print("\n" + "=" * 50)
    print("              RAPPORT FINAL DU SCRAPING")
    print("=" * 50)
    print(f"Nouvelles opportunités insérées : {insertions_reussies}")
    print(f"Opportunités déjà existantes ignorées : {deja_existantes}")
    print(f"Total des opportunités pertinentes traitées : {len(opportunites_collectees)}")
    print("=" * 50)


# ==============================================================================
# 5. POINT D'ENTRÉE DU SCRIPT
# ==============================================================================
if __name__ == "__main__":
    run_scraper()
