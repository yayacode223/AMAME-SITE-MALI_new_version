
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilieresHero from '../components/filieres/FilieresHero';
import FilieresContent from '../components/filieres/FilieresContent';
// import { useFilieres } from '../hooks/useFilieres';
// import { secondaryFilieres, superiorFilieres } from '../data/filieresData';
import { useGetEtablissement } from '@/service/etablissementService';

const Filieres = () => {
  // Fetch real filières from Supabase using our custom hook
//   const { data: filieres, isLoading } = useFilieres();
  const {data: etablissements, isLoading: dataIsLoading} = useGetEtablissement(); 

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <FilieresHero 
          title="Séries et Filières"
          description="Explorez les différentes séries du secondaire et filières de l'enseignement supérieur disponibles au Mali et à l'international. Découvrez les matières, les débouchés et les opportunités associés à chaque parcours."
        />

        {/* Main Content */}
        <FilieresContent 
          isLoading={dataIsLoading}
          etablissement={etablissements}
          secondaryFilieres={etablissements}
          superiorFilieres={etablissements}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Filieres;
