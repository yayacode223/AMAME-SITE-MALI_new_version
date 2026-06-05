import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeroProps {
  icon: LucideIcon;
  label?: string;
  title: string;
  titleHighlight?: string;
  description: string;
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

  /* ── With background image — image pleine largeur, texte en overlay ── */
  if (imageSrc) {
    return (
      <section
        className="relative overflow-hidden border-b border-amame-border
                   min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex items-center
                   py-14 lg:py-20"
        aria-label={`${label ?? title} hero section`}
      >
        {/* Image pleine largeur */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
        </div>

        {/* Scrim desktop : dégradé gauche→droite, image visible à droite */}
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.50) 42%, rgba(0,0,0,0.10) 75%, transparent 100%)" }}
          aria-hidden="true"
        />
        {/* Scrim mobile : dégradé bas→haut */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.22) 100%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            {/* Icon + label pill */}
            <div className="inline-flex items-center gap-2.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 mb-6 shadow-sm">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 shrink-0">
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              {label && (
                <span className="text-white font-semibold text-xs tracking-widest uppercase">
                  {label}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-nunito font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl
                           text-white mb-5 leading-[1.1]">
              {title}{" "}
              {titleHighlight && (
                <span className="text-amame-green">{titleHighlight}</span>
              )}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl">
                {description}
              </p>
            )}
          </motion.div>
        </div>
      </section>
    );
  }

  /* ── Without image — layout centré original (inchangé) ── */
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
