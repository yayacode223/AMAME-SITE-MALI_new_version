import { Link } from "react-router-dom";
import StaticImage from "@/components/StaticImage";
import { Target, BookOpen, GraduationCap, Eye, Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  viewport: { once: true },
});

const services = [
  {
    icon: BookOpen,
    title: "Orientation Scolaire",
    description: "Guidance dans le choix des filières et établissements",
    features: ["Tests d'orientation", "Fiches métiers", "Conseils personnalisés"],
    image: "about/orientation" as const,
    actionColor: "text-amame-green-dark",
    titleHover: "group-hover:text-amame-green-dark",
    link: "/orientation",
  },
  {
    icon: GraduationCap,
    title: "Bourses d'Études",
    description: "Accès aux opportunités de financement international",
    features: ["Base de données exhaustive", "Alertes personnalisées", "Aide aux candidatures"],
    image: "about/bourse" as const,
    actionColor: "text-amber-700",
    titleHover: "group-hover:text-amber-700",
    link: "/bourses",
  },
  {
    icon: Eye,
    title: "Concours & Opportunités",
    description: "Information sur les concours et programmes spéciaux",
    features: ["Calendrier des concours", "Préparation aux épreuves", "Simulations"],
    image: "about/concours" as const,
    actionColor: "text-blue-600",
    titleHover: "group-hover:text-blue-600",
    link: "/concours",
  },
];

const values = [
  { icon: CheckCircle, label: "Bénévolat" },
  { icon: CheckCircle, label: "Gratuité totale" },
  { icon: CheckCircle, label: "Excellence" },
  { icon: CheckCircle, label: "Accessibilité" },
];

export function About() {
  return (
    <>
      <SEO
        title="À Propos de l'AMAME"
        description="Découvrez l'AMAME, association malienne bénévole fondée en 2023. Notre mission : démocratiser l'accès à l'information académique pour tous les étudiants maliens."
        path="/a-propos"
        keywords="AMAME association Mali, mission AMAME, bénévolat Mali, association étudiants maliens"
      />
      <Navbar />
      <div className="min-h-screen bg-white flex flex-col">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-amame-border
                            min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex items-center
                            py-14 lg:py-20">
          <div className="absolute inset-0" aria-hidden="true">
            <StaticImage name="heroes/hero-about" sizes="100vw" priority
              className="w-full h-full object-cover object-center" />
          </div>
          {/* Même voile et mêmes couleurs que PageHero (docs/06, E9) */}
          <div className="absolute inset-0 amame-hero-scrim" aria-hidden="true" />

          <div className="relative z-10 page-container">
            <motion.div {...fadeUp()} className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 bg-amame-green-dark border border-white/20 rounded-full px-4 py-2 mb-6 shadow-sm">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 shrink-0">
                  <Target className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white font-semibold text-xs tracking-widest uppercase">À propos</span>
              </div>
              <h1 className="font-nunito font-black text-3xl sm:text-5xl lg:text-6xl text-white mb-4 leading-tight">
                À Propos de l'<span className="text-green-300">AMAME</span>
              </h1>
              <p className="text-base sm:text-lg text-white max-w-xl leading-relaxed">
                Association Malienne d'Appui aux Meilleurs Élèves — Guidons l'excellence académique vers des horizons illimités.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Présentation ─────────────────────────────────────── */}
        <section className="section-white">
          <div className="page-container">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp()}>
                <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal mb-5 leading-tight">
                  Nés pour <span className="text-amame-green">démocratiser</span> l'accès à l'information
                </h2>
                <p className="text-amame-slate leading-relaxed mb-6">
                  Fondée en 2023, l'AMAME est née de la conviction profonde que chaque étudiant méritant devrait avoir accès aux meilleures opportunités éducatives,{" "}
                  <strong>indépendamment de ses moyens financiers</strong>.
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 bg-amame-green-subtle text-amame-green-dark border border-amame-green/20 px-3 py-1.5 rounded-full text-sm font-medium">
                      <Icon className="h-3.5 w-3.5" />{label}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.15)} className="rounded-2xl overflow-hidden shadow-xl border border-amame-border">
                <StaticImage
                  name="about/goal"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  alt="Notre vision — étudiants AMAME"
                  className="w-full h-80 object-cover object-center"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Services ─────────────────────────────────────────── */}
        <section className="section-subtle">
          <div className="page-container">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Nos <span className="text-amame-green">Services</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
              {services.map((s, i) => (
                <motion.div key={s.title} {...fadeUp(i * 0.1)}>
                  {/* Carte .amame-card (index.css), toute la carte est un lien */}
                  <Link to={s.link} className="amame-card amame-card-interactive group">
                    <div className="amame-card-media">
                      <StaticImage
                        name={s.image}
                        sizes="(min-width: 768px) 33vw, 100vw"
                        alt={s.title}
                        className="amame-card-img"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    <div className="amame-card-body">
                      <h3 className={`amame-card-title ${s.titleHover}`}>{s.title}</h3>
                      <p className="amame-card-text line-clamp-none mt-2">{s.description}</p>
                      <ul className="space-y-2 mt-4">
                        {s.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm text-amame-slate">
                            <CheckCircle className="h-3.5 w-3.5 text-amame-green shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="amame-card-footer justify-end">
                      <span className={`amame-card-action ${s.actionColor} group-hover:gap-1.5`}>
                        En savoir plus <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ──────────────────────────────────────────── */}
        <section className="section-white">
          <div className="page-container">
            <motion.div {...fadeUp()} className="text-center mb-10">
              <span className="section-label">Nous contacter</span>
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Contactez-<span className="text-amame-green">nous</span>
              </h2>
              <p className="text-amame-muted mt-3 max-w-lg mx-auto text-sm">
                Notre équipe de bénévoles est disponible pour répondre à toutes vos questions.
              </p>
            </motion.div>

            {/* Cartes .amame-card sans média. L'e-mail et le téléphone sont des liens (soulèvement,
                anneau de focus) ; l'adresse et la disponibilité ne bougent pas. L'animation d'entrée
                est sur l'enveloppe : framer-motion laisse un transform en ligne qui annulerait le
                soulèvement s'il était posé sur la carte elle-même. */}
            <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">

              {/* Email */}
              <motion.div {...fadeUp(0.05)}>
                <a href="mailto:contact@amame.ml" className="amame-card amame-card-interactive group gap-3 p-5">
                  <div className="flex items-center justify-center w-10 h-10 bg-amame-green-subtle rounded-xl shrink-0">
                    <Mail className="h-5 w-5 text-amame-green" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Email</p>
                    <p className="font-semibold text-amame-charcoal text-sm">contact@amame.ml</p>
                  </div>
                  <span className="amame-card-action mt-auto text-amame-green-dark group-hover:gap-1.5">
                    Écrire <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              </motion.div>

              {/* Téléphone */}
              <motion.div {...fadeUp(0.1)}>
                <a href="tel:+22369780841" className="amame-card amame-card-interactive group gap-3 p-5">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl shrink-0">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Téléphone</p>
                    <p className="font-semibold text-amame-charcoal text-sm">+223 69 78 08 41</p>
                  </div>
                  <span className="amame-card-action mt-auto text-blue-600 group-hover:gap-1.5">
                    Appeler <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              </motion.div>

              {/* Adresse */}
              <motion.div {...fadeUp(0.15)}>
                <div className="amame-card gap-3 p-5">
                  <div className="flex items-center justify-center w-10 h-10 bg-amame-gold-subtle rounded-xl shrink-0">
                    <MapPin className="h-5 w-5 text-amame-gold" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Adresse</p>
                    <p className="font-semibold text-amame-charcoal text-sm">Au Lycée Bouillagui FADIGA</p>
                    <p className="text-xs text-amame-muted">Commune II du District de Bamako</p>
                  </div>
                </div>
              </motion.div>

              {/* Disponibilité */}
              <motion.div {...fadeUp(0.2)}>
                <div className="amame-card gap-3 p-5">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-xl shrink-0">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Disponibilité</p>
                    <p className="font-semibold text-amame-charcoal text-sm">Lun–Dim</p>
                    <p className="text-xs text-amame-muted">24h / 7j</p>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}

export default About;
