import { motion } from "framer-motion";
import type { StaticImageName } from "@/generated/staticImages";
import StaticImage from "@/components/StaticImage";
import { LucideIcon } from "lucide-react";

interface PageHeroProps {
  icon: LucideIcon;
  label?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  /** Image de fond : nom d'une image statique (src/generated/staticImages.ts). */
  image?: StaticImageName;
  imageAlt?: string;
}

const PageHero = ({
  icon: Icon,
  label,
  title,
  titleHighlight,
  description,
  image,
}: PageHeroProps) => {

  /* ── With background image — image pleine largeur, texte en overlay ── */
  if (image) {
    return (
      <section
        className="relative overflow-hidden border-b border-amame-border
                   min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex items-center
                   py-14 lg:py-20"
        aria-label={`${label ?? title} hero section`}
      >
        {/* Image pleine largeur */}
        <div className="absolute inset-0" aria-hidden="true">
          <StaticImage
            name={image}
            sizes="100vw"
            priority
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Voile noir, le plus sombre sous le texte : dégradé vers la droite sur ordinateur, toute la photo
            sur téléphone (.amame-hero-scrim, docs/06, E9). L'ancien laissait des titres et le mot en vert sous le seuil. */}
        <div className="absolute inset-0 amame-hero-scrim" aria-hidden="true" />

        <div className="relative z-10 page-container">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            {/* Icon + label pill : vert plein, le blanc y reste à 5:1 quelle que soit la photo (blanc translucide : 2,9 à 4,2:1) */}
            <div className="inline-flex items-center gap-2.5 bg-amame-green-dark border border-white/20 rounded-full px-4 py-2 mb-6 shadow-sm">
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
              {/* Vert clair : le vert de la marque (#16a34a) tombait à 1,0:1 sur le voile sombre */}
              {titleHighlight && (
                <span className="text-green-300">{titleHighlight}</span>
              )}
            </h1>

            {/* Description */}
            {description && (
              <p className="text-base sm:text-lg text-white leading-relaxed max-w-xl">
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
      <div className="page-container text-center">
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
