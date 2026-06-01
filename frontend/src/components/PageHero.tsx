import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeroProps {
  icon: LucideIcon;
  label?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  /** Illustration used as CSS background-image for the hero section */
  imageSrc?: string;
  imageAlt?: string;
}

const PageHero = ({
  icon: Icon,
  label,
  title,
  titleHighlight,
  description,
  imageSrc,
}: PageHeroProps) => {

  /* ── With background image — immersive editorial layout ────── */
  if (imageSrc) {
    return (
      <section
        className="relative overflow-hidden border-b border-amame-border py-14 lg:py-20 page-hero-bg-image"
        style={{ backgroundImage: `url(${imageSrc})` }}
        aria-label={`${label ?? title} hero section`}
      >
        {/* ── Gradient overlays ── */}
        {/* Desktop — left→right: texte lisible à gauche, image révélée à droite */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#f0fdf4] from-20% via-[#f0fdf4]/88 to-[#f0fdf4]/10 pointer-events-none" />
        {/* Desktop — vignette top→bottom */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-b from-[#f0fdf4]/50 via-transparent to-[#f0fdf4]/60 pointer-events-none" />
        {/* Mobile — gradient vertical: fort en haut (lisibilité), image visible en bas */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-[#f0fdf4]/85 from-0% via-[#f0fdf4]/60 via-50% to-[#f0fdf4]/25 pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            {/* Icon + label pill */}
            <div className="inline-flex items-center gap-2.5 bg-white/75 backdrop-blur-sm border border-amame-green/25 rounded-full px-4 py-2 mb-6 shadow-sm">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amame-green-light shrink-0">
                <Icon className="h-3.5 w-3.5 text-amame-green" />
              </div>
              {label && (
                <span className="text-amame-green font-semibold text-xs tracking-widest uppercase">
                  {label}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-nunito font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-amame-charcoal mb-5 leading-[1.1]">
              {title}{" "}
              {titleHighlight && (
                <span className="text-amame-green">{titleHighlight}</span>
              )}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-amame-slate leading-relaxed max-w-xl">
              {description}
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Without image — original centered layout (unchanged) ──── */
  return (
    <section className="page-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amame-green-light mb-4 mx-auto">
            <Icon className="h-7 w-7 text-amame-green" />
          </div>

          {label && <p className="section-label mb-2">{label}</p>}

          <h1 className="font-nunito font-black text-3xl sm:text-4xl lg:text-5xl text-amame-charcoal mb-4 leading-tight">
            {title}{" "}
            {titleHighlight && (
              <span className="text-amame-green">{titleHighlight}</span>
            )}
          </h1>

          <p className="text-base sm:text-lg text-amame-muted max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PageHero;
