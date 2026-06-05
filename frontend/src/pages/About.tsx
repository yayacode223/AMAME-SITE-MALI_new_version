import { Link } from "react-router-dom";
import { Target, BookOpen, GraduationCap, Eye, Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
const IMG_APROPOS = "/amame-uploads/A-propos";

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
    image: `${IMG_APROPOS}/orientation.png`,
    accentColor: "text-blue-600",
    borderColor: "border-blue-100",
    link: "/orientation",
  },
  {
    icon: GraduationCap,
    title: "Bourses d'Études",
    description: "Accès aux opportunités de financement international",
    features: ["Base de données exhaustive", "Alertes personnalisées", "Aide aux candidatures"],
    image: `${IMG_APROPOS}/bourse.png`,
    accentColor: "text-amame-green",
    borderColor: "border-amame-green/20",
    link: "/bourses",
  },
  {
    icon: Eye,
    title: "Concours & Opportunités",
    description: "Information sur les concours et programmes spéciaux",
    features: ["Calendrier des concours", "Préparation aux épreuves", "Simulations"],
    image: `${IMG_APROPOS}/concours.png`,
    accentColor: "text-amame-gold",
    borderColor: "border-amame-gold/20",
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
            <img src="/images/heroes/hero-about.png" alt=""
              className="w-full h-full object-cover object-center" loading="eager" />
          </div>
          <div className="absolute inset-0 hidden lg:block" aria-hidden="true"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.50) 42%, rgba(0,0,0,0.10) 75%, transparent 100%)" }} />
          <div className="absolute inset-0 lg:hidden" aria-hidden="true"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.22) 100%)" }} />

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 mb-6 shadow-sm">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 shrink-0">
                  <Target className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white font-semibold text-xs tracking-widest uppercase">À propos</span>
              </div>
              <h1 className="font-nunito font-black text-3xl sm:text-5xl lg:text-6xl text-white mb-4 leading-tight">
                À Propos de l'<span className="text-amame-green">AMAME</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed">
                Association Malienne d'Appui aux Meilleurs Élèves — Guidons l'excellence académique vers des horizons illimités.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Présentation ─────────────────────────────────────── */}
        <section className="section-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                <img
                  src={`${IMG_APROPOS}/goal.png`}
                  alt="Notre vision — étudiants AMAME"
                  className="w-full h-80 object-cover object-center"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Services ─────────────────────────────────────────── */}
        <section className="section-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Nos <span className="text-amame-green">Services</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {services.map((s, i) => (
                <motion.div key={s.title} {...fadeUp(i * 0.1)} className="group">
                  <Link to={s.link} className="block h-full">
                    <div className={`bg-white rounded-2xl border-2 ${s.borderColor} overflow-hidden flex flex-col h-full
                                    transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer`}>

                      {/* Image pleine largeur en body */}
                      <div className="relative h-48 overflow-hidden shrink-0">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>

                      {/* Contenu */}
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-nunito font-bold text-lg text-amame-charcoal mb-2">{s.title}</h3>
                        <p className="text-sm text-amame-muted mb-4 leading-relaxed flex-grow">{s.description}</p>
                        <ul className="space-y-2 mb-5">
                          {s.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-sm text-amame-slate">
                              <CheckCircle className="h-3.5 w-3.5 text-amame-green shrink-0" />{f}
                            </li>
                          ))}
                        </ul>
                        <div className={`flex items-center gap-1.5 text-sm font-semibold ${s.accentColor} mt-auto`}>
                          En savoir plus <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ──────────────────────────────────────────── */}
        <section className="section-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="text-center mb-10">
              <span className="section-label">Nous contacter</span>
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Contactez-<span className="text-amame-green">nous</span>
              </h2>
              <p className="text-amame-muted mt-3 max-w-lg mx-auto text-sm">
                Notre équipe de bénévoles est disponible pour répondre à toutes vos questions.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Email */}
              <motion.a
                href="mailto:contact@amame.ml"
                {...fadeUp(0.05)}
                className="group flex flex-col gap-3 bg-white border border-amame-border rounded-2xl p-5
                           hover:border-amame-green/40 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-amame-green-subtle rounded-xl shrink-0">
                  <Mail className="h-5 w-5 text-amame-green" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Email</p>
                  <p className="font-semibold text-amame-charcoal text-sm">contact@amame.ml</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amame-green mt-auto">
                  Écrire <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.a>

              {/* Téléphone */}
              <motion.a
                href="tel:+22369780841"
                {...fadeUp(0.1)}
                className="group flex flex-col gap-3 bg-white border border-amame-border rounded-2xl p-5
                           hover:border-blue-200 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl shrink-0">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Téléphone</p>
                  <p className="font-semibold text-amame-charcoal text-sm">+223 69 78 08 41</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-auto">
                  Appeler <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.a>

              {/* Adresse */}
              <motion.div
                {...fadeUp(0.15)}
                className="flex flex-col gap-3 bg-white border border-amame-border rounded-2xl p-5
                           hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-amame-gold-subtle rounded-xl shrink-0">
                  <MapPin className="h-5 w-5 text-amame-gold" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Adresse</p>
                  <p className="font-semibold text-amame-charcoal text-sm">Dialakorodji</p>
                  <p className="text-xs text-amame-muted">Bamako, Mali</p>
                </div>
              </motion.div>

              {/* Disponibilité */}
              <motion.div
                {...fadeUp(0.2)}
                className="flex flex-col gap-3 bg-white border border-amame-border rounded-2xl p-5
                           hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-xl shrink-0">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-amame-muted mb-1">Disponibilité</p>
                  <p className="font-semibold text-amame-charcoal text-sm">Lun–Dim</p>
                  <p className="text-xs text-amame-muted">24h / 7j</p>
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
