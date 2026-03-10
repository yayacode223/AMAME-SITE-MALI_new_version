import { motion } from "framer-motion";
import { Award } from "lucide-react";

const BoursesHero = () => {
  return (
    <section className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-purple-800 text-white py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
              <Award className="h-4 w-4 mr-2 text-yellow-300" />
              Opportunités Internationales
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Bourses d'Études
              <span className="block bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                à l'International
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Découvrez des centaines d'opportunités de bourses nationales et
              internationales pour financer votre parcours académique
              d'excellence.
            </p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-400 rounded-3xl mb-6">
                    <Award className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Votre Futur Commence Ici
                  </h3>
                  <p className="text-blue-200">
                    Trouvez la bourse parfaite pour réaliser vos ambitions
                    académiques
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BoursesHero;
