import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Facebook, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AMAME</span>
            </div>
            <p className="text-sm mb-4">
              Association Malienne d'Appui aux Meilleurs Élèves. Votre partenaire pour l'orientation et les opportunités de bourses d'études.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/search/top?q=amame%20excellence" className="hover:text-emerald-400 transition-colors" title="Visit our Facebook page">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors" title="Visit our Twitter page">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors" title="Visit our LinkedIn page">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/bourses" className="hover:text-emerald-400 transition-colors">
                  Bourses
                </Link>
              </li>
              <li>
                <Link to="/orientation" className="hover:text-emerald-400 transition-colors">
                  Orientation
                </Link>
              </li>
              <li>
                <Link to="/articles" className="hover:text-emerald-400 transition-colors">
                  Actualités
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@amame.ml" className="hover:text-emerald-400 transition-colors">
                  contact@amame.ml
                </a>
              </li>
              {/* <li>
                <Link to="/contact" className="hover:text-emerald-400 transition-colors">
                  Formulaire de contact
                </Link>
              </li> */}
              <li>
                <Link to="/a-propos" className="hover:text-emerald-400 transition-colors">
                  À propos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} AMAME. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;