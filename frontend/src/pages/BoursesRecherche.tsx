import { Award } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import BoursesList from "../components/BoursesList";

const BoursesRecherche = () => (
  <div className="min-h-screen bg-amame-surface flex flex-col">
    <SEO
      title="Bourses de Recherche"
      description="Financez vos projets de recherche académique. Découvrez les bourses de recherche et opportunités pour chercheurs et doctorants maliens sélectionnées par l'AMAME."
      path="/bourses/recherche"
      keywords="bourses recherche Mali, financement doctorat Mali, bourse doctorant malien, AMAME recherche"
    />
    <Navbar />
    <PageHero
      icon={Award}
      label="Recherche"
      title="Bourses de"
      titleHighlight="Recherche"
      description="" //Financez vos projets de recherche académique. Découvrez les opportunités dédiées aux chercheurs et doctorants maliens.
      imageSrc="/images/heroes/hero-ressources.png"
      imageAlt="Bourses de recherche — chercheurs et doctorants maliens"
    />
    <BoursesList defaultCategorie="Bourse de recherche" />
    <Footer />
  </div>
);

export default BoursesRecherche;
