import { Trophy } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ConcoursListing from "../components/ConcoursListing";

const ConcoursNational = () => (
  <div className="min-h-screen bg-amame-surface flex flex-col">
    <SEO
      title="Concours Nationaux"
      description="Découvrez tous les concours organisés au Mali. Dates d'inscription, critères d'éligibilité et informations complètes sur les concours nationaux pour étudiants maliens."
      path="/concours/national"
      keywords="concours nationaux Mali, concours mali, concours étudiants maliens, AMAME concours"
    />
    <Navbar />
    <PageHero
      icon={Trophy}
      label="Concours"
      title="Concours"
      titleHighlight="Nationaux"
      description="" //Découvrez les concours organisés au Mali. Préparez-vous et candidatez aux meilleures opportunités nationales.
      imageSrc="/images/heroes/hero-concours.png"
      imageAlt="Concours nationaux — étudiants maliens"
    />
    <ConcoursListing defaultStatus="NATIONAL" />
    <Footer />
  </div>
);

export default ConcoursNational;
