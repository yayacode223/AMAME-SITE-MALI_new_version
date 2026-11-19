import { Button } from "@/components/ui/button";
import HeroVideo from "@/components/HeroVideo";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/userType";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

// Mêmes rôles que l'entrée « Mon espace membre » du menu de la navbar (Navbar.tsx).
const MEMBER_AREA_ROLES: Role[] = ["MEMBER", "ADMIN", "SUPERADMIN", "EDITOR"];

// Bouton d'action du hero, selon la règle du menu de la navbar (décision D4 bis du document
// docs/04-amelioration-design-accueil.md). Tant que l'utilisateur n'est pas connu, c'est le bouton
// des visiteurs : le message reste complet même si l'API tarde à répondre.
const heroAction = (role: Role | undefined) => {
  if (!role) return { to: "/adhesion", label: "Rejoindre l'AMAME" };
  if (MEMBER_AREA_ROLES.includes(role)) return { to: "/membre/dashboard", label: "Mon espace membre" };
  return { to: "/adhesion", label: "Adhérer à l'AMAME" };
};

const Hero = () => {
  const { user } = useAuth();
  const action = heroAction(user?.role);

  return (
    <section className="home-hero-height relative overflow-hidden flex items-end lg:items-center">

      {/* Layer 1 — Poster puis vidéo en boucle, et son bouton Pause (HeroVideo.tsx) */}
      <HeroVideo />

      {/* Layer 2 — Voiles de lisibilité, placés d'après la position du texte et non en % du hero :
          le contraste du texte reste suffisant sur les trois plans de la vidéo. */}
      {/* Desktop : dégradé gauche→droite. La colonne de texte se termine vers le centre de la page
          (colonne centrée de 1280 px) : le voile s'éclaircit à partir de là, image dégagée à droite. */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.7) calc(50% - 10rem), rgba(0,0,0,0.5) calc(50% + 6rem), rgba(0,0,0,0.15) calc(50% + 22rem), transparent calc(50% + 34rem))" }}
        aria-hidden="true"
      />
      {/* Mobile : dégradé bas→haut. Le texte, aligné en bas, occupe au plus 26rem : le voile est
          sombre sur cette hauteur quelle que soit celle de l'écran, l'image reste visible au-dessus. */}
      <div
        className="absolute inset-0 lg:hidden"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0, rgba(0,0,0,0.78) 12rem, rgba(0,0,0,0.6) 26rem, rgba(0,0,0,0.2) 100%)" }}
        aria-hidden="true"
      />

      {/* Layer 3 — Message, dans l'ordre de lecture : accroche, titre, phrase, bouton.
          Aligné à gauche à toutes les tailles, sur le bord de la colonne de la page. */}
      <div className="relative z-10 page-container pt-16 pb-8 lg:py-20">
        <div className="max-w-xl lg:max-w-[40rem] xl:max-w-[44rem]">

          <motion.p
            custom={0}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3 mb-3 lg:mb-4 text-sm sm:text-base font-semibold text-white"
          >
            <span className="h-0.5 w-8 shrink-0 rounded-full bg-amame-gold" aria-hidden="true" />
            Soutenir aujourd'hui… Bâtir demain
          </motion.p>

          <motion.h1
            custom={1}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="font-nunito font-black text-[2rem] min-[390px]:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
                       text-white leading-[1.1] mb-4 lg:mb-5"
          >
            Bourses, concours et orientation
            {/* Vert clair (green-400) : le vert de la marque (#16a34a) n'atteint pas 3:1 sur la vidéo */}
            <span className="block text-green-400 mt-1">pour les élèves maliens</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="text-white/90 text-base sm:text-lg leading-relaxed mb-6 lg:mb-8 max-w-md lg:max-w-lg"
          >
            Les opportunités pour réussir vos études, réunies au même endroit. Gratuit et bénévole.
          </motion.p>

          {/* Bouton d'action. « Explorer les bourses » a été retiré volontairement (décision D4) ;
              les chiffres « 500+ / 200+ / 100+ » aussi (décision D5). */}
          <motion.div
            custom={3}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Button
              asChild
              size="lg"
              className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold
                         text-base px-7 py-6 rounded-xl shadow-green hover:shadow-lg transition-all"
            >
              <Link to={action.to}>{action.label}</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
