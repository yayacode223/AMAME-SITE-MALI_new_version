from datetime import datetime
import time
import re # On importe re en haut du fichier pour la propreté
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import pandas as pd
import psycopg2

# 1. CONFIGURATION DE LA BASE DE DONNÉES
DB_CONFIG = {
    'dbname': 'amame_db',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'database',
    'port': '5432'
}

# 2. FONCTIONS
def connecter_db():
    """Établit la connexion à la base de données PostgreSQL."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("-> Connexion à la base réussie.")
        return conn
    except Exception as e:
        print(f"ERREUR : Erreur de connexion : {e}")
        return None

def scrape_page(page):
    """
    Fonction qui prend une page Playwright, extrait le HTML,
    et retourne une liste de dictionnaires contenant les données des établissements.
    """
    print("   -> Analyse du HTML avec BeautifulSoup...")
    html_content = page.content()
    soup = BeautifulSoup(html_content, "html.parser")
    
    donnees_page = []
    cartes = soup.find_all("article", class_="wpgb-card")

    for carte in cartes:
        # Initialisation des variables pour chaque carte
        nom = type_etablissement = lieu = url_etablissement = url_logo = url_image_principale = None

        # --- Extraction des données de base ---
        nom_tag = carte.find("h3", class_="custom-card-name")
        if nom_tag and nom_tag.find("a"):
            a_tag = nom_tag.find("a")
            nom = a_tag.get_text(strip=True)
            url_etablissement = a_tag.get("href")

        if not nom:
            continue # On passe à la carte suivante si le nom n'est pas trouvé

        footer = carte.find("div", class_="wpgb-card-footer")
        if footer:
            metas = footer.find_all("a")
            if len(metas) >= 1:
                type_etablissement = metas[0].get_text(strip=True)
            if len(metas) >= 2:
                lieu = metas[1].get_text(strip=True)

        # --- NOUVELLE LOGIQUE D'EXTRACTION DES IMAGES ---
        # 1. Chercher la grande image dans le style CSS du div
        image_div = carte.find("div", class_="wpgb-card")
        if image_div and image_div.has_attr('style'):
            style_attr = image_div['style']
            match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style_attr)
            if match:
                url_image_principale = match.group(1)
        
        # 2. Chercher le petit logo en gérant le lazy loading
        logo_div = carte.find("div", class_="custom-card-logo")
        if logo_div and logo_div.find("img"):
            img_tag = logo_div.find("img")
            if img_tag.has_attr('data-src'):
                url_logo = img_tag['data-src']
            elif img_tag.has_attr('src') and not img_tag['src'].startswith('data:image'):
                url_logo = img_tag['src']
        
        donnees_page.append({
            "nom": nom,
            "type_etablissement": type_etablissement,
            "lieu": lieu,
            "url_detail_etablissement": url_etablissement,
            "url_image": url_image_principale, # La grande image
            "url_logo": url_logo,             # Le petit logo
            "source_site": "legrandfrere.africa"
        })
    
    return donnees_page

def main_scraper():
    """
    Fonction principale qui pilote le navigateur, gère la pagination,
    et collecte les données de toutes les pages.
    """
    donnees_totales = []
    base_url = "https://legrandfrere.africa/localite/mali/"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        
        try:
            print(f"Scraping de la page 1 : {base_url}")
            page.goto(base_url, wait_until='networkidle', timeout=60000)
            donnees_totales.extend(scrape_page(page))

            page_actuelle = 1
            while True:
                page_actuelle += 1
                print(f"Recherche de la page {page_actuelle}...")
                
                next_page_link = page.query_selector(f'a.page-numbers[href*="/page/{page_actuelle}/"]')
                
                if not next_page_link:
                    print("-> Plus de pages à scraper. Fin de la collecte.")
                    break
                
                print(f"-> Clic sur le lien de la page {page_actuelle}...")
                next_page_link.click()
                
                page.wait_for_load_state('networkidle', timeout=30000)
                time.sleep(2) # Petite pause de sécurité
                
                print("-> Page chargée. Scraping du contenu...")
                donnees_totales.extend(scrape_page(page))

        except Exception as e:
            print(f"ERREUR lors du scraping : {e}")
        finally:
            browser.close()
            
    return donnees_totales

def inserer_dans_db(donnees_etablissements):
    """Insère une liste de dictionnaires dans la base de données."""
    if not donnees_etablissements:
        print("Aucune donnée à insérer.")
        return

    print("\n--- Étape 2: Insertion dans la base de données ---")
    conn = connecter_db()
    if not conn:
        return

    cursor = conn.cursor()
    inseres, existants = 0, 0

    for etab in donnees_etablissements:
        try:
            cursor.execute("SELECT id FROM etablissements WHERE url_detail_etablissement = %s", (etab.get('url_detail_etablissement'),))
            if cursor.fetchone():
                existants += 1
                continue

            # !! IMPORTANT : Assurez-vous d'avoir les colonnes 'url_image' et 'url_logo' dans votre table
            cursor.execute("""
                INSERT INTO etablissements 
                (nom, type_etablissement, lieu, url_detail_etablissement, url_image, url_logo, source_site, date_scraping)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                etab.get("nom"),
                etab.get("type_etablissement"),
                etab.get("lieu"),
                etab.get("url_detail_etablissement"),
                etab.get("url_image"),
                etab.get("url_logo"),
                etab.get("source_site"),
                datetime.now()
            ))
            inseres += 1
        except Exception as e:
            print(f"ERREUR pour '{etab.get('nom')}' : {e}")
            conn.rollback()

    conn.commit()
    cursor.close()
    conn.close()

    print("\n--- Rapport Final ---")
    print("="*40)
    print(f"Nouveaux établissements insérés : {inseres}")
    print(f"Établissements déjà présents : {existants}")
    print(f"Total traités : {len(donnees_etablissements)}")
    print("="*40)

# 3. POINT D'ENTRÉE PRINCIPAL DU SCRIPT
if __name__ == "__main__":
    print("==============================================")
    print("  LANCEMENT DU SCRAPER - ÉTABLISSEMENTS MALI")
    print("==============================================")
    
    print("\n--- Étape 1: Collecte des données depuis le site web ---")
    donnees_collectees = main_scraper()

    inserer_dans_db(donnees_collectees)

    if donnees_collectees:
        df = pd.DataFrame(donnees_collectees)
        print("\n--- Aperçu des données collectées ---")
        print(df.head())
    else:
        print("\nScraping terminé, aucune nouvelle donnée collectée.")