import { Award } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import BoursesList from "../components/BoursesList";

const BoursesEtude = () => (
  <div className="min-h-screen bg-amame-surface flex flex-col">
    <SEO
      title="Bourses d'Étude"
      description="Financez vos études à l'étranger. Retrouvez toutes les bourses d'études pour étudiants maliens souhaitant poursuivre un cursus universitaire. Sélection gratuite par l'AMAME."
      path="/bourses/etude"
      keywords="bourses études Mali, financement études étrangères, bourse universitaire malien, AMAME bourses"
    />
    <Navbar />
    <PageHero
      icon={Award}
      label="Financement"
      title="Bourses d'"
      titleHighlight="Étude"
      description="" //Financez vos études à l'étranger. Retrouvez toutes les bourses pour étudiants maliens souhaitant poursuivre un cursus universitaire.
      imageSrc="/images/heroes/hero-bourses.png"
      imageAlt="Bourses d'études pour étudiants maliens"
    />
    <BoursesList defaultCategorie="Bourse d'études" />
    <Footer />
  </div>
);

export default BoursesEtude;
