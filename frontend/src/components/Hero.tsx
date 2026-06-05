import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Trophy, Users, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
  { value: "500+", label: "Étudiants accompagnés", icon: Users },
  { value: "200+", label: "Bourses référencées", icon: Award },
  { value: "100+", label: "Concours disponibles", icon: Trophy },
];

const floatingBadges = [
  { icon: Trophy,        label: "Concours",    color: "bg-amame-gold-subtle border-amame-gold/30 text-amame-gold",    delay: 0   },
  { icon: BookOpen,      label: "Orientation", color: "bg-blue-50 border-blue-200 text-blue-600",                     delay: 0.8 },
  { icon: GraduationCap, label: "Bourses",     color: "bg-amame-green-subtle border-amame-green/30 text-amame-green", delay: 1.6 },
];

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Hero = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden min-h-[600px] sm:min-h-[680px] lg:min-h-[720px] flex items-end lg:items-center">

      {/* Layer 1 — Image pleine largeur avec Ken Burns */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
        aria-hidden="true"
      >
        <img
          src="/images/heroes/hero-homepage.png"
          alt=""
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
      </motion.div>

      {/* Layer 2 — Scrim de lisibilité */}
      {/* Desktop : dégradé gauche→droite, image dégagée à droite */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.12) 70%, transparent 100%)" }}
        aria-hidden="true"
      />
      {/* Mobile : dégradé bas→haut, image visible en haut */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)" }}
        aria-hidden="true"
      />

      {/* Layer 3 — Contenu */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-16 lg:py-28 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center">

          {/* Colonne texte */}
          <div className="lg:w-[52%] lg:pr-12 text-center lg:text-left">

            <motion.h1
              custom={0}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="font-nunito font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
                         text-white leading-[1.1] mb-4 lg:mb-5"
            >
              Votre Passerelle
              <span className="block text-amame-green mt-1">vers l'Excellence</span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-white/80 text-base sm:text-lg leading-relaxed mb-5
                         max-w-sm mx-auto lg:mx-0 lg:max-w-none"
            >
              Bourses, concours et orientation pour les étudiants maliens.
              <span className="hidden sm:inline"> 100&nbsp;% gratuit et bénévole.</span>
            </motion.p>

            {/* Badges thématiques — mobile uniquement */}
            <motion.div
              custom={2}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center gap-2 mb-5 lg:hidden flex-wrap"
            >
              {floatingBadges.map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${color}
                              text-[11px] font-semibold bg-white shadow-sm`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              custom={3}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              {/* <Button
                asChild
                size="lg"
                className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold
                           text-base px-7 py-6 rounded-xl shadow-green hover:shadow-lg transition-all"
              >
                <Link to="/bourses">Explorer les bourses</Link>
              </Button> */}

              {!isAuthenticated && (
                <Button
                  asChild
                  size="lg"
                  className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold
                           text-base px-7 py-6 rounded-xl shadow-green hover:shadow-lg transition-all"
                >
                  <Link to="/adhesion">Rejoindre AMAME</Link>
                </Button>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              custom={4}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="mt-8 pt-7 border-t border-white/20 grid grid-cols-3 gap-4"
            >
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-amame-gold" />
                    <span className="font-nunito font-black text-xl sm:text-2xl text-white">
                      {value}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Colonne droite — badges flottants sur l'image, desktop uniquement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden lg:flex lg:w-[48%] items-center justify-center relative h-72"
          >
            <div className="relative z-10 w-20 h-20 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/30 bg-white">
              <img
                src="/amame-uploads/amame-logo.webp"
                alt="Logo AMAME"
                className="w-full h-full object-cover"
              />
            </div>

            {floatingBadges.map(({ icon: Icon, label, color, delay }, i) => {
              const positions = [
                "absolute top-0 left-8",
                "absolute top-4 right-0",
                "absolute bottom-0 left-1/2 -translate-x-1/2",
              ];
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + delay, duration: 0.5 }}
                  className={`${positions[i]} animate-float z-10`}
                >
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${color}
                                   shadow-md backdrop-blur-sm text-xs font-semibold whitespace-nowrap bg-white/90`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </motion.div>
              );
            })}

            <div className="absolute top-6 right-12 w-3 h-3 bg-amame-green rounded-full shadow-green animate-pulse opacity-70" />
            <div className="absolute bottom-10 left-4 w-2 h-2 bg-amame-gold rounded-full animate-pulse opacity-70" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
