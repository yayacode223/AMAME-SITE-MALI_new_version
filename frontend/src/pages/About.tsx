import { Target, Users, Heart, Award, Globe, Star, BookOpen, Lightbulb, GraduationCap } from "lucide-react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageCircle,
  User,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Users as UsersIcon,
  Trophy,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5 }
};


const services = [
  {
    icon: BookOpen,
    title: "Orientation Scolaire",
    description: "Guidance dans le choix des filières et établissements",
    features: ["Tests d'orientation", "Fiches métiers", "Conseils personnalisés"]
  },
  {
    icon: GraduationCap,
    title: "Bourses d'Études",
    description: "Accès aux opportunités de financement international",
    features: ["Base de données exhaustive", "Alertes personnalisées", "Aide aux candidatures"]
  },
  {
    icon: Eye,
    title: "Concours & Opportunités",
    description: "Information sur les concours et programmes spéciaux",
    features: ["Calendrier des concours", "Préparation aux épreuves", "Simulations"]
  }
];

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Contactez-nous par email",
    value: "contact@amame.ml",
    link: "mailto:contact@amame.ml",
    color: "emerald",
  },
  {
    icon: Phone,
    title: "Téléphone",
    description: "Appelez-nous directement",
    value: "+223 63 29 28 09",
    link: "tel:+22363292809",
    color: "blue",
  },
  {
    icon: MapPin,
    title: "Adresse",
    description: "Siège social",
    value: "Dialakorodji Bamako, Mali",
    link: "#",
    color: "amber",
  },
  {
    icon: Clock,
    title: "Horaires",
    description: "Disponibilité",
    value: "Lun-Dim: 27/7",
    link: "#",
    color: "purple",
  },
];

export function About() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-purple-400 via-blue-500 to-indigo-500 text-white py-12 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Star className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">Association à but non lucratif</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                À Propos de l'
                <span className="text-yellow-300 bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  AMAME
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Association Malienne d'Appui aux Meilleurs Élèves
              </p>
              
              <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
                Guidons l'excellence académique vers des horizons illimités depuis 2023
              </p>
            </motion.div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                <span className="text-purple-600">Presentation</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Fondée en 2023, l'AMAME est une association bénévole dédiée à l'accompagnement 
                des élèves et étudiants maliens dans leur parcours éducatif et professionnel.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 md:p-8 shadow-xl border-0 rounded-2xl bg-gradient-to-br from-white to-purple-50">
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    <strong className="text-purple-600">AMAME</strong> est née de la conviction 
                    profonde que chaque étudiant méritant devrait avoir accès aux meilleures 
                    opportunités éducatives, indépendamment de ses moyens financiers.
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Nous nous engageons à <strong>démocratiser l'accès à l'information</strong> 
                    sur les bourses d'études, concours et orientations, et à accompagner les 
                    étudiants maliens dans leur parcours académique vers l'excellence.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Bénévolat
                    </div>
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Gratuité
                    </div>
                    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Excellence
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                <Card className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-center rounded-2xl border-0">
                  <Globe className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Notre Vision</h3>
                  <p className="text-blue-100 text-sm">
                    Un Mali où chaque étudiant talentueux peut réaliser son plein potentiel académique
                  </p>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-emerald-500 to-green-600 text-white text-center rounded-2xl border-0">
                  <Target className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Notre Mission</h3>
                  <p className="text-emerald-100 text-sm">
                    Accompagner les étudiants vers l'excellence académique par l'information et l'orientation
                  </p>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-center rounded-2xl border-0 col-span-2">
                  <Users className="h-8 w-8 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Notre Impact</h3>
                  <p className="text-amber-100 text-sm">
                    Plus de centaines étudiants accompagnés et de milliers bourses obtenues à travers le monde
                  </p>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-10 lg:py-10 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Nos <span className="text-blue-600">Services</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Des services complets pour accompagner les étudiants à chaque étape de leur parcours
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
            >
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="group"
                >
                  <Card className="p-6 lg:p-8 border-0 shadow-lg rounded-2xl bg-white hover:shadow-2xl transition-all duration-500 h-full group-hover:-translate-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                      <service.icon className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <ul className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3 text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-10 lg:py-10 bg-gradient-to-b from-slate-50 to-blue-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Contactez-<span className="text-blue-600">nous</span>
              </h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                >
                  <Card className="p-6 text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 bg-${method.color}-100 rounded-2xl mb-4 group-hover:bg-${method.color}-200 transition-colors`}
                    >
                      <method.icon
                        className={`h-6 w-6 text-${method.color}-600`}
                      />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {method.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {method.description}
                    </p>
                    {method.link !== "#" ? (
                      <a
                        href={method.link}
                        className={`text-${method.color}-600 hover:text-${method.color}-700 font-medium transition-colors text-sm`}
                      >
                        {method.value}
                      </a>
                    ) : (
                      <p className="text-gray-700 font-medium text-sm whitespace-pre-line">
                        {method.value}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Card className="p-8 md:p-12 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-2xl border-0">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Rejoignez notre communauté
                </h3>
                <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                  Inscrivez-vous pour recevoir les dernières opportunités de bourses et nos conseils d'orientation
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl">
                    S'inscrire maintenant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-xl">
                    En savoir plus
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default About;