import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Composant d'animation amélioré pour mobile
type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  transition?: object;
};

const AnimatedSection = ({
  children,
  className = "",
  transition,
}: AnimatedSectionProps) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.05, // Plus bas pour mobile
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ...transition }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Index = () => {
  const features = [
    {
      title: "Concours & Actualités",
      description:
        "Informations complètes sur les concours nationaux et internationaux, dates limites, critères d'éligibilité et processus d'inscription détaillés.",
      icon: (
        <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl">
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14"
            />
          </svg>
        </div>
      ),
      link: "/concours",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Orientation & Filières",
      description:
        "Découvrez les différentes séries et filières disponibles, leurs débouchés professionnels et les opportunités de carrière.",
      icon: (
        <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      ),
      link: "/orientation",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Bourses d'études",
      description:
        "Accédez aux informations sur les bourses nationales et internationales, les critères d'attribution et les procédures de candidature.",
      icon: (
        <div className="p-2 sm:p-3 bg-amber-100 rounded-lg sm:rounded-xl">
          <svg
            className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      ),
      link: "/bourses",
      gradient: "from-amber-500 to-amber-600",
    },
  ];

  const testimonials = [
    {
      name: "Fatoumata Diallo",
      role: "Étudiante en Médecine",
      content:
        "Grâce à AMAME, j'ai pu décrocher une bourse d'études en France. L'accompagnement personnalisé a été déterminant pour ma réussite.",
      avatar: "👩‍⚕️",
    },
    {
      name: "Coulibaly Yaya",
      role: "Étudiant en Informatique",
      content:
        "Les ressources et conseils d'orientation m'ont permis de choisir la filière qui me correspond vraiment. Merci AMAME !",
      avatar: "👨‍💻",
    },
    {
      name: "Aïcha Traoré",
      role: "Étudiante en Droit",
      content:
        "La plateforme m'a fourni toutes les informations nécessaires pour réussir les concours d'entrée en faculté de droit.",
      avatar: "👩‍⚖️",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
                Tout pour votre{" "}
                <span className="text-blue-600 block sm:inline">
                  réussite académique
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-0 leading-relaxed">
                L'AMAME vous aide{" "}
                <span className="text-amber-600 text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                  BÉNÉVOLEMENT
                </span>{" "}
                à choisir vos filières, accéder à des informations de bourses,
                et des ressources académiques pour exceller.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <AnimatedSection
                  key={index}
                  className="group"
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="bg-white h-full rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-lg sm:hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1 sm:group-hover:-translate-y-2 flex flex-col">
                    <div className="mb-4 sm:mb-6">{feature.icon}</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                    <Button
                      className={`w-full bg-gradient-to-r ${feature.gradient} hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] sm:group-hover:scale-105 text-sm sm:text-base h-10 sm:h-12`}
                      asChild
                    >
                      <Link to={feature.link}>
                        <span>Découvrir</span>
                        <svg
                          className="ml-2 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </Button>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-10 sm:py-12 md:py-16 bg-gradient-to-br from-gray-50 to-blue-50/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-10 sm:mb-12 md:mb-16">
              <h2 className="text-xl sm:text-2xl md:text-3xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-0">
                Quelques témoignages de membres{" "}
                <span className="text-amber-600 block sm:inline">
                  accompagnés par l'AMAME
                </span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {testimonials.map((testimonial, index) => (
                <AnimatedSection
                  key={index}
                  className="group"
                  transition={{ delay: index * 0.15 }}
                >
                  <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 sm:group-hover:-translate-y-2 h-full">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                      {testimonial.avatar}
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 italic mb-4 sm:mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="border-t border-gray-100 pt-3 sm:pt-4">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {testimonial.name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className="py-10 sm:py-12 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-center shadow-lg max-w-4xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                  Prêt à booster votre parcours académique ?
                </h3>
                <p className="text-blue-100 text-sm sm:text-base mb-6 sm:mb-8">
                  Rejoignez l'AMAME dès maintenant et accédez à toutes nos ressources
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold h-11 sm:h-12 text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto"
                    asChild
                  >
                    <Link to="/register">S'inscrire gratuitement</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 h-11 sm:h-12 text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto"
                    asChild
                  >
                    <Link to="/login">Déjà membre ? Se connecter</Link>
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section> */}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
