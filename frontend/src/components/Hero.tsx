import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Star, 
  Trophy, 
  Users, 
  BookOpen,
  Award,
  GraduationCap
} from 'lucide-react';

const Hero = () => {
  // const stats = [
  //   { number: '500+', label: 'Bourses disponibles', icon: Award },
  //   { number: '1000+', label: 'Étudiants accompagnés', icon: Users },
  //   { number: '50+', label: 'Concours actifs', icon: Trophy },
  //   { number: '99%', label: 'Taux de satisfaction', icon: Star },
  // ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-400 to-purple-700"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <Trophy className="h-8 w-8 text-yellow-200" />
        </div>
      </div>
      <div className="absolute top-40 right-20 animate-float delay-1000">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <BookOpen className="h-8 w-8 text-green-300" />
        </div>
      </div>
      <div className="absolute bottom-40 left-20 animate-float delay-1500">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <GraduationCap className="h-8 w-8 text-blue-300" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="flex flex-col lg:flex-row items-center justify-between gap-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Text Content */}
            <motion.div 
              className="lg:w-1/2 text-center lg:text-left"
              variants={itemVariants}
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6"
              >
                <Star className="h-4 w-4 mr-2 text-yellow-300" />
                Excellence Académique depuis 2023
              </motion.div>

              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight"
                variants={itemVariants}
              >
                Votre Passage Vers 
                <span className="block bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  l'Excellence
                </span>
              </motion.h1>

              <motion.p 
                className="text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed max-w-2xl"
                variants={itemVariants}
              >
                L'Association Malienne d'Appui aux Meilleurs Élèves vous accompagne vers la réussite académique grâce à des ressources, des bourses et des conseils.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 mb-12"
                variants={itemVariants}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  asChild
                >
                  <Link to="/bourses" className="flex items-center">
                    Bourses disponibles
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                {/* <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1"
                  asChild
                >
                  <Link to="/bourses" className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Explorer les Bourses
                  </Link>
                </Button> */}
              </motion.div>

              {/* Stats */}
              {/* <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
                variants={itemVariants}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                      <stat.icon className="h-5 w-5 text-yellow-300" />
                      <p className="text-2xl md:text-3xl font-bold text-white">
                        {stat.number}
                      </p>
                    </div>
                    <p className="text-sm text-blue-200 font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </motion.div> */}
            </motion.div>

            {/* Image/Illustration */}
            <motion.div 
              className="lg:w-1/2 flex justify-center"
              variants={itemVariants}
            >
              <div className="relative">
                {/* Main Logo Container */}
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                  <img 
                    src="/amame-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png" 
                    alt="AMAME - Association Malienne d'Appui aux Meilleurs Élèves" 
                    className="relative z-20 w-80 h-80 md:w-96 md:h-96  rounded-full object-cover shadow-xl"
                  />
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce delay-1000"></div>
                
                {/* Floating Badges */}
                <div className="absolute -top-8 -left-8 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 animate-float">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                </div>
                <div className="absolute -bottom-8 -right-8 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 animate-float delay-1500">
                  <Award className="h-6 w-6 text-green-300" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {/* <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex flex-col items-center text-white/70">
          <span className="text-sm mb-2">Découvrir plus</span>
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <motion.div 
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div> */}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Hero;