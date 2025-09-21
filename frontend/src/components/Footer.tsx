
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/lovable-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png" 
                alt="AMAME Logo" 
                className="h-12 w-12 rounded-full"
              />
              <span className="font-nunito font-bold text-xl">AMAME</span>
            </div>
            <p className="text-slate-300 mb-4">
              L'Association Malienne d'Appui aux Meilleurs Élèves (AMAME) soutient les élèves et étudiants maliens en leur offrant accès aux informations essentielles sur les concours, les bourses d'études, et des ressources éducatives.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-amame-lightblue">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-amame-lightblue">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 9.99 9.99 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-amame-lightblue">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.995 16.979H7.078v-8.99h9.917v8.99zm0-9.982h-6.38V4.979h6.38v2.018z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 font-nunito">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/concours" className="text-slate-300 hover:text-white transition-colors">
                  Concours
                </Link>
              </li>
              <li>
                <Link to="/filieres" className="text-slate-300 hover:text-white transition-colors">
                  Séries et Filières
                </Link>
              </li>
              <li>
                <Link to="/bourses" className="text-slate-300 hover:text-white transition-colors">
                  Bourses d'études
                </Link>
              </li>
              <li>
                <Link to="/ressources" className="text-slate-300 hover:text-white transition-colors">
                  Ressources
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 font-nunito">Contact</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center space-x-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>Bamako, Mali</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>contact@amame.org</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>+223 63 28 29 09</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-slate-950 py-4 text-center text-slate-300 text-sm">
        <p>&copy; {new Date().getFullYear()} AMAME - Association Malienne d'Appui aux Meilleurs Élèves. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;
