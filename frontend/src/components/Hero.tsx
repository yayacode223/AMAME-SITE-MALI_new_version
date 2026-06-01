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
  { icon: Trophy, label: "Concours", color: "bg-amame-gold-subtle border-amame-gold/30 text-amame-gold", delay: 0 },
  { icon: BookOpen, label: "Orientation", color: "bg-blue-50 border-blue-200 text-blue-600", delay: 0.8 },
  { icon: GraduationCap, label: "Bourses", color: "bg-amame-green-subtle border-amame-green/30 text-amame-green", delay: 1.6 },
];

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Hero = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section
      className="relative overflow-hidden hero-bg-image"
      style={{ backgroundImage: "url(/images/heroes/hero-homepage.png)" }}
    >
      {/* ── Gradient overlays ── */}
      {/* Desktop — left→right: opaque white on text side, image reveals on right */}
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-white from-40% via-white/92 to-white/25 pointer-events-none" />
      {/* Desktop — top→bottom vignette */}
      <div className="absolute inset-0 hidden lg:block bg-gradient-to-b from-white/40 via-transparent to-white/50 pointer-events-none" />
      {/* Mobile — gradient vertical: opaque en haut (texte lisible), image visible en bas */}
      <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-white/88 from-0% via-white/65 via-55% to-white/30 pointer-events-none" />

      {/* ── Decorative dot grid (very subtle) ── */}
      <div className="absolute inset-0 opacity-[0.018] hero-dot-grid pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Left — Text content ─────────────────────────────── */}
          <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">

            {/* Badge */}
            {/* <motion.div
              custom={0}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-amame-green-dark text-sm font-semibold mb-6 border border-amame-green/25 shadow-sm"
            >
              <Star className="h-3.5 w-3.5 text-amame-gold fill-amame-gold" />
              Excellence Académique au Mali depuis 2023
            </motion.div> */}

            {/* Headline */}
            <motion.h1
              custom={1}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="font-nunito font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-amame-charcoal leading-[1.1] mb-6"
            >
              Votre Passerelle
              <span className="block text-amame-green mt-1">
                vers l'Excellence
              </span>
            </motion.h1>

            {/* Description */}
            {/* <motion.p
              custom={2}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-base sm:text-lg text-amame-slate leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
            >
              L'AMAME accompagne{" "}
              <span className="font-semibold text-amame-green">bénévolement</span>{" "}
              les élèves et étudiants maliens dans leur parcours académique — bourses,
              concours, orientation et actualités éducatives.
            </motion.p> */}

            {/* CTAs */}
            <motion.div
              custom={3}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold text-base px-7 py-6 rounded-xl shadow-green hover:shadow-lg transition-all"
              >
                {/* <Link to="/bourses" className="flex items-center gap-2">
                  Découvrir les bourses
                  <ArrowRight className="h-4 w-4" />
                </Link> */}
              </Button>

              {!isAuthenticated && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-amame-green text-amame-green hover:bg-amame-green-subtle font-semibold text-base px-7 py-6 rounded-xl transition-all bg-white/70 backdrop-blur-sm"
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
              className="mt-10 pt-8 border-t border-gray-200/80 grid grid-cols-3 gap-4"
            >
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-amame-gold" />
                    <span className="font-nunito font-black text-xl sm:text-2xl text-amame-charcoal">
                      {value}
                    </span>
                  </div>
                  <p className="text-xs text-amame-muted leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right — Floating badges over the background image ── */}
          {/* On desktop, these badges float over the visible background illustration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="hidden lg:flex flex-1 items-center justify-center relative h-72"
          >
            {/* AMAME logo badge — anchored in center */}
            <div className="relative z-10 w-20 h-20 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white bg-white">
              <img
                src="/amame-uploads/amame-logo.webp"
                alt="Logo AMAME"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating topic badges */}
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
                  className={`${positions[i]} animate-float z-10 float-delay-${i}`}
                >
                  <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${color} shadow-md backdrop-blur-sm text-xs font-semibold whitespace-nowrap bg-white/80`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </motion.div>
              );
            })}

            {/* Accent pulse dots */}
            <div className="absolute top-6 right-12 w-3 h-3 bg-amame-green rounded-full shadow-green animate-pulse opacity-70" />
            <div className="absolute bottom-10 left-4 w-2 h-2 bg-amame-gold rounded-full animate-pulse motion-delay-sm opacity-70" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
