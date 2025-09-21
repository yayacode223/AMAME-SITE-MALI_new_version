import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BoursesHero from '../components/bourses/BoursesHero';
import BoursesSearch from '../components/bourses/BoursesSearch';
import BoursesContent from '../components/bourses/BoursesContent';
import { useBourses } from '../hooks/useBourses';

const Bourses = () => {
  const { 
    isBourseDataLoading, 
    filter, 
    setFilter, 
    searchTerm, 
    setSearchTerm, 
    filteredBourses 
  } = useBourses();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <BoursesHero />
        <BoursesSearch 
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <BoursesContent 
          isLoading={isBourseDataLoading} 
          filteredBourses={filteredBourses} 
        />
      </main>
      <Footer />
    </div>
  );
};

export default Bourses;
