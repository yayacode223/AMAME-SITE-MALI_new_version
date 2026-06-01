import { Link } from "react-router-dom";
import { Target, Users, Globe, BookOpen, GraduationCap, Eye, Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "@/context/AuthContext";

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
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: GraduationCap,
    title: "Bourses d'Études",
    description: "Accès aux opportunités de financement international",
    features: ["Base de données exhaustive", "Alertes personnalisées", "Aide aux candidatures"],
    color: "bg-amame-green-subtle text-amame-green",
  },
  {
    icon: Eye,
    title: "Concours & Opportunités",
    description: "Information sur les concours et programmes spéciaux",
    features: ["Calendrier des concours", "Préparation aux épreuves", "Simulations"],
    color: "bg-amame-gold-subtle text-amame-gold",
  },
];

const contactMethods = [
  { icon: Mail, title: "Email", value: "contact@amame.ml", href: "mailto:contact@amame.ml", cls: "bg-amame-green-subtle text-amame-green" },
  { icon: Phone, title: "Téléphone", value: "+223 69 78 08 41", href: "tel:+22369780841", cls: "bg-blue-50 text-blue-600" },
  { icon: MapPin, title: "Adresse", value: "Dialakorodji, Bamako, Mali", href: null, cls: "bg-amame-gold-subtle text-amame-gold" },
  { icon: Clock, title: "Disponibilité", value: "Lun–Dim : 24h/7j", href: null, cls: "bg-purple-50 text-purple-600" },
];

const values = [
  { icon: CheckCircle, label: "Bénévolat" },
  { icon: CheckCircle, label: "Gratuité totale" },
  { icon: CheckCircle, label: "Excellence" },
  { icon: CheckCircle, label: "Accessibilité" },
];

export function About() {
  const { isAuthenticated } = useAuth();

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

        {/* Hero */}
        <section
          className="relative overflow-hidden border-b border-amame-border py-14 lg:py-20"
          style={{
            backgroundImage: "url(/images/heroes/hero-about.png)",
            backgroundSize: "cover",
            backgroundPosition: "center right 20%",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-white from-25% via-white/90 to-white/30 lg:to-white/10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/50 pointer-events-none" />
          <div className="absolute inset-0 bg-white/65 lg:hidden pointer-events-none" />

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="max-w-2xl">
              {/* Badge */}
              {/* <div className="inline-flex items-center gap-2 bg-white/75 backdrop-blur-sm border border-amame-green/25 rounded-full px-4 py-2 text-sm font-semibold mb-6 shadow-sm">
                <Star className="h-3.5 w-3.5 text-amame-gold fill-amame-gold" />
                <span className="text-amame-green-dark">Association à but non lucratif depuis 2023</span>
              </div> */}
              <h1 className="font-nunito font-black text-3xl sm:text-5xl lg:text-6xl text-amame-charcoal mb-4 leading-tight">
                À Propos de l'<span className="text-amame-green">AMAME</span>
              </h1>
              {/* <p className="text-base sm:text-lg text-amame-slate max-w-xl leading-relaxed">
                Association Malienne d'Appui aux Meilleurs Élèves — Guidons l'excellence académique vers des horizons illimités
              </p> */}
            </motion.div>
          </div>
        </section>


        {/* Présentation */}
        <section className="section-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp()}>
                {/* <span className="section-label">Notre histoire</span> */}
                <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal mb-5 leading-tight">
                  Nés pour <span className="text-amame-green">démocratiser</span> l'accès à l'information
                </h2>
                <p className="text-amame-slate leading-relaxed mb-5">
                  Fondée en 2023, l'AMAME est née de la conviction profonde que chaque étudiant méritant devrait avoir accès aux meilleures opportunités éducatives, <strong>indépendamment de ses moyens financiers</strong>.
                </p>
                {/* <p className="text-amame-slate leading-relaxed mb-6">
                  Nous nous engageons à démocratiser l'accès à l'information sur les bourses d'études, concours et orientations, et à accompagner les étudiants maliens dans leur parcours académique vers l'excellence.
                </p> */}
                <div className="flex flex-wrap gap-2">
                  {values.map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 bg-amame-green-subtle text-amame-green-dark border border-amame-green/20 px-3 py-1.5 rounded-full text-sm font-medium">
                      <Icon className="h-3.5 w-3.5" />{label}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.15)} className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, title: "Notre Vision", text: "Un Mali où chaque étudiant talentueux peut réaliser son plein potentiel académique", cls: "bg-blue-600 text-white" },
                  { icon: Target, title: "Notre Mission", text: "Accompagner les étudiants vers l'excellence par l'information et l'orientation", cls: "bg-amame-green text-white" },
                  { icon: Users, title: "Notre Impact", text: "Plusieurs centaines d'étudiants accompagnés, plusieurs milliers de bourses obtenues", cls: "col-span-2 bg-amame-gold text-white" },
                ].map(({ icon: Icon, title, text, cls }) => (
                  <div key={title} className={`${cls} rounded-2xl p-6 text-center`}>
                    <Icon className="h-7 w-7 mx-auto mb-3 opacity-90" />
                    <h3 className="font-nunito font-bold text-base mb-2">{title}</h3>
                    <p className="text-sm opacity-85 leading-relaxed">{text}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="section-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="text-center mb-12">
              {/* <span className="section-label">Ce que nous faisons</span> */}
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Nos <span className="text-amame-green">Services</span>
              </h2>
              {/* <p className="text-amame-muted mt-3 max-w-xl mx-auto">Des services complets pour accompagner les étudiants à chaque étape de leur parcours</p> */}
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {services.map((s, i) => (
                <motion.div key={s.title} {...fadeUp(i * 0.1)}>
                  <div className="bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-6 h-full">
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${s.color} rounded-xl mb-5`}>
                      <s.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-nunito font-bold text-lg text-amame-charcoal mb-2">{s.title}</h3>
                    <p className="text-sm text-amame-muted mb-4 leading-relaxed">{s.description}</p>
                    <ul className="space-y-2">
                      {s.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-amame-slate">
                          <CheckCircle className="h-3.5 w-3.5 text-amame-green shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="section-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <span className="section-label">Nous contacter</span>
              <h2 className="text-3xl sm:text-4xl font-nunito font-black text-amame-charcoal">
                Contactez-<span className="text-amame-green">nous</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              {contactMethods.map(({ icon: Icon, title, value, href, cls }, i) => (
                <motion.div key={title} {...fadeUp(i * 0.1)}>
                  <div className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-5 text-center">
                    <div className={`inline-flex items-center justify-center w-11 h-11 ${cls} rounded-xl mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-amame-charcoal text-sm mb-1">{title}</h3>
                    {href ? (
                      <a href={href} className="text-amame-green hover:text-amame-green-dark text-xs font-medium transition-colors">{value}</a>
                    ) : (
                      <p className="text-amame-slate text-xs">{value}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            {/* {!isAuthenticated && (
              <motion.div {...fadeUp(0.2)} className="max-w-3xl mx-auto">
                <div className="bg-gradient-to-br from-amame-green to-amame-green-dark rounded-2xl p-8 lg:p-12 text-center text-white">
                  <h3 className="font-nunito font-black text-2xl sm:text-3xl mb-3">Rejoignez notre communauté</h3>
                  <p className="text-green-100 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
                    Inscrivez-vous pour recevoir les dernières opportunités de bourses et nos conseils d'orientation — gratuitement.
                  </p>
                  <Button asChild className="bg-amame-gold hover:bg-yellow-600 text-amame-green-darker font-semibold px-8 py-3 rounded-xl gap-2">
                    <Link to="/adhesion">
                      Rejoindre AMAME
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )} */}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default About;
