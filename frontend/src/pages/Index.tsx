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

const IMG_BASE = "/amame-uploads/AMAME-IMAGE";

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
    image: `${IMG_BASE}/Concours%26Opportunit%C3%A9s.png`,
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
    image: `${IMG_BASE}/Orientation%26Fili%C3%A8res.png`,
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
    image: `${IMG_BASE}/Boursesd%27%C3%A9tudes.png`,
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
    image: `${IMG_BASE}/Fatoumata(M%C3%A9decine).png`,
    initials: "FD",
    color: "bg-rose-100 text-rose-700",
  },
  {
    name: "Coulibaly Yaya",
    role: "Étudiant en Informatique",
    content:
      "Les ressources et conseils d'orientation m'ont permis de choisir la filière qui me correspond vraiment. Merci AMAME !",
    image: `${IMG_BASE}/Coulibaly(Informatique).png`,
    initials: "CY",
    color: "bg-amame-green-light text-amame-green-dark",
  },
  {
    name: "Aïcha Traoré",
    role: "Étudiante en Droit",
    content:
      "La plateforme m'a fourni toutes les informations nécessaires pour réussir les concours d'entrée en faculté de droit.",
    image: `${IMG_BASE}/A%C3%AFcha(Droit).png`,
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-nunito font-black text-amame-charcoal mb-4">
                Tout pour votre{" "}
                <span className="text-amame-green">réussite académique</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <AnimatedSection key={index} delay={index * 0.1} className="group">
                    <Link to={feature.link} className="block h-full">
                      <div className={`h-full bg-white rounded-2xl border-2 ${feature.borderColor} overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer`}>
                        {/* Image banner */}
                        <div className="relative h-44 overflow-hidden">
                          <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                        {/* Card content */}
                        <div className="p-6 flex flex-col flex-grow">
                          <div className={`inline-flex items-center justify-center w-10 h-10 ${feature.bgColor} rounded-xl mb-4`}>
                            <Icon className={`h-5 w-5 ${feature.accentColor}`} />
                          </div>
                          <h3 className="font-nunito font-bold text-lg text-amame-charcoal mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-amame-muted leading-relaxed flex-grow mb-5">
                            {feature.description}
                          </p>
                          <div className={`mt-auto w-full ${feature.ctaClass} text-white font-semibold rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm transition-all`}>
                            Découvrir
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
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
                <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal mb-6 leading-tight">
                  Une association à{" "}
                  <span className="text-amame-green">100% bénévole</span>{" "}
                  pour les étudiants maliens
                </h2>
                {/* <ul className="space-y-3 mb-8">
                  {whyAmame.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-amame-green shrink-0 mt-0.5" />
                      <span className="text-sm text-amame-slate leading-relaxed">{item}</span>
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

              <AnimatedSection delay={0.2} className="hidden lg:block">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={`${IMG_BASE}/SectionB%C3%A9n%C3%A9volat.png`}
                    alt="Bénévoles AMAME"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amame-green/30 to-transparent" />
                </div>
              </AnimatedSection>
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
                  <div className="h-full bg-white rounded-2xl border border-amame-border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">

                    {/* ── Body : photo pleine largeur ── */}
                    <div className="relative h-52 overflow-hidden bg-amame-green-subtle shrink-0">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      {/* Fallback initiales si l'image échoue */}
                      <div
                        className={`absolute inset-0 ${testimonial.color} items-center justify-center text-4xl font-black`}
                        style={{ display: "none" }}
                      >
                        {testimonial.initials}
                      </div>
                      {/* Fondu bas pour transition douce vers le corps de carte */}
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                    </div>

                    {/* ── Body : citation ── */}
                    <div className="px-5 pt-4 pb-3 flex flex-col flex-grow">
                      <Quote className="h-5 w-5 text-amame-green/35 mb-3 shrink-0" />
                      <p className="text-sm text-amame-slate leading-relaxed italic flex-grow">
                        "{testimonial.content}"
                      </p>
                    </div>

                    {/* ── Footer : identité ── */}
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                      <p className="font-semibold text-amame-charcoal text-sm">{testimonial.name}</p>
                      <p className="text-xs text-amame-muted">{testimonial.role}</p>
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
