import { Trophy } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import ConcoursListing from "../components/ConcoursListing";

const ConcoursInternational = () => (
  <div className="min-h-screen bg-amame-surface flex flex-col">
    <SEO
      title="Concours Internationaux"
      description="Accédez aux concours et compétitions à l'échelle internationale pour étudiants maliens. Dates, conditions et candidatures sélectionnées par l'AMAME."
      path="/concours/international"
      keywords="concours internationaux Mali, concours étranger malien, compétition internationale étudiant mali, AMAME"
    />
    <Navbar />
    <PageHero
      icon={Trophy}
      label="Concours"
      title="Concours"
      titleHighlight="Internationaux"
      description="" //Accédez aux concours et compétitions à l'échelle internationale. Des opportunités uniques pour les étudiants maliens ambitieux.
      imageSrc="/images/heroes/hero-concours.png"
      imageAlt="Concours internationaux pour étudiants maliens"
    />
    <ConcoursListing defaultStatus="INTERNATIONAL" />
    <Footer />
  </div>
);

export default ConcoursInternational;
