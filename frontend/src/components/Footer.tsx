import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Linkedin, Twitter, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { path: "/", label: "Accueil" },
  { path: "/bourses", label: "Bourses d'études" },
  { path: "/concours", label: "Concours" },
  { path: "/orientation", label: "Orientation" },
  { path: "/articles", label: "Actualités" },
  { path: "/a-propos", label: "À Propos" },
];

const contactInfo = [
  { icon: Mail, label: "contact@amame.ml", href: "mailto:contact@amame.ml" },
  { icon: Phone, label: "+223 69 78 08 41", href: "tel:+22369780841" },
  { icon: MapPin, label: "Dialakorodji, Bamako, Mali", href: null },
];

const socialLinks = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/search/top?q=amame%20excellence",
    label: "Facebook",
  },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="bg-amame-green-darker text-white">
      {/* CTA Band — visible uniquement pour les visiteurs non connectés */}
      {!isAuthenticated && (
      <div className="relative overflow-hidden bg-gradient-to-r from-amame-green-dark via-amame-green to-amame-green-dark border-b border-white/10">
        {/* Décorations de fond */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amame-gold/10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

            {/* Texte + icône */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-12 w-12 rounded-xl bg-white/15 items-center justify-center shrink-0">
                <GraduationCap className="h-6 w-6 text-amame-gold" />
              </div>
              <div>
                <p className="font-nunito font-black text-xl sm:text-2xl text-white leading-tight">
                  Association Malienne d'Appui aux Meilleurs Élèves
                </p>
                {/* <p className="text-green-100/80 text-sm mt-1">
                  Accédez gratuitement à toutes nos ressources académiques
                </p> */}
              </div>
            </div>

            {/* Bouton CTA */}
            <Link
              to="/adhesion"
              className="inline-flex items-center gap-2.5 bg-amame-gold hover:bg-amame-gold-light text-amame-green-darker font-bold px-6 py-3 rounded-xl transition-all text-sm shrink-0 shadow-md hover:shadow-lg hover:scale-105"
            >
              Rejoindre AMAME
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        </div>
      </div>
      )}

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <img
                src="/amame-uploads/amame-logo.webp"
                alt="AMAME"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
              />
              <span className="font-nunito font-bold text-xl text-white">AMAME</span>
            </Link>
            {/* <p className="text-green-100/80 text-sm leading-relaxed max-w-sm mb-6">
              L'Association Malienne d'Appui aux Meilleurs Élèves. Nous accompagnons
              bénévolement les étudiants maliens vers l'excellence académique depuis 2023.
            </p> */}

            {/* Social */}
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 hover:bg-amame-gold hover:text-amame-green-darker text-white/70 hover:text-white transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-nunito font-bold text-white text-sm uppercase tracking-wider mb-5">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map(({ path, label }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="text-green-100/70 hover:text-amame-gold-light text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-0 group-hover:w-3 h-0.5 bg-amame-gold-light transition-all duration-200 rounded" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-nunito font-bold text-white text-sm uppercase tracking-wider mb-5">
              Contact
            </h3>
            <ul className="space-y-3.5">
              {contactInfo.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  {href ? (
                    <a
                      href={href}
                      className="flex items-start gap-3 text-green-100/70 hover:text-amame-gold-light text-sm transition-colors"
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-amame-gold/70" />
                      {label}
                    </a>
                  ) : (
                    <div className="flex items-start gap-3 text-green-100/70 text-sm">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-amame-gold/70" />
                      {label}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Badge bénévolat */}
            {/* <div className="mt-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-xs text-green-100/80">
              <GraduationCap className="h-3.5 w-3.5 text-amame-gold" />
              Association 100% bénévole
            </div> */}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-green-100/50">
            <p>© {new Date().getFullYear()} AMAME. Tous droits réservés.</p>
            {/* <p>Association Malienne d'Appui aux Meilleurs Élèves</p> */}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
