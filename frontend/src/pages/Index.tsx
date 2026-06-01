import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  BookOpen,
  GraduationCap,
  Award,
  ArrowRight,
  CheckCircle,
  Quote,
} from "lucide-react";

type AnimatedSectionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

const AnimatedSection = ({ children, className = "", delay = 0 }: AnimatedSectionProps) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.06 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const features = [
  {
    title: "Concours & Opportunités",
    description:
      "Informations complètes sur les concours nationaux et internationaux, dates limites, critères d'éligibilité et processus d'inscription.",
    icon: BookOpen,
    link: "/concours",
    accentColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    ctaClass: "bg-blue-600 hover:bg-blue-700",
  },
  {
    title: "Orientation & Filières",
    description:
      "Découvrez les différentes filières disponibles, leurs débouchés professionnels et les opportunités de carrière pour bien choisir votre avenir.",
    icon: GraduationCap,
    link: "/orientation",
    accentColor: "text-amame-green",
    bgColor: "bg-amame-green-subtle",
    borderColor: "border-amame-green/20",
    ctaClass: "bg-amame-green hover:bg-amame-green-dark",
  },
  {
    title: "Bourses d'études",
    description:
      "Accédez aux informations sur les bourses nationales et internationales, les critères d'attribution et les procédures de candidature.",
    icon: Award,
    link: "/bourses",
    accentColor: "text-amame-gold",
    bgColor: "bg-amame-gold-subtle",
    borderColor: "border-amame-gold/20",
    ctaClass: "bg-amame-gold hover:bg-yellow-600",
  },
];

const testimonials = [
  {
    name: "Fatoumata Diallo",
    role: "Étudiante en Médecine",
    content:
      "Grâce à AMAME, j'ai pu décrocher une bourse d'études en France. L'accompagnement personnalisé a été déterminant pour ma réussite.",
    initials: "FD",
    color: "bg-rose-100 text-rose-700",
  },
  {
    name: "Coulibaly Yaya",
    role: "Étudiant en Informatique",
    content:
      "Les ressources et conseils d'orientation m'ont permis de choisir la filière qui me correspond vraiment. Merci AMAME !",
    initials: "CY",
    color: "bg-amame-green-light text-amame-green-dark",
  },
  {
    name: "Aïcha Traoré",
    role: "Étudiante en Droit",
    content:
      "La plateforme m'a fourni toutes les informations nécessaires pour réussir les concours d'entrée en faculté de droit.",
    initials: "AT",
    color: "bg-blue-100 text-blue-700",
  },
];

const whyAmame = [
  "Informations vérifiées et actualisées régulièrement",
  "Service entièrement gratuit et bénévole",
  "Couverture nationale et internationale",
  "Communauté active d'entraide entre étudiants",
];

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO
        title="Accueil"
        description="L'AMAME accompagne bénévolement les élèves et étudiants maliens vers l'excellence : bourses d'études, concours, orientation et ressources académiques. 100% gratuit."
        path="/"
        keywords="AMAME, Mali, bourses études, concours, orientation scolaire, étudiants maliens"
      />
      <Navbar />
      <main className="flex-grow">
        <Hero />

        {/* Features Section */}
        <section className="section-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-14">
              {/* <span className="section-label">Nos services</span> */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-nunito font-black text-amame-charcoal mb-4">
                Tout pour votre{" "}
                <span className="text-amame-green">réussite académique</span>
              </h2>
              {/* <p className="text-base sm:text-lg text-amame-muted max-w-2xl mx-auto leading-relaxed">
                L'AMAME vous aide{" "}
                <span className="font-bold text-amame-charcoal">BÉNÉVOLEMENT</span>{" "}
                à accéder aux informations clés pour exceller dans votre parcours.
              </p> */}
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <AnimatedSection key={index} delay={index * 0.1} className="group">
                    <div className={`h-full bg-white rounded-2xl border-2 ${feature.borderColor} p-7 flex flex-col transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1`}>
                      <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.bgColor} rounded-xl mb-5`}>
                        <Icon className={`h-6 w-6 ${feature.accentColor}`} />
                      </div>
                      <h3 className="font-nunito font-bold text-lg text-amame-charcoal mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-amame-muted leading-relaxed flex-grow mb-6">
                        {feature.description}
                      </p>
                      <Button
                        asChild
                        className={`w-full ${feature.ctaClass} text-white font-semibold rounded-xl transition-all`}
                      >
                        <Link to={feature.link} className="flex items-center justify-center gap-2">
                          Découvrir
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why AMAME Section */}
        <section className="section-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <AnimatedSection>
                {/* <span className="section-label">Pourquoi nous choisir</span> */}
                <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal mb-6 leading-tight">
                  Une association à{" "}
                  <span className="text-amame-green">100% bénévole</span>{" "}
                  pour les étudiants maliens
                </h2>
                {/* <p className="text-amame-muted leading-relaxed mb-8">
                  Fondée en 2023, l'AMAME est née de la conviction que chaque
                  étudiant méritant doit pouvoir accéder aux meilleures opportunités,
                  indépendamment de ses moyens financiers.
                </p> */}
                {/* <ul className="space-y-3 mb-8">
                  {whyAmame.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-amame-green mt-0.5 shrink-0" />
                      <span className="text-amame-slate text-sm">{item}</span>
                    </li>
                  ))}
                </ul> */}
                <Button asChild className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl shadow-green px-7">
                  <Link to="/a-propos" className="flex items-center gap-2">
                    En savoir plus sur l'AMAME
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </AnimatedSection>

              {/* <AnimatedSection delay={0.15}>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "500+", label: "Étudiants accompagnés", color: "bg-amame-green text-white" },
                    { value: "200+", label: "Bourses référencées", color: "bg-amame-gold text-white" },
                    { value: "100+", label: "Concours disponibles", color: "bg-blue-600 text-white" },
                    { value: "100%", label: "Gratuit & bénévole", color: "bg-amame-charcoal text-white" },
                  ].map(({ value, label, color }) => (
                    <div key={label} className={`${color} rounded-2xl p-6 text-center`}>
                      <p className="font-nunito font-black text-3xl mb-1">{value}</p>
                      <p className="text-xs opacity-80 leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </AnimatedSection> */}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="text-center mb-14">
              <span className="section-label">Témoignages</span>
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Ils ont réussi grâce à l'AMAME
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <AnimatedSection key={index} delay={index * 0.1} className="group">
                  <div className="h-full bg-white rounded-2xl border border-amame-border p-6 flex flex-col transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
                    <Quote className="h-6 w-6 text-amame-green/30 mb-4" />
                    <p className="text-sm text-amame-slate leading-relaxed italic flex-grow mb-5">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                      <div className={`h-9 w-9 rounded-full ${testimonial.color} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {testimonial.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-amame-charcoal text-sm">{testimonial.name}</p>
                        <p className="text-xs text-amame-muted">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
