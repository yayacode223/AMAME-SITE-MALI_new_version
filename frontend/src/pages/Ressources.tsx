
// import React from 'react';
// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';
// import RessourcesHero from '../components/ressources/RessourcesHero';
// import RessourcesSearch from '../components/ressources/RessourcesSearch';
// import RessourcesContent from '../components/ressources/RessourcesContent';
// import { useRessources } from '../hooks/useRessources';

// const Ressources = () => {
//   const {
//     searchTerm,
//     setSearchTerm,
//     selectedCategory,
//     setSelectedCategory,
//     categories,
//     filteredResources,
//     isLoading
//   } = useRessources();

//   return (
//     <div className="flex flex-col min-h-screen">
//       <Navbar />
//       <main className="flex-grow">
//         <RessourcesHero />
//         <RessourcesSearch
//           searchTerm={searchTerm}
//           setSearchTerm={setSearchTerm}
//           selectedCategory={selectedCategory}
//           setSelectedCategory={setSelectedCategory}
//           categories={categories}
//         />
//         <RessourcesContent
//           isLoading={isLoading}
//           filteredResources={filteredResources}
//         />
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default Ressources;
