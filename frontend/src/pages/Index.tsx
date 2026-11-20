import SEO from "../components/SEO";
import StaticImage from "@/components/StaticImage";
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
    image: "home/concours-opportunites" as const,
    accentColor: "text-blue-600",
    bgColor: "bg-blue-50",
    action: "Voir les concours",
    actionColor: "text-blue-600",
    titleHover: "group-hover:text-blue-600",
  },
  {
    title: "Orientation & Filières",
    description:
      "Découvrez les différentes filières disponibles, leurs débouchés professionnels et les opportunités de carrière pour bien choisir votre avenir.",
    icon: GraduationCap,
    link: "/orientation",
    image: "home/orientation-filieres" as const,
    accentColor: "text-amame-green",
    bgColor: "bg-amame-green-subtle",
    action: "Voir les filières",
    actionColor: "text-amame-green-dark",
    titleHover: "group-hover:text-amame-green-dark",
  },
  {
    title: "Bourses d'études",
    description:
      "Accédez aux informations sur les bourses nationales et internationales, les critères d'attribution et les procédures de candidature.",
    icon: Award,
    link: "/bourses",
    image: "home/bourses-etudes" as const,
    accentColor: "text-amame-gold",
    bgColor: "bg-amame-gold-subtle",
    action: "Voir les bourses",
    actionColor: "text-amber-700",
    titleHover: "group-hover:text-amber-700",
  },
];

const testimonials = [
  {
    name: "Fatoumata Diallo",
    role: "Étudiante en Médecine",
    content:
      "Grâce à AMAME, j'ai pu décrocher une bourse d'études en France. L'accompagnement personnalisé a été déterminant pour ma réussite.",
    image: "home/temoignage-fatoumata" as const,
    initials: "FD",
    color: "bg-rose-100 text-rose-700",
  },
  {
    name: "Coulibaly Yaya",
    role: "Étudiant en Informatique",
    content:
      "Les ressources et conseils d'orientation m'ont permis de choisir la filière qui me correspond vraiment. Merci AMAME !",
    image: "home/temoignage-coulibaly" as const,
    initials: "CY",
    color: "bg-amame-green-light text-amame-green-dark",
  },
  {
    name: "Aïcha Traoré",
    role: "Étudiante en Droit",
    content:
      "La plateforme m'a fourni toutes les informations nécessaires pour réussir les concours d'entrée en faculté de droit.",
    image: "home/temoignage-aicha" as const,
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
          <div className="page-container">
            <AnimatedSection className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-nunito font-black text-amame-charcoal mb-4">
                Tout pour votre{" "}
                <span className="text-amame-green">réussite académique</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <AnimatedSection key={index} delay={index * 0.1}>
                    {/* Carte .amame-card (index.css), toute la carte est un lien */}
                    <Link to={feature.link} className="amame-card amame-card-interactive group">
                      <div className="amame-card-media">
                        <StaticImage
                          name={feature.image}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          alt={feature.title}
                          className="amame-card-img"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <div className="amame-card-body">
                        <div className={`inline-flex items-center justify-center w-10 h-10 ${feature.bgColor} rounded-xl mb-4`}>
                          <Icon className={`h-5 w-5 ${feature.accentColor}`} />
                        </div>
                        <h3 className={`amame-card-title ${feature.titleHover}`}>{feature.title}</h3>
                        <p className="amame-card-text line-clamp-none mt-2">{feature.description}</p>
                      </div>
                      <div className="amame-card-footer justify-end">
                        <span className={`amame-card-action ${feature.actionColor} group-hover:gap-1.5`}>
                          {feature.action} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
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
          <div className="page-container">
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
                  <StaticImage
                    name="home/section-benevolat"
                    sizes="(min-width: 1024px) 50vw, 100vw"
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
          <div className="page-container">
            <AnimatedSection className="text-center mb-14">
              <span className="section-label">Témoignages</span>
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Ils ont réussi grâce à l'AMAME
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <AnimatedSection key={index} delay={index * 0.1}>
                  {/* Carte .amame-card (index.css), média portrait. Elle n'est pas un lien : pas de
                      soulèvement au survol. */}
                  <div className="amame-card">

                    {/* ── Média : photo ── */}
                    <div className="amame-card-media amame-card-media-portrait">
                      <StaticImage
                        name={testimonial.image}
                        sizes="(min-width: 768px) 33vw, 100vw"
                        alt={testimonial.name}
                        className="h-full w-full object-cover object-top"
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

                    {/* ── Corps : citation ── */}
                    <div className="amame-card-body">
                      <Quote className="h-5 w-5 text-amame-green/35 mb-3 shrink-0" />
                      <p className="text-sm text-amame-slate leading-relaxed italic">
                        "{testimonial.content}"
                      </p>
                    </div>

                    {/* ── Pied : identité ── */}
                    <div className="amame-card-footer">
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
