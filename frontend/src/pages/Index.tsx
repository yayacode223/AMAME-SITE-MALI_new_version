import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Index = () => {
  
  const stats = [
    { number: '100+', label: 'Concours référencés' },
    { number: '50+', label: 'Bourses disponibles' },
    { number: '1000+', label: 'Étudiants accompagnés' },
    { number: '20+', label: 'Séries et filières détaillées' }
  ];

  const features = [
    {
      title: 'Concours',
      description: 'Informations sur les concours nationaux et internationaux, dates, critères, et processus d\'inscription.',
      icon: (
        <svg className="h-10 w-10 text-amame-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
        </svg>
      ),
      link: '/concours'
    },
    {
      title: 'Séries et Filières',
      description: 'Découvrez les différentes séries et filières disponibles, leurs matières, débouchés et opportunités.',
      icon: (
        <svg className="h-10 w-10 text-amame-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      link: '/filieres'
    },
    {
      title: 'Bourses d\'études',
      description: 'Accédez aux informations sur les bourses nationales et internationales, les critères et les procédures.',
      icon: (
        <svg className="h-10 w-10 text-amame-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      link: '/bourses'
    },
    {
      title: 'Ressources',
      description: 'Téléchargez des supports de concours, des lettres de motivation, des formulaires et bien plus.',
      icon: (
        <svg className="h-10 w-10 text-amame-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      link: '/ressources'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero />

        {/* Stats Section */}
        <section className="bg-slate-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center p-6 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <p className="text-3xl md:text-4xl font-bold text-amame-blue mb-2">{stat.number}</p>
                  <p className="text-gray-600 text-sm md:text-base text-center">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                L'AMAME vous accompagne tout au long de votre parcours académique avec des services adaptés à vos besoins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center card-hover">
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <Button className="mt-auto" variant="outline" asChild>
                    <Link to={feature.link}>
                      En savoir plus
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-amame-blue to-blue-900 py-16">
          <div className="container mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à commencer votre parcours vers l'excellence ?</h2>
            <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
              Rejoignez l'Association Malienne d'Appui aux Meilleurs Élèves dès aujourd'hui et bénéficiez de notre accompagnement pour atteindre vos objectifs académiques.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-amame-blue hover:bg-white/90" asChild>
                <Link to="/auth">
                  Créer un compte
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="border-white text-white hover:bg-white/10">
                En savoir plus sur l'AMAME
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
