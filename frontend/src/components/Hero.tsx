import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Star,
  Trophy,
  Users,
  BookOpen,
  Award,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Hero = () => {
  const { isAuthenticated, user, logout, isLoggingOut, isUserLoading } =
    useAuth();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-400 to-purple-700"></div>

      {/* Animated Background Elements - Réduit sur mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl sm:blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl sm:blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-xl sm:blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Floating Elements - Masqué sur très petits écrans */}
      <div className="hidden sm:block absolute top-10 sm:top-20 left-5 sm:left-10 animate-float">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20">
          <Trophy className="h-5 w-5 sm:h-8 sm:w-8 text-yellow-200" />
        </div>
      </div>
      <div className="hidden sm:block absolute top-20 sm:top-40 right-5 sm:right-20 animate-float delay-1000">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20">
          <BookOpen className="h-5 w-5 sm:h-8 sm:w-8 text-green-300" />
        </div>
      </div>
      <div className="hidden sm:block absolute bottom-20 sm:bottom-40 left-5 sm:left-20 animate-float delay-1500">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20">
          <GraduationCap className="h-5 w-5 sm:h-8 sm:w-8 text-blue-300" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 sm:gap-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Text Content */}
            <motion.div
              className="w-full lg:w-1/2 text-center lg:text-left mt-8 lg:mt-0"
              variants={itemVariants}
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-medium mb-4 sm:mb-6"
              >
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-yellow-300" />
                Excellence Académique depuis 2023
              </motion.div>

              <motion.h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-snug sm:leading-tight"
                variants={itemVariants}
              >
                Votre Passage Vers
                <span className="block bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent mt-1 sm:mt-2">
                  l'Excellence
                </span>
              </motion.h1>

              <motion.p
                className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                variants={itemVariants}
              >
                L'Association Malienne d'Appui aux Meilleurs Élèves vous
                accompagne vers la réussite académique grâce à des ressources,
                des bourses et des conseils.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12"
                variants={itemVariants}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
                  asChild
                >
                  <Link
                    to="/bourses"
                    className="flex items-center justify-center"
                  >
                    Bourses disponibles
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                {!isAuthenticated && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-blue-500 hover:bg-white/10 font-semibold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto mt-2 sm:mt-0"
                    asChild
                  >
                    <Link
                      to="/register"
                      className="flex items-center justify-center"
                    >
                      <Award className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      S'inscrire gratuitement
                    </Link>
                  </Button>
                )}
              </motion.div>
            </motion.div>

            {/* Image/Illustration */}
            <motion.div
              className="w-full lg:w-1/2 flex justify-center"
              variants={itemVariants}
            >
              <div className="relative">
                {/* Main Logo Container */}
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-xl sm:blur-2xl md:blur-3xl opacity-30 animate-pulse"></div>
                  <img
                    src="/amame-uploads/amame-logo.webp"
                    alt="AMAME - Association Malienne d'Appui aux Meilleurs Élèves"
                    className="relative z-20 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full object-cover shadow-lg sm:shadow-xl"
                  />
                </div>

                {/* Decorative Elements - Réduits sur mobile */}
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-24 sm:h-24 bg-yellow-400 rounded-full mix-blend-multiply filter blur-lg sm:blur-xl opacity-70 animate-bounce"></div>
                <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-16 h-16 sm:w-32 sm:h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-lg sm:blur-xl opacity-70 animate-bounce delay-1000"></div>

                {/* Floating Badges - Masqués sur mobile */}
                <div className="hidden sm:block absolute -top-4 sm:-top-8 -left-4 sm:-left-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20 animate-float">
                  <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-300" />
                </div>
                <div className="hidden sm:block absolute -bottom-4 sm:-bottom-8 -right-4 sm:-right-8 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/20 animate-float delay-1500">
                  <Award className="h-4 w-4 sm:h-6 sm:w-6 text-green-300" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @media (min-width: 640px) {
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
